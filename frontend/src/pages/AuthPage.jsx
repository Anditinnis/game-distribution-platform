import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Отправка данных:', formData);

    try {
      let response;

      if (isLogin) {
        // ВХОД
        console.log('Попытка входа...');
        
        const loginData = {
          username: formData.username,
          password: formData.password
        };
        
        console.log('Данные для входа:', loginData);
        
        // Используем /token/ эндпоинт (он точно работает)
        response = await axios.post(`${API_URL}/token/`, loginData);
        console.log('Ответ от сервера:', response.data);
        
        // Проверяем, есть ли токен в ответе
        if (response.data.access) {
          // Сохраняем токены
          localStorage.setItem('access_token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          
          // Получаем информацию о пользователе
          try {
            const userResponse = await axios.get(`${API_URL}/users/me/`, {
              headers: { Authorization: `Bearer ${response.data.access}` }
            });
            
            console.log('Информация о пользователе:', userResponse.data);
            localStorage.setItem('user', JSON.stringify(userResponse.data));
            
            console.log('✅ Успешный вход!');
            console.log('Токен сохранен:', localStorage.getItem('access_token'));
            console.log('Пользователь сохранен:', localStorage.getItem('user'));
            
            // Принудительно обновляем состояние (для других компонентов)
            window.dispatchEvent(new Event('storage'));
            
            // Перенаправляем на главную
            navigate('/');
          } catch (userError) {
            console.error('Ошибка получения информации о пользователе:', userError);
            setError('Ошибка получения данных пользователя');
          }
        } else {
          setError('Неверный формат ответа от сервера');
        }
      } else {
        // РЕГИСТРАЦИЯ
        if (formData.password !== formData.confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }

        const registerData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password2: formData.confirmPassword
        };

        console.log('Данные для регистрации:', registerData);

        response = await axios.post(`${API_URL}/users/register/`, registerData);
        console.log('Регистрация успешна:', response.data);

        // Если после регистрации сразу приходят токены
        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          window.dispatchEvent(new Event('storage'));
          navigate('/');
        } else {
          alert('Регистрация успешна! Теперь вы можете войти.');
          setIsLogin(true);
          setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
          });
        }
      }
    } catch (err) {
      console.error('Ошибка:', err);
      console.error('Детали ошибки:', err.response?.data);

      if (err.response?.status === 401) {
        setError('Неверное имя пользователя или пароль');
      } else if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          if (errorData.detail) {
            setError(errorData.detail);
          } else if (errorData.non_field_errors) {
            setError(errorData.non_field_errors[0]);
          } else {
            const firstError = Object.values(errorData)[0];
            setError(Array.isArray(firstError) ? firstError[0] : firstError);
          }
        } else {
          setError(errorData);
        }
      } else if (err.code === 'ERR_NETWORK') {
        setError('Не удалось подключиться к серверу. Убедитесь, что Django сервер запущен.');
      } else {
        setError('Произошла ошибка при подключении к серверу');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="card max-w-md w-full mx-4">
        <div className="p-8">
          {/* Переключатель форм */}
          <div className="flex mb-8 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-4 text-center font-medium ${
                isLogin
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-4 text-center font-medium ${
                !isLogin
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Форма */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Имя пользователя */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              {/* Email (только для регистрации) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    required={!isLogin}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              )}

              {/* Пароль */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  required
                  minLength={6}
                  disabled={loading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              {/* Подтверждение пароля (только для регистрации) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подтверждение пароля
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    required={!isLogin}
                    minLength={6}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Кнопка отправки */}
              <button
                type="submit"
                className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Загрузка...
                  </span>
                ) : isLogin ? (
                  'Войти'
                ) : (
                  'Зарегистрироваться'
                )}
              </button>
            </div>
          </form>

          {/* Дополнительная информация */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? (
              <>
                Нет аккаунта?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:underline"
                >
                  Зарегистрируйтесь
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline"
                >
                  Войдите
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;