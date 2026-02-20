import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TopicPage = () => {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopic();
    fetchPosts();
  }, [id]);

  const fetchTopic = async () => {
    try {
      const response = await apiClient.get(`/forum/topics/${id}/`);
      setTopic(response.data);
    } catch (err) {
      console.error('Ошибка загрузки темы:', err);
      
      if (err.response?.status === 404) {
        setError('Тема не найдена');
      } else if (err.code === 'ECONNABORTED') {
        setError('Превышено время ожидания ответа от сервера');
      } else if (err.code === 'ERR_NETWORK') {
        setError(
          process.env.NODE_ENV === 'development'
            ? 'Не удалось подключиться к серверу. Убедитесь, что Django сервер запущен'
            : 'Ошибка подключения к серверу. Проверьте интернет-соединение'
        );
      } else {
        setError('Не удалось загрузить тему');
      }
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get(`/forum/topics/${id}/posts/`);
      setPosts(response.data);
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
      // Не показываем ошибку пользователю для постов, только в консоль
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!newPost.trim()) {
      setError('Сообщение не может быть пустым');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('📤 Отправка сообщения:', { 
        content: newPost,
        topic: id 
      });

      const response = await apiClient.post(
        `/forum/topics/${id}/add_post/`,
        { 
          content: newPost
        }
      );
      
      console.log('✅ Ответ:', response.data);
      
      // Добавляем новое сообщение в список
      setPosts([...posts, response.data]);
      setNewPost('');
      
    } catch (err) {
      console.error('❌ Ошибка при добавлении сообщения:', err);
      console.error('Детали:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
        setTimeout(() => navigate('/auth'), 2000);
      } else if (err.response?.status === 403) {
        setError('У вас нет прав для добавления сообщений в эту тему');
      } else if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => {
              if (field === 'non_field_errors') {
                return Array.isArray(errors) ? errors.join(', ') : errors;
              }
              return `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
            })
            .join('\n');
          setError(errorMessages || 'Ошибка валидации');
        } else {
          setError(errorData || 'Ошибка при добавлении сообщения');
        }
      } else if (err.code === 'ECONNABORTED') {
        setError('Превышено время ожидания. Попробуйте еще раз');
      } else {
        setError('Ошибка при добавлении сообщения. Попробуйте позже');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getUserAvatar = (author) => {
    if (!author) return 'Аноним';
    
    if (author.avatar) {
      if (author.avatar.startsWith('http')) {
        return author.avatar;
      }
      const baseUrl = API_URL.replace('/api', '');
      return `${baseUrl}${author.avatar}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка темы...</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Тема не найдена'}
          </h1>
          <p className="text-gray-600 mb-6">
            Возможно, тема была удалена или у вас нет прав для ее просмотра
          </p>
          <Link to="/forum" className="btn-primary">
            Вернуться к форуму
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Навигация */}
      <div className="mb-6">
        <nav className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-primary">Главная</Link>
          <span className="mx-2">/</span>
          <Link to="/forum" className="hover:text-primary">Форум</Link>
          <span className="mx-2">/</span>
          {topic.category && (
            <>
              <Link to={`/forum/category/${topic.category}`} className="hover:text-primary">
                {topic.category_name || 'Категория'}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium truncate">
            {topic.title}
          </span>
        </nav>
      </div>

      {/* Тема */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">
              {topic.title}
            </h1>
            <div className="flex gap-2">
              {topic.is_pinned && (
                <span className="bg-primary text-white text-xs px-3 py-1 rounded-full flex items-center">
                  📌 Закреплено
                </span>
              )}
              {topic.is_locked && (
                <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full flex items-center">
                  🔒 Закрыто
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-3 text-white font-bold">
              {topic.author?.avatar ? (
                <img 
                  src={getUserAvatar(topic.author)} 
                  alt={topic.author.username}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = topic.author?.username?.charAt(0).toUpperCase() || '?';
                  }}
                />
              ) : (
                topic.author?.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div>
              <div className="font-medium text-lg">{topic.author?.username || 'Аноним'}</div>
              <div className="text-sm text-gray-500">
                <span title={formatDate(topic.created_at)}>
                  {formatDate(topic.created_at)}
                </span>
                {topic.views > 0 && (
                  <span className="ml-4">👁 {topic.views} просмотров</span>
                )}
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {topic.content}
            </div>
          </div>

          {topic.updated_at !== topic.created_at && (
            <div className="mt-4 text-sm text-gray-400 border-t pt-4">
              Изменено: {formatDate(topic.updated_at)}
            </div>
          )}
        </div>
      </div>

      {/* Сообщения */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Ответы ({posts.length})
        </h2>

        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id} className="card hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {post.author?.avatar ? (
                        <img 
                          src={getUserAvatar(post.author)} 
                          alt={post.author.username}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = post.author?.username?.charAt(0).toUpperCase() || '?';
                          }}
                        />
                      ) : (
                        <span className="text-lg font-medium">
                          {post.author?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {post.author?.username || 'Аноним'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(post.created_at)}
                      </span>
                      {post.is_edited && (
                        <span className="text-xs text-gray-400">(изменено)</span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-line break-words">
                      {post.content}
                    </p>
                    
                    {/* Номер ответа */}
                    <div className="mt-2 text-xs text-gray-400 text-right">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Пока нет ответов
            </h3>
            <p className="text-gray-600">
              Будьте первым, кто ответит в этой теме!
            </p>
          </div>
        )}
      </div>

      {/* Форма ответа */}
      {topic.is_locked ? (
        <div className="card p-6 text-center bg-gray-50">
          <p className="text-gray-600">
            🔒 Эта тема закрыта для новых ответов
          </p>
        </div>
      ) : isAuthenticated ? (
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-2">
                ✏️
              </span>
              Написать ответ
            </h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 whitespace-pre-line text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddPost}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="input-field w-full h-32 mb-4 resize-y"
                placeholder="Введите ваш ответ..."
                disabled={submitting}
                maxLength={5000}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {newPost.length}/5000 символов
                </div>
                
                <button 
                  type="submit" 
                  className={`btn-primary px-6 ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  disabled={submitting || !newPost.trim()}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Отправка...
                    </span>
                  ) : (
                    'Отправить ответ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-gray-600 mb-4">
            Чтобы ответить в теме, необходимо войти в аккаунт
          </p>
          <Link 
            to="/auth" 
            className="btn-primary inline-flex items-center"
            state={{ from: `/forum/topic/${id}` }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Войти
          </Link>
        </div>
      )}

      {/* Кнопка "Наверх" */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-primary text-white w-12 h-12 rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
        aria-label="Наверх"
      >
        ↑
      </button>
    </div>
  );
};

export default TopicPage;