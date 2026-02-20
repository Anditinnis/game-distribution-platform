from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'balance', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('role', 'avatar', 'bio', 'balance')}),
    )

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('title', 'developer', 'price', 'status', 'created_at')
    list_filter = ('status', 'genre', 'developer')
    search_fields = ('title', 'description')
    readonly_fields = ('downloads', 'average_rating')

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'purchase_type', 'amount', 'created_at')
    list_filter = ('purchase_type', 'created_at')

admin.site.register(Review)
admin.site.register(ForumCategory)
admin.site.register(ForumTopic)
admin.site.register(ForumPost)
admin.site.register(GameImage)