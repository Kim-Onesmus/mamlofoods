from django.contrib import admin
from .models import Vacancy, Blog, Partner, Number, ContactMessage, Staff, Advisor

@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ('title', 'deadline', 'description_file', 'created_at')
    list_editable = ('deadline', 'description_file')
    search_fields = ('title',)
    ordering = ('-deadline',)

    fieldsets = (
        (None, {
            'fields': ('title', 'image', 'description_file', 'deadline')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )
    readonly_fields = ('created_at',)


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'author', 'date_published')
    list_editable = ('author',)
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ('title', 'author')
    ordering = ('-date_published',)

    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'author')
        }),
        ('Content', {
            'fields': ('featured_image', 'content')
        }),
        ('Publication Info', {
            'fields': ('date_published',),
            'classes': ('collapse',),
        }),
    )
    readonly_fields = ('date_published',)


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ('id', 'image')
    
    fieldsets = (
        (None, {
            'fields': ('image',)
        }),
    )


@admin.register(Number)
class NumberAdmin(admin.ModelAdmin):
    list_display = ('name', 'number')
    list_editable = ('number',)
    search_fields = ('name',)

    fieldsets = (
        (None, {
            'fields': ('name', 'number')
        }),
    )

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'created_at')
    search_fields = ('name', 'email', 'message')
    readonly_fields = ('created_at',)


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'linkedIn_profile_link')
    search_fields = ('name', 'role')
    readonly_fields = ('id',)
    ordering = ('-created_at',)


@admin.register(Advisor)
class AdvisorAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'linkedIn_profile_link')
    search_fields = ('name', 'role')
    readonly_fields = ('id',)
    ordering = ('-created_at',)