import uuid
import os
from django.db import models
from django.utils.text import slugify
from ckeditor_uploader.fields import RichTextUploadingField

def upload_blog_image(instance, filename):
    name = slugify(instance.title)[:50]
    ext = filename.split('.')[-1]
    return f"blogs/{name}.{ext}"

def upload_vacancy_file(instance, filename):
    name = slugify(instance.title)[:50]
    ext = filename.split('.')[-1]
    return f"vacancies/{name}.{ext}"

def upload_partner_image(instance, filename):
    name = slugify(str(instance.id))[:50]
    ext = filename.split('.')[-1]
    return f"partners/{name}.{ext}"

# Vacancy model
class Vacancy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description_file = models.FileField(upload_to=upload_vacancy_file, help_text='A pdf file')
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-deadline']
        verbose_name = "Vacancy"
        verbose_name_plural = "Vacancies"

    def __str__(self):
        return self.title

# Blog model
class Blog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    featured_image = models.ImageField(upload_to=upload_blog_image, help_text='Main Image')
    author = models.CharField(max_length=100)
    date_published = models.DateField(auto_now_add=True)
    content = RichTextUploadingField()

    class Meta:
        ordering = ['-date_published']
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

# Partner model
class Partner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to=upload_partner_image)

    class Meta:
        verbose_name = "Partner"
        verbose_name_plural = "Partners"

    def __str__(self):
        return f"Partner {self.id}"

# Numbers model
class Number(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    number = models.PositiveIntegerField()

    class Meta:
        ordering = ['name']
        verbose_name = "Stat Number"
        verbose_name_plural = "Stat Numbers"

    def __str__(self):
        return f"{self.name}: {self.number}"
