from django.urls import path
from . import views


urlpatterns = [
    path('', views.landing, name='landing'),
    path('index/', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('submit-contact/', views.submit_contact_form, name='submit_contact_form'),
    path('vacancies/', views.vacancies, name='vacancies'),
    path('founders_story/', views.founders_story, name='founders_story'),
    path("api/mamlo-data/", views.mamlo_combined_data_api, name="mamlo-combined-data"),
    path("api/vacancies/", views.vacancy_api, name="vacancy_api"),
    path('details/<str:slug>/', views.blog_details, name='blog_details'),

]