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
    user_orders = Order.objects.filter(user=request.user).select_related('user').prefetch_related('items')

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
                return JsonResponse({'success': True, 'redirect': request.GET.get('next', '/store/')})
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

        print('cart:', cart)  # Debug print

        if not cart or not shipping_address or not name or not email or not phone:
            return JsonResponse({'success': False, 'error': 'Missing required fields'})

        total = Decimal('0')
        for item in cart:
            product = Product.objects.filter(slug=item.get('slug')).first()
            if not product:
                return JsonResponse({'success': False, 'error': f"Product not found: {item.get('slug')}"})
            total += product.price * int(item.get('quantity', 1))

        shipping_fee = Decimal('150') if total > 0 else Decimal('0')
        grand_total = total + shipping_fee

        order = Order.objects.create(
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

        for item in cart:
            product = Product.objects.filter(slug=item.get('slug')).first()
            if product:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=int(item.get('quantity', 1)),
                    price=product.price,
                    size_or_weight=product.size_or_weight,
                )

        return JsonResponse({
            'success': True,
            'order_id': order.order_id,
            'total': str(order.total),
            'status': order.status
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    
    
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

