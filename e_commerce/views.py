from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import Product
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as auth_login, update_session_auth_hash, logout
from .models import CustomUser
from django.views.decorators.csrf import csrf_exempt
import json

# Create your views here.
def Home(request):
    return render(request, 'e_commerce/home.html')

def ProductDetails(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)
    return render(request, 'e_commerce/product_details.html', {'product': product})

def Cart(request):
    return render(request, 'e_commerce/cart.html')

@login_required
def Checkout(request):
    return render(request, 'e_commerce/checkout.html')

def MyOrders(request):
    return render(request, 'e_commerce/my_orders.html')

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

@login_required
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