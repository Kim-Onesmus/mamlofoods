from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('vacancies/', views.vacancies, name='vacancies'),
    path("api/mamlo-data/", views.mamlo_combined_data_api, name="mamlo-combined-data"),
]