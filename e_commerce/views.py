from django.shortcuts import render

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