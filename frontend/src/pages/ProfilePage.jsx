import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  console.log('ProfilePage загружен!');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('user:', user);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Не указана';
      
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return 'Не указана';
    }
  };

  const getRoleDisplay = () => {
    if (!user?.role) return 'Пользователь';
    
    switch(user.role) {
      case 'admin':
        return 'Администратор';
      case 'developer':
        return 'Разработчик';
      case 'user':
        return 'Пользователь';
      default:
        return 'Пользователь';
    }
  };

  const getRoleBadgeColor = () => {
    if (!user?.role) return 'bg-gray-100 text-gray-700';
    
    switch(user.role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'developer':
        return 'bg-green-100 text-green-700';
      case 'user':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="card p-8">
            <h1 className="text-2xl font-bold mb-4">❌ Не авторизован</h1>
            <p className="text-gray-600 mb-6">
              Пожалуйста, войдите в аккаунт для доступа к личному кабинету
            </p>
            <Link to="/auth" className="btn-primary inline-block">
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Хлебные крошки */}
        <div className="text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-primary">Главная</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Личный кабинет</span>
        </div>

        <div className="card">
          <div className="p-8">
            {/* Заголовок с ролью */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Личный кабинет
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor()}`}>
                {getRoleDisplay()}
              </span>
            </div>
            
            <div className="space-y-6">
              {/* Аватар и основная информация */}
              <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl text-white font-bold">
                    {user?.username?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {user?.username || 'Без имени'}
                  </div>
                  <div className="text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user?.email || 'Email не указан'}
                  </div>
                </div>
              </div>

              {/* Статистика в карточках */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-sm text-blue-600 mb-1">Баланс</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {user?.balance?.toFixed(2) || '0.00'} ₽
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    Доступно для вывода
                  </div>
                </div>
                <div className="p-5 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-sm text-green-600 mb-1">ID пользователя</div>
                  <div className="text-2xl font-bold text-green-700 font-mono">
                    #{user?.id || '—'}
                  </div>
                  <div className="text-xs text-green-500 mt-1">
                    Дата регистрации
                  </div>
                </div>
              </div>

              {/* Детальная информация */}
              <div className="space-y-3">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-32 text-sm text-gray-600">Дата регистрации</div>
                  <div className="flex-1 font-medium">
                    {formatDate(user?.date_joined)}
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-32 text-sm text-gray-600">Последний вход</div>
                  <div className="flex-1 font-medium">
                    {formatDate(user?.last_login) || 'Не выполнялся'}
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-32 text-sm text-gray-600">Статус</div>
                  <div className="flex-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Активен
                    </span>
                  </div>
                </div>
              </div>

              {/* Навигационные кнопки */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                {user?.role === 'developer' && (
                  <Link
                    to="/developer"
                    className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl hover:from-primary/20 hover:to-primary/10 transition-all border border-primary/20"
                  >
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="font-medium text-primary">Кабинет разработчика</span>
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl hover:from-purple-200 hover:to-purple-100 transition-all border border-purple-200"
                  >
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="font-medium text-purple-600">Панель администратора</span>
                  </Link>
                )}

                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="font-medium text-gray-700">На главную</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-200"
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium text-red-600">Выйти</span>
                </button>
              </div>

              {/* Секция для разработчика (если есть игры) */}
              {user?.role === 'developer' && (
                <div className="mt-6 p-5 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Быстрые действия
                  </h3>
                  <div className="flex gap-2">
                    <Link
                      to="/upload"
                      className="flex-1 text-center py-2 px-3 bg-white rounded-lg text-sm text-primary hover:bg-primary/5 border border-primary/20 transition-colors"
                    >
                      ➕ Новая игра
                    </Link>
                    <Link
                      to="/developer?tab=earnings"
                      className="flex-1 text-center py-2 px-3 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
                    >
                      💰 Заработок
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Отладочная информация (только в разработке) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <details>
              <summary className="text-sm text-gray-500 cursor-pointer">
                Debug Info (только для разработки)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify({ user, isAuthenticated }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;