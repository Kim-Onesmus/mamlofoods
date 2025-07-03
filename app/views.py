from django.shortcuts import render
from django.http import JsonResponse
from .models import Number, Vacancy, Blog, Partner, ContactMessage
from django.shortcuts import render, get_object_or_404
import datetime


from django.http import JsonResponse
from .models import Number, Vacancy, Blog, Partner

def mamlo_combined_data_api(request):
    numbers = list(Number.objects.values("name", "number"))
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
        "blogs": blogs,
        "partners": partners
    })

def landing(request):
    return render(request, 'app/landing.html')

def index(request):
    return render(request, 'app/index.html')

def about(request):
    return render(request, 'app/about.html')


def contact(request):
    return render(request, 'app/contact.html')


def submit_contact_form(request):
    if request.method == "POST":
        name = request.POST.get('name')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        message = request.POST.get('message')

        data = ContactMessage.objects.create(
            name=name,
            phone=phone,
            email=email,
            message=message
        )
        data.save()

        return JsonResponse({'success': True, 'message': 'Message submitted successfully!'})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

def vacancies(request):
    return render(request, 'app/vacancies.html')

def vacancy_api(request):
    today = datetime.date.today()
    vacancies = Vacancy.objects.all()

    open_vacancies = []
    closed_vacancies = []

    for v in vacancies:
        data = {
            "id": str(v.id),
            "title": v.title,
            "description_file": request.build_absolute_uri(v.description_file.url) if v.description_file else None,
            "image": request.build_absolute_uri(v.image.url) if v.image else None,
            "deadline": v.deadline,
        }
        (open_vacancies if v.deadline >= today else closed_vacancies).append(data)

    return JsonResponse({
        "open": open_vacancies,
        "closed": closed_vacancies
    })

def founders_story(request):
    return render(request, 'app/founders_story.html')

def blog_details(request, slug):
    blog = get_object_or_404(Blog, slug=slug)
    return render(request, 'app/blog_details.html', {'blog': blog})