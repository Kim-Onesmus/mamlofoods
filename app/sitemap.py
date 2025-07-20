from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.contrib.sitemaps.views import sitemap
from django.urls import path

class StaticSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return ['index', 'about', 'contact', 'vacancies', 'founders_story']
    
    def location(self, item):
        return reverse(item)


