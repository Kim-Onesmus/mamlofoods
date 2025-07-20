from django.urls import path
from . import views
from app.sitemap import StaticSitemap
from django.views.generic.base import TemplateView
from django.contrib.sitemaps.views import sitemap

sitemaps = {
    'static': StaticSitemap,
}


urlpatterns = [
    # path('', views.landing, name='landing'),
    path('', views.index, name='index'),
    path('sitemap.xml', sitemap, {'sitemaps':sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', TemplateView.as_view(template_name="app/robots.txt", content_type="text/plain")),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('submit-contact/', views.submit_contact_form, name='submit_contact_form'),
    path('vacancies/', views.vacancies, name='vacancies'),
    path('founders_story/', views.founders_story, name='founders_story'),
    path("api/mamlo-data/", views.mamlo_combined_data_api, name="mamlo-combined-data"),
    path("api/vacancies/", views.vacancy_api, name="vacancy_api"),
    path('details/<str:slug>/', views.blog_details, name='blog_details'),

]