import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const GamePage = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/games/${id}/`);
      
      if (!response.ok) {
        throw new Error('Игра не найдена');
      }
      
      const data = await response.json();
      setGame(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="card max-w-2xl mx-auto p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🎮</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Игра не найдена</h1>
          <p className="text-gray-600 mb-6">{error || 'Игра с таким ID не существует'}</p>
          <Link to="/" className="btn-primary">
            Вернуться в магазин
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Хлебные крошки */}
      <div className="mb-6">
        <nav className="flex text-sm text-gray-600">
          <Link to="/" className="hover:text-primary">Магазин</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{game.title}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - основная информация */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {/* Изображение игры */}
            <div className="h-64 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
              {game.cover_image ? (
                <img
                  src={`http://localhost:8000${game.cover_image}`}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl">🎮</div>
              )}
            </div>

            <div className="p-6">
              {/* Заголовок и рейтинг */}
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{game.title}</h1>
                <div className="flex items-center bg-gray-100 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-bold">{game.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500 ml-1">({game.total_ratings})</span>
                </div>
              </div>

              {/* Разработчик */}
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="font-semibold">
                    {game.developer?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Разработчик</div>
                  <div className="font-medium">{game.developer?.username}</div>
                </div>
              </div>

              {/* Табы */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  {['description', 'requirements', 'reviews'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 font-medium ${
                        activeTab === tab
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'description' && 'Описание'}
                      {tab === 'requirements' && 'Системные требования'}
                      {tab === 'reviews' && 'Отзывы'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Контент табов */}
              <div className="prose max-w-none">
                {activeTab === 'description' && (
                  <div className="text-gray-700 whitespace-pre-line">
                    {game.description}
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <div className="space-y-6">
                    {game.min_requirements && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Минимальные требования:</h3>
                        <div className="text-gray-700 whitespace-pre-line">
                          {game.min_requirements}
                        </div>
                      </div>
                    )}
                    {game.recommended_requirements && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Рекомендуемые требования:</h3>
                        <div className="text-gray-700 whitespace-pre-line">
                          {game.recommended_requirements}
                        </div>
                      </div>
                    )}
                    {!game.min_requirements && !game.recommended_requirements && (
                      <p className="text-gray-500">Требования не указаны</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <p className="text-gray-500">Отзывы скоро появятся</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Галерея изображений */}
          {game.images && game.images.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Скриншоты</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {game.images.map((image, index) => (
                  <div key={index} className="card overflow-hidden">
                    <img
                      src={`http://localhost:8000${image.image}`}
                      alt={`Скриншот ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка - покупка */}
        <div>
          <div className="card sticky top-8">
            <div className="p-6">
              {/* Цена */}
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {game.is_free ? 'Бесплатно' : `${game.price} ₽`}
                </div>
                {game.rental_price && (
                  <div className="text-sm text-gray-600">
                    Аренда: {game.rental_price} ₽ на {game.rental_days} дней
                  </div>
                )}
              </div>

              {/* Кнопки покупки */}
              <div className="space-y-3 mb-6">
                {game.is_free ? (
                  <button className="btn-primary w-full">
                    Скачать бесплатно
                  </button>
                ) : (
                  <>
                    <button className="btn-primary w-full">
                      Купить за {game.price} ₽
                    </button>
                    {game.rental_price && (
                      <button className="btn-secondary w-full">
                        Арендовать за {game.rental_price} ₽
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Информация о покупке */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Что включено:</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Полная версия игры
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Будущие обновления
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Техническая поддержка
                  </li>
                </ul>
              </div>

              {/* Детали игры */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Детали:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Версия:</span>
                    <span className="font-medium">{game.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Дата публикации:</span>
                    <span className="font-medium">
                      {new Date(game.published_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Скачиваний:</span>
                    <span className="font-medium">{game.downloads}</span>
                  </div>
                  {game.genre && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Жанр:</span>
                      <span className="font-medium">{game.genre}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Похожие игры */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">От разработчика</h3>
            <div className="space-y-3">
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <div className="font-medium">{game.developer?.username}</div>
                    <div className="text-xs text-gray-500">Разработчик</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;