from django.shortcuts import render
from django.http import JsonResponse
from .models import Product

# Create your views here.
def Home(request):
    return render(request, 'e_commerce/home.html')

def ProductDetails(request):
    return render(request, 'e_commerce/product_details.html')

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