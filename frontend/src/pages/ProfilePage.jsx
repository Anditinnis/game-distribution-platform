import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, isAuthenticated, logout } = useAuth();

  console.log('ProfilePage загружен!');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('user:', user);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">❌ Не авторизован</h1>
        <p className="mb-4">Пожалуйста, войдите в аккаунт</p>
        <Link to="/auth" className="btn-primary">Войти</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">✅ Личный кабинет</h1>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-xl font-bold">{user?.username}</div>
                  <div className="text-gray-600">{user?.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">Роль</div>
                  <div className="text-lg font-semibold">
                    {user?.role === 'admin' && 'Администратор'}
                    {user?.role === 'developer' && 'Разработчик'}
                    {user?.role === 'user' && 'Пользователь'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">Баланс</div>
                  <div className="text-lg font-semibold text-primary">
                    {user?.balance || 0} ₽
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Дата регистрации</div>
                <div>
                  {new Date(user?.date_joined).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Link to="/" className="btn-primary flex-1 text-center">
                  На главную
                </Link>
                <button
                  onClick={logout}
                  className="btn-secondary flex-1"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;