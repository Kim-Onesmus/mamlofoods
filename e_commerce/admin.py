from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import CustomUser, Product, Address, Order, OrderItem, ProductReview

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    
    # Fields to display in the user list
    list_display = ('email', 'first_name', 'last_name', 'phone_number', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)
    
    # Fieldsets for the add/edit form
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone_number')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fieldsets for the add form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'phone_number', 'password1', 'password2'),
        }),
    )
    
    # Make date_joined readonly
    readonly_fields = ('date_joined',)

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'product_code', 'price', 'stock_quantity', 'stock_status_display', 'is_active', 'date_added')
    list_filter = ('is_active', 'date_added', 'stock_quantity')
    search_fields = ('name', 'product_code', 'description')
    readonly_fields = ('id', 'product_code', 'date_added')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('-date_added',)
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('name', 'size_or_weight', 'price')
        }),
        (_('Inventory'), {
            'fields': ('stock_quantity', 'is_active')
        }),
        (_('Media'), {
            'fields': ('image',)
        }),
        (_('Description'), {
            'fields': ('description',),
            'classes': ('wide',)
        }),
        (_('System Information'), {
            'fields': ('id', 'date_added', 'slug', 'product_code'),
            'classes': ('collapse',)
        }),
    )
    
    def stock_status_display(self, obj):
        if obj.stock_quantity == 0:
            return format_html('<span style="color: red;">Out of Stock</span>')
        elif obj.stock_quantity <= 10:
            return format_html('<span style="color: orange;">Low Stock ({})</span>', obj.stock_quantity)
        else:
            return format_html('<span style="color: green;">In Stock ({})</span>', obj.stock_quantity)
    
    stock_status_display.short_description = _('Stock Status')
    stock_status_display.admin_order_field = 'stock_quantity'

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'county', 'subcounty', 'town', 'is_default', 'date_added')
    list_filter = ('is_default', 'county', 'subcounty', 'town')
    search_fields = ('user__email', 'county', 'subcounty', 'town', 'address_line1')
    readonly_fields = ('id', 'date_added', 'last_updated')
    ordering = ('-is_default', '-date_added')
    raw_id_fields = ('user',)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price', 'size_or_weight')
    can_delete = False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'name', 'email', 'total', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'order_id', 'phone', 'mpesa_phone')
    date_hierarchy = 'created_at'
    readonly_fields = (
        'order_id', 'user', 'shipping_address', 'name', 'email', 'phone', 'mpesa_phone',
        'total', 'payment_method', 'receipt_number', 'transaction_date',
        'merchant_request_id', 'checkout_request_id', 'result_code', 'result_desc', 'created_at', 'updated_at'
    )
    fieldsets = (
        ('Customer Info', {
            'fields': ('order_id', 'user', 'name', 'email', 'phone', 'mpesa_phone', 'shipping_address')
        }),
        ('Order Details', {
            'fields': ('total', 'payment_method', 'status')
        }),
        ('Payment Response', {
            'classes': ('collapse',),
            'fields': (
                'receipt_number', 'transaction_date', 'merchant_request_id',
                'checkout_request_id', 'result_code', 'result_desc'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    inlines = [OrderItemInline]



@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price')
    search_fields = ('product', 'order__order_id')


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__username', 'content')
    readonly_fields = ('created_at',)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Product, ProductAdmin)
