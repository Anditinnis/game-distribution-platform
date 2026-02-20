import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Используем переменную окружения для API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const HomePage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setBackendStatus('checking');
      
      console.log('Fetching games from:', `${API_URL}/games/`);
      
      const response = await fetch(`${API_URL}/games/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Добавляем таймаут для предотвращения бесконечной загрузки
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Games loaded:', data);
      
      // Проверяем, что данные - это массив
      if (Array.isArray(data)) {
        setGames(data);
      } else {
        console.error('Data is not an array:', data);
        setGames([]);
      }
      
      setError(null);
      setBackendStatus('online');
    } catch (err) {
      console.error('Ошибка загрузки игр:', err);
      
      // Более детальная обработка ошибок
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        setError('Превышено время ожидания ответа от сервера');
      } else if (err.message.includes('Failed to fetch')) {
        setError(
          process.env.NODE_ENV === 'development'
            ? 'Не удалось подключиться к серверу. Убедитесь, что Django сервер запущен на http://127.0.0.1:8000'
            : 'Не удалось подключиться к серверу. Пожалуйста, попробуйте позже'
        );
      } else {
        setError(err.message);
      }
      
      setBackendStatus('offline');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Убираем дублирование /api в URL
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  // Функция для форматирования чисел
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Вычисляем статистику
  const totalDownloads = games.reduce((sum, game) => sum + (game.downloads || 0), 0);
  const averageRating = games.length > 0 
    ? (games.reduce((sum, game) => sum + (game.average_rating || 0), 0) / games.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '5rem', height: '5rem', border: '4px solid rgba(99, 102, 241, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '1.125rem', color: 'var(--text-secondary)' }}>Загружаем игры...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Информация о режиме работы (только для разработки) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="container" style={{ padding: '1rem' }}>
          <div className="bg-blue-50 text-blue-600 text-xs p-2 rounded-lg">
            Режим разработки: API = {API_URL}
          </div>
        </div>
      )}

      {/* Hero секция */}
      <div className="hero">
        <div className="container" style={{ padding: '5rem 1rem' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Платформа для{' '}
              <span style={{ background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                независимых разработчиков
              </span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              Публикуйте, распространяйте и монетизируйте свои игры в одном месте. 
              Создавайте сообщество вокруг ваших проектов.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Link
                to="/developer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                Начать публикацию
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '0.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#games"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                Смотреть игры
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '0.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>{games.length}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Игр на платформе</div>
          </div>
          <div className="card p-6 text-center">
            <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
              {formatNumber(totalDownloads)}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>Всего скачиваний</div>
          </div>
          <div className="card p-6 text-center">
            <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.5rem' }}>
              {averageRating}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>Средний рейтинг</div>
          </div>
          <div className="card p-6 text-center">
            <div style={{ fontSize: '1.875rem', fontWeight: '700', color: backendStatus === 'online' ? '#10b981' : '#ef4444', marginBottom: '0.5rem' }}>
              {backendStatus === 'online' ? '✓' : '✗'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {backendStatus === 'online' ? 'Система работает' : 'Проблемы с подключением'}
            </div>
          </div>
        </div>
      </div>

      {/* Секция с играми */}
      <div id="games" className="container" style={{ padding: '4rem 1rem' }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Игровая библиотека</h2>
          <p className="text-secondary" style={{ fontSize: '1.125rem', maxWidth: '36rem', margin: '0 auto' }}>
            Откройте для себя уникальные игры от независимых разработчиков
          </p>
        </div>

        {error ? (
          <div className="card" style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '4rem', height: '4rem', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="32" height="32" fill="#dc2626" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ошибка подключения</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={fetchGames}
              className="btn btn-primary"
            >
              Попробовать снова
            </button>
          </div>
        ) : games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <div key={game.id} className="card">
                {game.cover_image && (
                  <div style={{ width: '100%', height: '200px', overflow: 'hidden', borderRadius: '0.5rem 0.5rem 0 0' }}>
                    <img 
                      src={getImageUrl(game.cover_image)} 
                      alt={game.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-6">
                  {/* Заголовок и рейтинг */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      <Link to={`/game/${game.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {game.title}
                      </Link>
                    </h3>
                    {game.average_rating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                        <svg width="16" height="16" fill="#f59e0b" viewBox="0 0 20 20" style={{ marginRight: '0.25rem' }}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span style={{ fontWeight: '600' }}>{game.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Описание */}
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.625' }}>
                    {game.short_description || game.description?.substring(0, 150)}
                    {game.description?.length > 150 ? '...' : ''}
                  </p>

                  {/* Детали */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Разработчик:</span>
                      <span style={{ fontWeight: '500' }}>{game.developer?.username || 'Неизвестно'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Скачиваний:</span>
                      <span style={{ fontWeight: '500' }}>{formatNumber(game.downloads)}</span>
                    </div>
                    {game.genre && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Жанр:</span>
                        <span style={{ fontWeight: '500' }}>{game.genre}</span>
                      </div>
                    )}
                  </div>

                  {/* Цена и кнопка */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {game.is_free ? 'Бесплатно' : `${game.price} ₽`}
                      </div>
                      {game.rental_price && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          или {game.rental_price} ₽/день
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/game/${game.id}`}
                      className="btn btn-primary"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎮</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Игр пока нет</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {backendStatus === 'offline' 
                ? 'Не удалось подключиться к серверу. Проверьте подключение.'
                : 'База данных игр пуста. Добавьте первую игру через админ-панель Django'
              }
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <a
                href={`${API_URL.replace('/api', '')}/admin/`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Открыть админ-панель
              </a>
              {backendStatus === 'offline' && (
                <button
                  onClick={fetchGames}
                  className="btn btn-secondary"
                >
                  Попробовать снова
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Добавляем анимацию спиннера */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default HomePage;