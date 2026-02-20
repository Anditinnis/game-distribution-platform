import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Game
from django.utils import timezone
from django.core.files.base import ContentFile

def create_test_data():
    # Создаем тестового разработчика
    dev, created = User.objects.get_or_create(
        username='indie_dev',
        defaults={
            'email': 'dev@indie.com',
            'role': 'developer',
            'bio': 'Независимый разработчик игр'
        }
    )
    if created:
        dev.set_password('dev123')
        dev.save()
        print(f'Создан разработчик: {dev.username}')
    
    # Создаем тестовые игры
    test_games = [
        {
            'title': 'Cosmic Adventure',
            'description': 'Исследуйте бескрайние космические просторы в этой захватывающей игре',
            'short_description': 'Космическое приключение',
            'price': 19.99,
            'genre': 'Adventure',
            'tags': 'space, adventure, exploration'
        },
        {
            'title': 'Dungeon Crawler',
            'description': 'Спуститесь в глубины подземелий, сражайтесь с монстрами и находите сокровища',
            'short_description': 'Рогалик с подземельями',
            'price': 14.99,
            'genre': 'Roguelike',
            'tags': 'dungeon, roguelike, rpg'
        },
        {
            'title': 'Pixel Quest',
            'description': 'Ретро-стилизованная игра в стиле 8-битных приключений',
            'short_description': 'Ретро приключение',
            'is_free': True,
            'genre': 'Retro',
            'tags': 'pixel, retro, free'
        }
    ]
    
    for game_data in test_games:
        game, created = Game.objects.get_or_create(
            title=game_data['title'],
            defaults={
                'developer': dev,
                'description': game_data['description'],
                'short_description': game_data['short_description'],
                'price': game_data.get('price', 0),
                'is_free': game_data.get('is_free', False),
                'genre': game_data['genre'],
                'tags': game_data['tags'],
                'status': 'published',
                'published_at': timezone.now(),
                'cover_image': 'game_covers/default.jpg',  # Заглушка
                'game_file': 'game_files/default.zip',     # Заглушка
            }
        )
        if created:
            print(f'Создана игра: {game.title}')

if __name__ == '__main__':
    create_test_data()
    print('Тестовые данные созданы!')