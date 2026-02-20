from rest_framework import permissions

class IsDeveloper(permissions.BasePermission):
    """Разрешено только разработчикам"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'developer'

class IsAdmin(permissions.BasePermission):
    """Разрешено только администраторам"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Разрешено владельцу, остальным только чтение"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.developer == request.user

class IsAuthorOrReadOnly(permissions.BasePermission):
    """Разрешено автору, остальным только чтение"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user

class CanPurchaseGame(permissions.BasePermission):
    """Проверка возможности покупки игры"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Проверяем, не куплена ли уже игра
        game_id = view.kwargs.get('game_id')
        if game_id:
            from .models import Purchase
            already_purchased = Purchase.objects.filter(
                user=request.user,
                game_id=game_id,
                purchase_type='purchase'
            ).exists()
            
            if already_purchased:
                return False
        
        return True