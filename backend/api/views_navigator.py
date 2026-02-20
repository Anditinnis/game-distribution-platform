from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import Game, User, Purchase

def api_navigator(request):
    """View для страницы навигации по API"""
    
    # Получаем статистику для отображения
    context = {
        'total_games': Game.objects.count(),
        'total_users': User.objects.count(),
        'total_purchases': Purchase.objects.count(),
        'published_games': Game.objects.filter(status='published').count(),
        'developers': User.objects.filter(role='developer').count(),
        'server_time': timezone.now(),
    }
    
    return render(request, 'api_navigator.html', context)