from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from django.utils import timezone

class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для пользователя"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'avatar', 'bio', 'balance', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'balance']

class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        
        # По умолчанию регистрируем как обычного пользователя
        attrs['role'] = 'user'
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'user')
        )
        return user

class LoginSerializer(serializers.Serializer):
    """Сериализатор для входа"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("Пользователь деактивирован")
                return user
            else:
                raise serializers.ValidationError("Неверные учетные данные")
        else:
            raise serializers.ValidationError("Необходимо указать имя пользователя и пароль")

class GameImageSerializer(serializers.ModelSerializer):
    """Сериализатор для изображений игр"""
    class Meta:
        model = GameImage
        fields = ['id', 'image', 'order']

class GameSerializer(serializers.ModelSerializer):
    """Сериализатор для игр"""
    developer = UserSerializer(read_only=True)
    is_owned = serializers.SerializerMethodField()
    is_rented = serializers.SerializerMethodField()
    images = GameImageSerializer(many=True, read_only=True)  # Теперь GameImageSerializer определен выше
    
    class Meta:
        model = Game
        fields = '__all__'
        read_only_fields = ['developer', 'downloads', 'average_rating', 'total_ratings']
    
    def get_is_owned(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Purchase.objects.filter(
                user=request.user, 
                game=obj, 
                purchase_type='purchase'
            ).exists()
        return False
    
    def get_is_rented(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            purchase = Purchase.objects.filter(
                user=request.user, 
                game=obj, 
                purchase_type='rental'
            ).first()
            if purchase and purchase.rental_expires:
                return purchase.rental_expires > timezone.now()
        return False
    
    def create(self, validated_data):
        # При создании игры автоматически устанавливаем разработчика
        validated_data['developer'] = self.context['request'].user
        return super().create(validated_data)

class PurchaseSerializer(serializers.ModelSerializer):
    """Сериализатор для покупок"""
    user = UserSerializer(read_only=True)
    game = GameSerializer(read_only=True)
    
    class Meta:
        model = Purchase
        fields = '__all__'
        read_only_fields = ['user', 'amount', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    """Сериализатор для отзывов"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        review = super().create(validated_data)
        
        # Обновляем рейтинг игры
        review.game.update_rating(review.rating)
        return review

class ForumCategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий форума"""
    topic_count = serializers.IntegerField(source='topics.count', read_only=True)
    
    class Meta:
        model = ForumCategory
        fields = '__all__'

class ForumTopicSerializer(serializers.ModelSerializer):
    """Сериализатор для тем форума"""
    author = UserSerializer(read_only=True)
    post_count = serializers.IntegerField(source='posts.count', read_only=True)
    last_post = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumTopic
        fields = '__all__'
        read_only_fields = ['author', 'views', 'created_at', 'updated_at']
    
    def get_last_post(self, obj):
        last_post = obj.posts.last()
        if last_post:
            return {
                'author': last_post.author.username,
                'created_at': last_post.created_at
            }
        return None
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class ForumPostSerializer(serializers.ModelSerializer):
    """Сериализатор для сообщений форума"""
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = ForumPost
        fields = ['id', 'topic', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']
    
    # Убираем метод create, так как author передается через save() в view