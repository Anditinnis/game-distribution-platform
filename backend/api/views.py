from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from .models import *
from .serializers import *
from .permissions import *

class UserViewSet(viewsets.ModelViewSet):
    """ViewSet для пользователей"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'register']:
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Получение информации о текущем пользователе"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Регистрация нового пользователя"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GameViewSet(viewsets.ModelViewSet):
    """ViewSet для игр"""
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    
    def get_queryset(self):
        if self.action == 'list':
            return Game.objects.filter(status='published')
        return Game.objects.all()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action == 'create':
            return [IsDeveloper()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrReadOnly()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        serializer.save(developer=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsDeveloper])
    def my_games(self, request):
        games = Game.objects.filter(developer=request.user)
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)
    
@action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
def add_post(self, request, pk=None):
    """Добавление сообщения в тему"""
    topic = self.get_object()
    
    print("="*50)
    print("ADD POST REQUEST")
    print("Data received:", request.data)
    print("User:", request.user.username)
    print("Topic ID:", pk)
    print("="*50)
    
    if topic.is_closed and not request.user.role == 'admin':
        return Response(
            {'error': 'Тема закрыта для обсуждения'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Создаем данные с правильным форматом
    post_data = {
        'content': request.data.get('content'),
        'topic': topic.id
    }
    
    # ВАЖНО: передаем request в контекст сериализатора
    serializer = ForumPostSerializer(
        data=post_data, 
        context={'request': request}  # Добавляем request в контекст
    )
    
    if serializer.is_valid():
        serializer.save(topic=topic, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PurchaseViewSet(viewsets.ModelViewSet):
    """ViewSet для покупок"""
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def buy(self, request):
        game_id = request.data.get('game_id')
        purchase_type = request.data.get('type', 'purchase')
        
        game = get_object_or_404(Game, id=game_id, status='published')
        
        existing_purchase = Purchase.objects.filter(
            user=request.user,
            game=game,
            purchase_type=purchase_type
        ).exists()
        
        if existing_purchase:
            return Response(
                {'error': 'Игра уже приобретена'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        amount = game.price if purchase_type == 'purchase' else game.rental_price
        if request.user.balance < amount:
            return Response(
                {'error': 'Недостаточно средств на балансе'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        purchase = Purchase.objects.create(
            user=request.user,
            game=game,
            purchase_type=purchase_type,
            amount=amount
        )
        
        request.user.balance -= amount
        request.user.save()
        
        game.developer.balance += amount * 0.8
        game.developer.save()
        
        serializer = self.get_serializer(purchase)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet для отзывов"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        game_id = self.request.query_params.get('game_id')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        game = serializer.validated_data['game']
        has_purchase = Purchase.objects.filter(
            user=self.request.user,
            game=game
        ).exists()
        
        if not has_purchase and not game.is_free:
            raise serializers.ValidationError(
                "Вы можете оставить отзыв только после покупки игры"
            )
        
        serializer.save(user=self.request.user)

class ForumCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для категорий форума"""
    queryset = ForumCategory.objects.all()
    serializer_class = ForumCategorySerializer
    permission_classes = [AllowAny]

class ForumTopicViewSet(viewsets.ModelViewSet):
    """ViewSet для тем форума"""
    queryset = ForumTopic.objects.all()
    serializer_class = ForumTopicSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'posts']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def posts(self, request, pk=None):
        """Получение сообщений темы"""
        topic = self.get_object()
        posts = topic.posts.all()
        serializer = ForumPostSerializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_post(self, request, pk=None):
        """Добавление сообщения в тему"""
        topic = self.get_object()
        
        print("="*50)
        print("ADD POST REQUEST")
        print("Data received:", request.data)
        print("User:", request.user.username)
        print("Topic:", topic.id)
        print("="*50)
        
        if topic.is_closed and not request.user.role == 'admin':
            return Response(
                {'error': 'Тема закрыта для обсуждения'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ForumPostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(topic=topic, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForumPostViewSet(viewsets.ModelViewSet):
    """ViewSet для сообщений форума"""
    queryset = ForumPost.objects.all()
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthorOrReadOnly]

class LoginView(generics.GenericAPIView):
    """View для входа пользователя"""
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        print("="*50)
        print("LOGIN REQUEST RECEIVED")
        print("Request data:", request.data)
        print("="*50)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data
        print(f"User authenticated: {user.username}")
        
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        print("Response sent")
        return Response(response_data)