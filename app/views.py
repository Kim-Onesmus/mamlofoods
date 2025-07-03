from django.shortcuts import render
from django.http import JsonResponse
from .models import Number, Vacancy, Blog, Partner


def mamlo_combined_data_api(request):
    numbers = list(Number.objects.values("name", "number"))
    vacancies = list(Vacancy.objects.values("title", "description_file", "deadline"))
    blogs = list(Blog.objects.values("title", "slug", "featured_image", "author", "date_published"))
    partners = list(Partner.objects.values("image"))

    return JsonResponse({
        "numbers": numbers,
        "vacancies": vacancies,
        "blogs": blogs,
        "partners": partners
    })


def index(request):
    return render(request, 'app/index.html')

def about(request):
    return render(request, 'app/about.html')


def contact(request):
    return render(request, 'app/contact.html')

def vacancies(request):
    return render(request, 'app/vacancies.html')