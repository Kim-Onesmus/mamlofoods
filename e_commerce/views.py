from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import Product
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as auth_login, update_session_auth_hash, logout
from django.views.decorators.http import require_POST
from .models import CustomUser
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Address
from decimal import Decimal
from .models import Order, OrderItem, ProductReview
from django.db.models import Avg
from django.db import transaction
from django.contrib import messages
import os, base64, requests
from django.urls import reverse

# Create your views here.
def Home(request):
    return render(request, 'e_commerce/home.html')

def ProductDetails(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)
    reviews = ProductReview.objects.filter(product=product).select_related('user').order_by('-created_at')

    average = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
    full_stars = int(average)
    half_star = 1 if (average - full_stars) >= 0.5 else 0
    empty_stars = 5 - full_stars - half_star

    review_count = reviews.count()

    return render(request, 'e_commerce/product_details.html', {
        'product': product,
        'reviews': reviews,
        'average_rating': round(average, 1),
        'full_stars': full_stars,
        'half_star': half_star,
        'empty_stars': empty_stars,
        'review_count': review_count,
    })


def Cart(request):
    return render(request, 'e_commerce/cart.html')

@login_required
def Checkout(request):
    return render(request, 'e_commerce/checkout.html')

@login_required(login_url='login_page')
def MyOrders(request):
    user_orders = Order.objects.filter(user=request.user).select_related('user').prefetch_related('items').order_by('-created_at')

    context = {
        'unpaid_orders': user_orders.filter(status='pending'),
        'confirmed_orders': user_orders.filter(status='paid'),
        'intransit_orders': user_orders.filter(status='processing'),
        'shipped_orders': user_orders.filter(status='shipped'),
        'completed_orders': user_orders.filter(status='completed'),
        'cancelled_orders': user_orders.filter(status='cancelled'),
    }
    return render(request, 'e_commerce/my_orders.html', context)


@require_POST
@login_required
def submit_review(request):
    item_id = request.POST.get('item_id')

    print("Received item_id:", item_id)

    rating = request.POST.get('rating')
    print("rating", rating)
    content = request.POST.get('content')
    print("Content", content)

    try:
        item = OrderItem.objects.get(id=item_id, order__user=request.user)

        if item.reviewed:
            return JsonResponse({'success': False, 'message': 'This product is already reviewed.'})

        ProductReview.objects.create(
            user=request.user,
            product=item.product,
            rating=rating,
            content=content
        )

        item.reviewed = True
        item.save()

        order = item.order
        if all(i.reviewed for i in order.items.all()):
            order.status = 'completed'
            order.save()

        return JsonResponse({'success': True, 'message': 'Review submitted successfully.'})

    except OrderItem.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Invalid order item.'})


@csrf_exempt
def Register(request):
    if request.method == 'POST' and request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            confirm = data.get('confirm_password', '')
            if not email or not password or not confirm:
                return JsonResponse({'success': False, 'error': 'All fields are required.'})
            if password != confirm:
                return JsonResponse({'success': False, 'error': 'Passwords do not match.'})
            if CustomUser.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'Email already registered.'})
            user = CustomUser.objects.create_user(email=email, password=password)
            user.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return render(request, 'e_commerce/register.html')

@csrf_exempt
def Login(request):
    if request.method == 'POST' and request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            user = authenticate(request, username=email, password=password)
            if user is not None:
                auth_login(request, user)
                return JsonResponse({'success': True, 'redirect': request.GET.get('next', '/')})
            else:
                return JsonResponse({'success': False, 'error': 'Invalid email or password.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return render(request, 'e_commerce/login.html')

@login_required(login_url='login_page')
def Account(request):
    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
            user = request.user

            # Differentiate between password and profile update
            if 'new_password' in data:
                # Password update logic
                current_password = data.get('current_password')
                new_password = data.get('new_password')
                confirm_password = data.get('confirm_password')

                if not user.check_password(current_password):
                    return JsonResponse({'success': False, 'error': 'Incorrect current password.'})
                if new_password != confirm_password:
                    return JsonResponse({'success': False, 'error': 'New passwords do not match.'})

                user.set_password(new_password)
                user.save()
                update_session_auth_hash(request, user)  # Keeps user logged in
                return JsonResponse({'success': True})

            else:
                # Profile update logic
                user.first_name = data.get('first_name', user.first_name)
                user.last_name = data.get('last_name', user.last_name)
                user.phone_number = data.get('phone_number', user.phone_number)
                user.save()
                return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': 'An unexpected error occurred.'})

    return render(request, 'e_commerce/account.html')

def Logout(request):
    logout(request)
    return redirect('home')

def products_json(request):
    products = Product.objects.filter(is_active=True).order_by('-date_added')
    data = [
        {
            'id': str(p.id),
            'name': p.name,
            'slug': p.slug,
            'product_code': p.product_code,
            'size_or_weight': p.size_or_weight,
            'image': p.image.url if p.image else '',
            'date_added': p.date_added.strftime('%Y-%m-%d'),
            'price': float(p.price),
            'stock_quantity': p.stock_quantity,
            'description': p.description,
            'stock_status': p.stock_status,
        }
        for p in products
    ]
    
    return JsonResponse({'products': data})

@require_GET
def product_json(request, slug):
    try:
        product = Product.objects.get(slug=slug, is_active=True)
        data = {
            'id': str(product.id),
            'name': product.name,
            'slug': product.slug,
            'product_code': product.product_code,
            'size_or_weight': product.size_or_weight,
            'image': product.image.url if product.image else '',
            'date_added': product.date_added.strftime('%Y-%m-%d'),
            'price': float(product.price),
            'stock_quantity': product.stock_quantity,
            'description': product.description,
            'stock_status': product.stock_status,
        }
        return JsonResponse({'success': True, 'product': data})
    except Product.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)

@login_required(login_url='login_page')
def get_addresses(request):
    addresses = Address.objects.filter(user=request.user)
    return JsonResponse({
        'success': True,
        'addresses': [{
            'id': str(addr.id),  # Convert UUID to string
            'county': addr.county,
            'subcounty': addr.subcounty,
            'town': addr.town,
            'address_line1': addr.address_line1,
            'address_line2': addr.address_line2,
            'is_default': addr.is_default
        } for addr in addresses]
    })

@login_required(login_url='login_page')
def add_address(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method'})
    
    try:
        data = json.loads(request.body)
        print("Received address data:", data)  # Debug print
        
        # Validate required fields
        required_fields = ['county', 'subcounty', 'town', 'address_line1']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return JsonResponse({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            })
            
        address = Address.objects.create(
            user=request.user,
            county=data['county'],
            subcounty=data['subcounty'],
            town=data['town'],
            address_line1=data['address_line1'],
            address_line2=data.get('address_line2', '')
        )
        print("Created address:", address)  # Debug print
        
        return JsonResponse({
            'success': True,
            'address_id': str(address.id)
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        })
    except KeyError as e:
        return JsonResponse({
            'success': False,
            'error': f'Missing required field: {str(e)}'
        })
    except Exception as e:
        print("Error saving address:", str(e))  # Debug print
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@login_required(login_url='login_page')
@csrf_exempt
def create_order(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method'})

    try:
        data = json.loads(request.body)
        cart = data.get('cart', [])
        shipping_address = data.get('shipping_address', '')
        payment_method = data.get('payment_method', 'mpesa')
        mpesa_phone = data.get('mpesa_phone', '')
        name = data.get('name', '')
        email = data.get('email', '')
        phone = data.get('phone', '')


        if not cart or not shipping_address or not name or not email or not phone:
            return JsonResponse({'success': False, 'error': 'Missing required fields'})
        
        if mpesa_phone.startswith('+254'):
            mpesa_phone = '254' + mpesa_phone[4:]
        elif mpesa_phone.startswith('07') or mpesa_phone.startswith('01'):
            mpesa_phone = '254' + mpesa_phone[1:]
        elif mpesa_phone.startswith('254') and len(mpesa_phone) == 12:
            pass

        total = Decimal('0')
        for item in cart:
            product = Product.objects.filter(slug=item.get('slug')).first()
            if not product:
                return JsonResponse({'success': False, 'error': f"Product not found: {item.get('slug')}"})
            total += product.price * int(item.get('quantity', 1))

        shipping_fee = Decimal('150') if total > 0 else Decimal('0')
        grand_total = int(total)

        print('Grand Total:', grand_total, 'Shipping Fee:', shipping_fee)

        with transaction.atomic():
            order = Order(
                user=request.user,
                shipping_address=shipping_address,
                name=name,
                email=email,
                phone=phone,
                payment_method=payment_method,
                mpesa_phone=mpesa_phone,
                total=grand_total,
                status='pending',
            )

            order_items_to_create = []

            for item in cart:
                product = Product.objects.filter(slug=item.get('slug')).first()
                
                if not product:
                    messages.error(request, 'One or more products in your cart are no longer available.')
                    return JsonResponse({'status': 500, 'message': 'Some products are no longer available.'})

                requested_quantity = int(item.get('quantity', 1))

                if product.stock_quantity < requested_quantity:
                    messages.error(request, f"Not enough stock for {product.name}. Available: {product.stock_quantity}")
                    return JsonResponse({'status': 400, 'message': f"Not enough stock for {product.name}. Only {product.stock_quantity} left."})

                order_item = OrderItem(
                    order=order,  # still unsaved, OK for now
                    product=product,
                    quantity=requested_quantity,
                    price=product.price,
                    size_or_weight=product.size_or_weight,
                )
                order_items_to_create.append(order_item)

            order.save()
            OrderItem.objects.bulk_create(order_items_to_create)
            
            order_id = order.order_id
            print('order id', order_id)
            payment_response = MakePayments(request, mpesa_phone, grand_total, order_id)
            data = json.loads(payment_response.content)

            print('Payment Response:', data)

            if data['status'] != 200:
                transaction.set_rollback(True)
                messages.error(request, 'An error occurred while initiating STK push')
                return JsonResponse({'status': 500, 'message': data['message']})
            else:
                return JsonResponse({
                    'status': 200,
                    'message': data['message'],
                    'order_id': order_id
                })
            
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
        



def AccessToken(request):
    client_id = os.getenv('KCB_CONSUMER_KEY')
    client_secret = os.getenv('KCB_CONSUMER_SECRET')
    auth_value = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    url = f"{os.getenv('KCB_BASE_URL')}/token?grant_type=client_credentials"
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': f'Basic {auth_value}'
    }
    response = requests.post(url, headers=headers)
    
    if response.status_code == 200:
        token = response.json().get('access_token')
        return token 
    return JsonResponse({'error': 'Unable to retrieve access token'}, status=500)


@csrf_exempt
def MakePayments(request, mpesa_phone, grand_total, order_id):
    access_token = AccessToken(request)
    if access_token is None:
        return JsonResponse({
            'status': 500,
            'message': 'Failed to obtain access token.',
        })

    url = f"{os.getenv('KCB_BASE_URL')}/mm/api/request/1.0.0/stkpush"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }


    payload = {
        "phoneNumber": mpesa_phone,
        "amount": str(grand_total),  
        "invoiceNumber": f"7932911-Kim_Technologies",
        "sharedShortCode": True,
        "orgShortCode": "",
        "orgPassKey": "",
        "callbackUrl": request.build_absolute_uri(reverse('callback')) + f"?order_id={order_id}",
        "transactionDescription": "Buy sanitary pads"
    }
    
    callback_url = request.build_absolute_uri(reverse('callback')) + f"?order_id={order_id}"
    print("KCB CALLBACK URL:", callback_url)

    try:
        response = requests.post(url, headers=headers, json=payload)
        response_data = response.json().get('response', {})
        print('Response', response.json())

        if response.status_code == 200 and response_data.get('ResponseCode') == '0':
            order = Order.objects.get(order_id=order_id)
            order.result_code = None
            order.result_desc = ""
            order.save()
            return JsonResponse({
                'status': 200,
                'message': '📲 STK Push Sent! ✅ Check your 📱 phone to complete the payment. 💳',
            })
        else:
            print(f"KCB API Error: {response.status_code}, {response_data}")
            return JsonResponse({
                'status': 500,
                'message': response_data.get('ResponseDescription', f"KCB API error: {response.status_code}, {response_data} Please try again"), # include response data
            })
    except requests.exceptions.RequestException as e:
        print(f"Request Exception: {e}")
        return JsonResponse({
            'status': 500,
            'message': f"Failed to connect to KCB: {e}",
        })
    except Exception as e:
        print(f"General Exception: {e}")
        return JsonResponse({
                'status': 500,
                'message': f"An error occurred: {e}",
            })


@csrf_exempt
def Callback(request):
    print('Callback received, Processing data')
    if request.method == "POST":
        try:
            order_id = request.GET.get("order_id")
            print('Order Id', order_id)
            if not order_id:
                return JsonResponse({"error": "Order id not provided in callback URL"}, status=400)
            
            callback_data = json.loads(request.body)
            print('Callback Data', callback_data)

            stk_callback = callback_data.get("Body", {}).get("stkCallback", {})
            result_code = stk_callback.get("ResultCode", None)
            result_desc = stk_callback.get("ResultDesc", "")
            merchant_request_id = stk_callback.get("MerchantRequestID", "")
            checkout_request_id = stk_callback.get("CheckoutRequestID", "")
            callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])

            amount = None
            receipt_number = None
            transaction_date = None
            phone_number = None

            for item in callback_metadata:
                name = item.get("Name")
                value = item.get("Value", None)
                if name == "Amount":
                    amount = value
                elif name == "MpesaReceiptNumber":
                    receipt_number = value
                elif name == "TransactionDate":
                    transaction_date = value
                elif name == "PhoneNumber":
                    phone_number = value


            if result_code == 0:
                order = Order.objects.get(order_id=order_id)
                order_items = OrderItem.objects.filter(order=order)

                # Update order details
                order.receipt_number = receipt_number
                order.merchant_request_id = merchant_request_id
                order.checkout_request_id = checkout_request_id
                order.result_desc = result_desc
                order.result_code = result_code
                order.status = 'paid'  # or 'processing' depending on your flow
                order.save()

                # Deduct quantities from products
                for item in order_items:
                    product = item.product
                    if product and product.stock_quantity >= item.quantity:
                        product.stock_quantity -= item.quantity
                        product.save()
                    elif product:
                        # You may log a warning or take other actions here if stock is insufficient
                        print(f"Warning: Not enough stock for {product.name}")

                return JsonResponse({
                    'status': 200,
                    'message': 'Payment Successful',
                })

            else:
                order = Order.objects.get(order_id=order_id)
                print('order', order)
                order.merchant_request_id = merchant_request_id
                order.checkout_request_id = checkout_request_id
                order.result_desc = result_desc
                order.result_code = result_code
                order.save()
                return JsonResponse({
                    'status': 500,
                    'message': f'{result_desc}',
                })
            
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
    return JsonResponse({"error": "Invalid request"}, status=400)    



@csrf_exempt
def RepayOrder(request):
    if request.method != 'POST':
        return JsonResponse({'status': 405, 'message': 'Method not allowed'}, status=405)
    try:
        data = json.loads(request.body)
        print('Json data', data)
        mpesa_phone = data.get("mpesa_number")
        totals = data.get("total")
        order_id = data.get("order_id")
        total = int(float(totals))
        print('Total', total)

        if mpesa_phone.startswith('+254'):
            mpesa_phone = '254' + mpesa_phone[4:]
        elif mpesa_phone.startswith('07') or mpesa_phone.startswith('01'):
            mpesa_phone = '254' + mpesa_phone[1:]
        elif mpesa_phone.startswith('254') and len(mpesa_phone) == 12:
            pass
        else:
            messages.error(request, 'Enter a valid Mpesa phone')
            return JsonResponse({'status': 500, 'message': data['message']})
        
        payment_response = MakePayments(request, mpesa_phone, total, order_id)
        data = json.loads(payment_response.content)
        if data['status'] != 200:
            messages.error(request, 'An error occurred while initiating STK push')
            return JsonResponse({'status': 500, 'message': data['message']})
        else:
            return JsonResponse({
                'status': 200,
                'message': data['message'],
                'order_id': order_id
            })
    except:
        messages.error(request, 'An error occurred while initiating STK push')
        return JsonResponse({'status': 500, 'message': data['message']})


def CheckPayment(request):
    order__id = request.GET.get('order_id')
    if not order__id:
        return JsonResponse({'status': 400, 'message': 'Order ID is required...'})

    try:
        order = Order.objects.get(order_id=order__id)
    except Order.DoesNotExist:
        return JsonResponse({'status': 404, 'message': 'Order record not found.'})
    
    result_code = int(order.result_code) if order.result_code is not None else None
    
    if result_code is None:
        return JsonResponse({
            'status': 202, 
            'message': 'Checking payment, please wait...'
        })
    elif result_code == 0:
        return JsonResponse({'status': 200, 'message': order.result_desc})
    else:
        return JsonResponse({'status': 201, 'message': order.result_desc})



    
@login_required(login_url='login_page')
def user_orders_json(request):
    orders = request.user.orders.prefetch_related('items').order_by('-created_at')
    data = []
    for order in orders:
        data.append({
            'order_id': order.order_id,
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
            'status': order.get_status_display(),
            'total': str(order.total),
            'shipping_address': order.shipping_address,
            'items': [
                {
                    'product_name': item.product,
                    'quantity': item.quantity,
                } for item in order.items.all()
            ]
        })
    return JsonResponse({'orders': data})


@csrf_exempt
def cancel_order(request, order_id):
    if request.method == 'POST':
        order = get_object_or_404(Order, order_id=order_id)
        order.status = 'cancelled'
        order.save()
    return redirect('order_page')

