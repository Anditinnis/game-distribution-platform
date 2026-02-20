import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    
    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 Проверка авторизации:');
    console.log('  Token:', token ? '✅ есть' : '❌ нет');
    console.log('  UserData:', userData ? '✅ есть' : '❌ нет');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('  Пользователь:', parsedUser.username);
        console.log('  Роль:', parsedUser.role);
        
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Ошибка парсинга user data:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      console.log('  ❌ Нет данных авторизации');
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  const logout = () => {
    console.log('🚪 Выход из аккаунта');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return {
    user,
    isAuthenticated,
    loading,
    logout,
    updateUser,
    checkAuth
  };
};