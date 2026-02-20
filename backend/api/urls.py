from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import views_navigator

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'games', views.GameViewSet)
router.register(r'purchases', views.PurchaseViewSet, basename='purchase')
router.register(r'reviews', views.ReviewViewSet)
router.register(r'forum/categories', views.ForumCategoryViewSet)
router.register(r'forum/topics', views.ForumTopicViewSet)
router.register(r'forum/posts', views.ForumPostViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('navigator/', views_navigator.api_navigator, name='api_navigator'),
    # ЭТОТ URL ОЧЕНЬ ВАЖЕН:
    path('users/login/', views.LoginView.as_view(), name='user_login'),
]