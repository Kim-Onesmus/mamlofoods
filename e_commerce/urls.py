from django.urls import path
from . import views


urlpatterns = [
    path('', views.Home, name='home'),
    path('store/product/<slug:slug>/', views.ProductDetails, name='product_details'),
    path('store/cart/', views.Cart, name='cart'),
    path('store/checkout/', views.Checkout, name='checkout'),
    path('store/orders/', views.MyOrders, name='order_page'),
    path('store/orders/json/', views.user_orders_json, name='user_orders_json'),
    path('store/register/', views.Register, name='register_page'),
    path('store/login/', views.Login, name='login_page'),
    path('store/logout/', views.Logout, name='logout'),
    path('store/account/', views.Account, name='account'),
    path('store/products-json/', views.products_json, name='products_json'),
    path('store/product-json/<slug:slug>/', views.product_json, name='product_json'),
    path('store/addresses/', views.get_addresses, name='get_addresses'),
    path('store/address/add/', views.add_address, name='add_address'),
    path('store/order/create/', views.create_order, name='create_order'),
    path('store/orders/cancel/<str:order_id>/', views.cancel_order, name='cancel_order'),
    path('store/submit-review/', views.submit_review, name='submit_review'),

    path('store/c2b/callback', views.Callback, name="callback"),
    path('store/check_payment', views.CheckPayment, name='check_payment'),
    path('store/repay_orders/', views.RepayOrder, name='repay_order'),

]