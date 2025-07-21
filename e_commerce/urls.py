from django.urls import path
from . import views


urlpatterns = [
    path('', views.Home, name='home'),
    path('product/<slug:slug>/', views.ProductDetails, name='product_details'),
    path('cart/', views.Cart, name='cart'),
    path('checkout/', views.Checkout, name='checkout'),
    path('orders/', views.MyOrders, name='order_page'),
    path('orders/json/', views.user_orders_json, name='user_orders_json'),
    path('register/', views.Register, name='register_page'),
    path('login/', views.Login, name='login_page'),
    path('logout/', views.Logout, name='logout'),
    path('account/', views.Account, name='account'),
    path('products-json/', views.products_json, name='products_json'),
    path('product-json/<slug:slug>/', views.product_json, name='product_json'),
    path('addresses/', views.get_addresses, name='get_addresses'),
    path('address/add/', views.add_address, name='add_address'),
    path('order/create/', views.create_order, name='create_order'),
]