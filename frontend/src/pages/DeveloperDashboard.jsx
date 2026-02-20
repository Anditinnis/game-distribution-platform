import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client'; // Импортируем наш API клиент

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DeveloperDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('games');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalDownloads: 0,
    totalEarnings: 0,
    averageRating: 0,
  });

  // Загружаем игры при монтировании компонента
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'developer' || user?.role === 'admin')) {
      fetchMyGames();
    }
  }, [isAuthenticated, user]);

  const fetchMyGames = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await apiClient.get('/games/my_games/');
      
      console.log('Загруженные игры:', response.data);
      setGames(response.data);
      
      // Рассчитываем статистику
      if (response.data.length > 0) {
        const totalDownloads = response.data.reduce((sum, game) => sum + (game.downloads || 0), 0);
        const totalEarnings = response.data.reduce((sum, game) => {
          const price = game.price || 0;
          const downloads = game.downloads || 0;
          return sum + (price * downloads * 0.8);
        }, 0);
        
        // Вычисляем средний рейтинг (если есть рейтинги)
        let avgRating = 0;
        const gamesWithRating = response.data.filter(game => game.average_rating > 0);
        if (gamesWithRating.length > 0) {
          avgRating = gamesWithRating.reduce((sum, game) => sum + game.average_rating, 0) / gamesWithRating.length;
        }
        
        setStats({
          totalGames: response.data.length,
          totalDownloads: totalDownloads,
          totalEarnings: totalEarnings,
          averageRating: avgRating,
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки игр:', err);
      
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
      } else if (err.response?.status === 403) {
        setError('У вас нет прав для просмотра этой страницы');
      } else if (err.code === 'ECONNABORTED') {
        setError('Превышено время ожидания ответа от сервера');
      } else if (err.code === 'ERR_NETWORK') {
        setError(
          process.env.NODE_ENV === 'development'
            ? 'Не удалось подключиться к серверу. Убедитесь, что Django сервер запущен'
            : 'Ошибка подключения к серверу. Проверьте интернет-соединение'
        );
      } else {
        setError('Не удалось загрузить игры');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Вы уверены, что хотите удалить игру? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await apiClient.delete(`/games/${gameId}/`);
      
      // Обновляем список игр после удаления
      fetchMyGames();
      
      // Показываем уведомление об успехе
      alert('Игра успешно удалена');
    } catch (err) {
      console.error('Ошибка удаления игры:', err);
      
      if (err.response?.status === 401) {
        alert('Сессия истекла. Пожалуйста, войдите снова');
      } else if (err.response?.status === 403) {
        alert('У вас нет прав для удаления этой игры');
      } else {
        alert('Не удалось удалить игру. Попробуйте позже');
      }
    }
  };

  const getGameStatusLabel = (status) => {
    switch(status) {
      case 'published':
        return { text: 'Опубликовано', color: 'bg-green-100 text-green-700' };
      case 'draft':
        return { text: 'Черновик', color: 'bg-yellow-100 text-yellow-700' };
      case 'moderation':
        return { text: 'На модерации', color: 'bg-blue-100 text-blue-700' };
      case 'rejected':
        return { text: 'Отклонено', color: 'bg-red-100 text-red-700' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Убираем дублирование /api в URL
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  // Если не авторизован или не разработчик
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Требуется авторизация</h2>
          <p className="text-gray-600 mb-4">
            Для доступа к кабинету разработчика необходимо войти в систему
          </p>
          <Link to="/auth" className="btn-primary">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role !== 'developer' && user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">
            Эта страница доступна только разработчикам
          </p>
          <Link to="/" className="btn-primary">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Кабинет разработчика</h1>
        <p className="text-gray-600">
          Управляйте вашими играми, следите за статистикой и получайте выплаты
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs">
              API URL: {API_URL}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Левая колонка - меню */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <div className="p-6">
              {/* Профиль разработчика */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{user?.username}</div>
                  <div className="text-sm text-gray-500">
                    {user?.role === 'admin' ? 'Администратор' : 'Разработчик'}
                  </div>
                </div>
              </div>

              {/* Меню */}
              <nav className="space-y-1">
                {[
                  { id: 'games', label: 'Мои игры', icon: '🎮' },
                  { id: 'analytics', label: 'Аналитика', icon: '📊' },
                  { id: 'earnings', label: 'Заработок', icon: '💰' },
                  { id: 'upload', label: 'Загрузить игру', icon: '⬆️' },
                  { id: 'settings', label: 'Настройки', icon: '⚙️' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Кнопка публикации */}
              <div className="mt-8">
                <Link
                  to="/upload"
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Новая игра
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - контент */}
        <div className="lg:col-span-3">
          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-6">
              <div className="text-2xl font-bold text-primary mb-2">
                {stats.totalGames}
              </div>
              <div className="text-sm text-gray-600">Игр опубликовано</div>
            </div>
            <div className="card p-6">
              <div className="text-2xl font-bold text-secondary mb-2">
                {stats.totalDownloads}
              </div>
              <div className="text-sm text-gray-600">Всего скачиваний</div>
            </div>
            <div className="card p-6">
              <div className="text-2xl font-bold text-accent mb-2">
                {stats.totalEarnings.toFixed(2)} ₽
              </div>
              <div className="text-sm text-gray-600">Общий заработок</div>
            </div>
            <div className="card p-6">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'Нет'}
              </div>
              <div className="text-sm text-gray-600">Средний рейтинг</div>
            </div>
          </div>

          {/* Контент в зависимости от активного таба */}
          <div className="card">
            <div className="p-6">
              {activeTab === 'games' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Мои игры</h2>
                    <span className="text-sm text-gray-500">
                      {games.length} {games.length === 1 ? 'игра' : games.length < 5 ? 'игры' : 'игр'}
                    </span>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Загрузка игр...</p>
                    </div>
                  ) : games.length > 0 ? (
                    <div className="space-y-4">
                      {games.map((game) => {
                        const status = getGameStatusLabel(game.status);
                        return (
                          <div key={game.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-4">
                              {game.cover_image ? (
                                <img 
                                  src={getImageUrl(game.cover_image)} 
                                  alt={game.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <span className="text-2xl">🎮</span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-lg">{game.title}</div>
                                <div className="text-sm text-gray-500">
                                  Статус: 
                                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                                    {status.text}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Скачиваний: {game.downloads || 0} | 
                                  Рейтинг: {game.average_rating > 0 ? game.average_rating.toFixed(1) : 'Нет'} ⭐
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Link
                                to={`/game/${game.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50"
                              >
                                Просмотр
                              </Link>
                              <Link
                                to={`/edit-game/${game.id}`}
                                className="text-green-600 hover:text-green-800 text-sm px-3 py-1 rounded hover:bg-green-50"
                              >
                                Редактировать
                              </Link>
                              <button
                                onClick={() => handleDeleteGame(game.id)}
                                className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎮</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        У вас пока нет игр
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Опубликуйте свою первую игру и начните зарабатывать
                      </p>
                      <Link
                        to="/upload"
                        className="btn-primary inline-flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Создать первую игру
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Аналитика скоро появится
                  </h3>
                  <p className="text-gray-600">
                    Здесь будут графики и статистика по вашим играм
                  </p>
                </div>
              )}

              {activeTab === 'earnings' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Заработок
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Ваш баланс: <span className="font-bold text-accent">{stats.totalEarnings.toFixed(2)} ₽</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Минимальная сумма для вывода: 1000 ₽
                  </p>
                  {stats.totalEarnings >= 1000 ? (
                    <button className="mt-4 btn-primary">
                      Запросить выплату
                    </button>
                  ) : (
                    <p className="mt-4 text-xs text-gray-400">
                      До выплаты осталось: {(1000 - stats.totalEarnings).toFixed(2)} ₽
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⬆️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Загрузить новую игру
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Заполните информацию о вашей игре и загрузите файлы
                  </p>
                  <Link
                    to="/upload"
                    className="btn-primary inline-flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Перейти к загрузке
                  </Link>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Настройки профиля
                  </h3>
                  <p className="text-gray-600">
                    Настройки будут доступны в ближайшее время
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Информация для разработчиков */}
          <div className="mt-8 card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Полезная информация
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 font-medium mb-2">Комиссия платформы</div>
                  <p className="text-sm text-gray-700">
                    Мы берем всего 20% с каждой продажи. Остальные 80% поступают на ваш баланс.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-green-600 font-medium mb-2">Выплаты</div>
                  <p className="text-sm text-gray-700">
                    Выплаты производятся ежемесячно при достижении минимальной суммы в 1000₽.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-purple-600 font-medium mb-2">Модерация</div>
                  <p className="text-sm text-gray-700">
                    Игры проходят модерацию в течение 24 часов. Статус можно отслеживать в списке игр.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-orange-600 font-medium mb-2">Продвижение</div>
                  <p className="text-sm text-gray-700">
                    Игры с высоким рейтингом попадают на главную страницу и получают больше скачиваний.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;