from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    """Расширенная модель пользователя с ролями"""
    ROLE_CHOICES = (
        ('user', 'Пользователь'),
        ('developer', 'Разработчик'),
        ('admin', 'Администратор'),
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Добавляем кастомные related_name для разрешения конфликтов
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='api_user_set',
        related_query_name='api_user',
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='api_user_set',
        related_query_name='api_user',
    )
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class Game(models.Model):
    """Модель компьютерной игры"""
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('published', 'Опубликовано'),
        ('hidden', 'Скрыто'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    short_description = models.CharField(max_length=300)
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_free = models.BooleanField(default=False)
    rental_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rental_days = models.IntegerField(null=True, blank=True)
    
    # Основное изображение
    cover_image = models.ImageField(upload_to='game_covers/', null=True, blank=True)
    
    # Файлы игры
    game_file = models.FileField(upload_to='game_files/', null=True, blank=True)
    demo_file = models.FileField(upload_to='demo_files/', null=True, blank=True)
    version = models.CharField(max_length=50, default='1.0.0')
    
    # Системные требования
    min_requirements = models.TextField(blank=True)
    recommended_requirements = models.TextField(blank=True)
    
    # Жанры и теги
    genre = models.CharField(max_length=100, blank=True)
    tags = models.CharField(max_length=500, blank=True)
    
    # Статистика
    downloads = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    total_ratings = models.IntegerField(default=0)
    
    # Статус и даты
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def update_rating(self, new_rating):
        """Обновляет средний рейтинг игры"""
        total_score = self.average_rating * self.total_ratings + new_rating
        self.total_ratings += 1
        self.average_rating = total_score / self.total_ratings
        self.save()

class GameImage(models.Model):
    """Дополнительные изображения для игры"""
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='game_images/')
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']

class Purchase(models.Model):
    """Модель покупки/аренды игры"""
    TYPE_CHOICES = (
        ('purchase', 'Покупка'),
        ('rental', 'Аренда'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='purchases')
    purchase_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    rental_expires = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'game', 'purchase_type']
    
    def __str__(self):
        return f"{self.user.username} - {self.game.title} ({self.get_purchase_type_display()})"

class Review(models.Model):
    """Отзывы на игры"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'game']
    
    def __str__(self):
        return f"{self.user.username} - {self.game.title} ({self.rating}/5)"

class ForumCategory(models.Model):
    """Категории форума"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        verbose_name_plural = 'Forum Categories'
        ordering = ['order']
    
    def __str__(self):
        return self.name

class ForumTopic(models.Model):
    """Темы на форуме"""
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topics')
    category = models.ForeignKey(ForumCategory, on_delete=models.CASCADE, related_name='topics')
    views = models.IntegerField(default=0)
    is_pinned = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return self.title

class ForumPost(models.Model):
    """Сообщения в темах форума"""
    topic = models.ForeignKey(ForumTopic, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.author.username} - {self.topic.title[:50]}"