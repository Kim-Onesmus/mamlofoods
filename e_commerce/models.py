from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.urls import reverse
import uuid
from ckeditor_uploader.fields import RichTextUploadingField
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None  # Disable username field
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=30, blank=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=True)
    phone_number = models.CharField(_('phone number'), max_length=15, blank=True)
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    is_active = models.BooleanField(_('active'), default=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('product name'), max_length=200)
    slug = models.SlugField(_('slug'), max_length=200, unique=True, blank=True)
    product_code = models.CharField(_('product code'), max_length=50, unique=True, blank=True)
    size_or_weight = models.CharField(_('size or weight'), max_length=100, help_text=_('e.g., 500g, 1L, Large, etc.'))
    image = models.ImageField(_('product image'), upload_to='products/')
    date_added = models.DateTimeField(_('date added'), auto_now_add=True)
    price = models.DecimalField(_('price'), max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(_('products in stock'), default=0)
    description = RichTextUploadingField(_('description'))
    is_active = models.BooleanField(_('active'), default=True)

    class Meta:
        verbose_name = _('product')
        verbose_name_plural = _('products')
        ordering = ['-date_added']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Auto-generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Auto-generate product code if not provided
        if not self.product_code:
            # Generate a unique product code based on name and ID
            base_code = slugify(self.name).upper()[:8]
            self.product_code = f"{base_code}-{str(self.id)[:8].upper()}"
        
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('product_detail', kwargs={'slug': self.slug})

    @property
    def is_in_stock(self):
        return self.stock_quantity > 0

    @property
    def stock_status(self):
        if self.stock_quantity == 0:
            return _('Out of Stock')
        elif self.stock_quantity <= 10:
            return _('Low Stock')
        else:
            return _('In Stock')

class Address(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='addresses')
    county = models.CharField(max_length=100)
    subcounty = models.CharField(max_length=100)
    town = models.CharField(max_length=100)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    is_default = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Addresses'
        ordering = ['-is_default', '-date_added']

    def __str__(self):
        return f"{self.user.email}'s address in {self.town}, {self.county}"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Set all other addresses of this user to non-default
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        # If this is the user's first address, make it default
        elif not self.pk and not Address.objects.filter(user=self.user).exists():
            self.is_default = True
        super().save(*args, **kwargs)

def generate_order_id():
    """Generates a unique, human-readable order ID."""
    date_part = timezone.now().strftime('%Y%m%d')
    random_part = uuid.uuid4().hex[:6].upper()
    return f'ORD-{date_part}-{random_part}'

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    # Keep the default integer PK for internal relations, add a human-readable ID for customers.
    order_id = models.CharField(max_length=100, unique=True, editable=False, default=generate_order_id)
    user = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    shipping_address = models.CharField(max_length=512)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    payment_method = models.CharField(max_length=20, default='mpesa')
    mpesa_phone = models.CharField(max_length=20, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_id} - {self.name}"

    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = generate_order_id()
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    size_or_weight = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.product.name if self.product else 'Unknown Product'} x {self.quantity} (Order #{self.order.order_id})"

