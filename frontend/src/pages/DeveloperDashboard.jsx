import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

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
      
      const response = await axios.get(`${API_URL}/games/my_games/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Загруженные игры:', response.data);
      setGames(response.data);
      
      // Рассчитываем статистику
      if (response.data.length > 0) {
        const totalDownloads = response.data.reduce((sum, game) => sum + game.downloads, 0);
        const totalEarnings = response.data.reduce((sum, game) => sum + (game.price * game.downloads * 0.8), 0);
        const avgRating = response.data.reduce((sum, game) => sum + game.average_rating, 0) / response.data.length;
        
        setStats({
          totalGames: response.data.length,
          totalDownloads: totalDownloads,
          totalEarnings: totalEarnings,
          averageRating: avgRating || 0,
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки игр:', err);
      setError('Не удалось загрузить игры');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Вы уверены, что хотите удалить игру?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_URL}/games/${gameId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Обновляем список игр после удаления
      fetchMyGames();
    } catch (err) {
      console.error('Ошибка удаления игры:', err);
      alert('Не удалось удалить игру');
    }
  };

  // Если не авторизован или не разработчик
  if (!isAuthenticated || (user?.role !== 'developer' && user?.role !== 'admin')) {
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
                  <div className="text-sm text-gray-500">Статус: Активен</div>
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
                {stats.averageRating.toFixed(1)}
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
                      {games.map((game) => (
                        <div key={game.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4">
                            {game.cover_image ? (
                              <img 
                                src={`http://127.0.0.1:8000${game.cover_image}`} 
                                alt={game.title}
                                className="w-16 h-16 object-cover rounded-lg"
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
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                  game.status === 'published' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {game.status === 'published' ? 'Опубликовано' : 'Черновик'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Скачиваний: {game.downloads} | Рейтинг: {game.average_rating.toFixed(1)} ⭐
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
                      ))}
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
                  <p className="text-gray-600">
                    Ваш баланс: {stats.totalEarnings.toFixed(2)} ₽
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Выплаты производятся ежемесячно при достижении 1000₽
                  </p>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;