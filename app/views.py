from django.shortcuts import render
from django.http import JsonResponse
from .models import Number, Vacancy, Blog, Partner
import datetime


from django.http import JsonResponse
from .models import Number, Vacancy, Blog, Partner

def mamlo_combined_data_api(request):
    numbers = list(Number.objects.values("name", "number"))

    vacancies = [
        {
            "title": v.title,
            "description_file": request.build_absolute_uri(v.description_file.url) if v.description_file else None,
            "deadline": v.deadline.isoformat(),
        }
        for v in Vacancy.objects.order_by("-deadline")
    ]

    blogs = [
        {
            "title": b.title,
            "slug": b.slug,
            "featured_image": request.build_absolute_uri(b.featured_image.url) if b.featured_image else None,
            "author": b.author,
            "date_published": b.date_published.isoformat(),
        }
        for b in Blog.objects.order_by("-date_published")[:3]
    ]

    partners = [
        {
            "image": request.build_absolute_uri(p.image.url) if p.image else None
        }
        for p in Partner.objects.all()
    ]

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

def vacancy_api(request):
    today = datetime.date.today()
    vacancies = Vacancy.objects.all().values("id", "title", "description_file", "deadline")

    # Separate open and closed
    open_vacancies = [v for v in vacancies if v["deadline"] >= today]
    closed_vacancies = [v for v in vacancies if v["deadline"] < today]

    return JsonResponse({
        "open": open_vacancies,
        "closed": closed_vacancies
    })

def founders_story(request):
    return render(request, 'app/founders_story.html')

def blog_details(request, pk):
    return render(request, 'app/details.html')