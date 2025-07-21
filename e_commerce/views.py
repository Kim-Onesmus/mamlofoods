from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Product
from django.views.decorators.http import require_GET

# Create your views here.
def Home(request):
    return render(request, 'e_commerce/home.html')

def ProductDetails(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)
    return render(request, 'e_commerce/product_details.html', {'product': product})

def Cart(request):
    return render(request, 'e_commerce/cart.html')

def Checkout(request):
    return render(request, 'e_commerce/checkout.html')

def MyOrders(request):
    return render(request, 'e_commerce/my_orders.html')

def Register(request):
    return render(request, 'e_commerce/register.html')

def Login(request):
    return render(request, 'e_commerce/login.html')

def Account(request):
    return render(request, 'e_commerce/account.html')

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