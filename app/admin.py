from django.contrib import admin
from .models import Blog
from django.utils.html import format_html
from django.utils.text import Truncator


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('short_title', 'author', 'thumbnail', 'published_at', 'is_recent')
    readonly_fields = ('slug', 'published_at', 'updated_at')
    search_fields = ('title', 'content', 'author__username')
    list_filter = ('published_at', 'author')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('-published_at',)
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'author', 'featured_image', 'content')
        }),
        ('Timestamps', {
            'fields': ('published_at', 'updated_at')
        }),
    )

    def short_title(self, obj):
        return Truncator(obj.title).chars(30)
    short_title.short_description = 'Title'

    def thumbnail(self, obj):
        if obj.featured_image:
            return format_html('<img src="{}" width="60" height="40" style="object-fit:cover; border-radius:4px;" />', obj.featured_image.url)
        return "-"
    thumbnail.short_description = 'Image'

    def is_recent(self, obj):
        return obj.published_at.date() == obj.updated_at.date()
    is_recent.boolean = True
    is_recent.short_description = 'Updated Today?'
