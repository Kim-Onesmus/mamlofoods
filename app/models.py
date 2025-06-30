from django.db import models

# Create your models here.
import os
import uuid
from django.db import models
from django.utils.text import slugify
from ckeditor_uploader.fields import RichTextUploadingField
from django.contrib.auth.models import User


def upload_to(instance, filename):
    ext = filename.split('.')[-1]
    slug = slugify(instance.title)[:50]
    return f'blog/{slug}.{ext}'


class Blog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    featured_image = models.ImageField(upload_to=upload_to)
    author = models.CharField(max_length=255)
    content = RichTextUploadingField()
    published_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:50]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
