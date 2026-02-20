import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'http://127.0.0.1:8000/api';

const TopicPage = () => {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopic();
    fetchPosts();
  }, [id]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTopic = async () => {
    try {
      const response = await axios.get(`${API_URL}/forum/topics/${id}/`, {
        headers: getAuthHeaders()
      });
      setTopic(response.data);
    } catch (err) {
      console.error('Ошибка загрузки темы:', err);
      setError('Тема не найдена');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/forum/topics/${id}/posts/`, {
        headers: getAuthHeaders()
      });
      setPosts(response.data);
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
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

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Не авторизован');
        navigate('/auth');
        return;
      }

      console.log('📤 Отправка сообщения:', { 
        content: newPost,
        topic: id 
      });

      const response = await axios.post(
        `${API_URL}/forum/topics/${id}/add_post/`,
        { 
          content: newPost,
          topic: id  // Добавляем topic в данные
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Ответ:', response.data);
      
      setPosts([...posts, response.data]);
      setNewPost('');
      setError(null);
    } catch (err) {
      console.error('❌ Ошибка при добавлении сообщения:', err);
      console.error('Детали:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
        setTimeout(() => navigate('/auth'), 2000);
      } else if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          setError(errorMessages || 'Ошибка валидации');
        } else {
          setError('Ошибка при добавлении сообщения');
        }
      } else {
        setError('Ошибка при добавлении сообщения');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Тема не найдена'}</h1>
          <Link to="/forum" className="btn-primary">
            Вернуться к форуму
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Навигация */}
      <div className="mb-6">
        <nav className="flex text-sm text-gray-600">
          <Link to="/forum" className="hover:text-primary">Форум</Link>
          <span className="mx-2">/</span>
          <Link to={`/forum/category/${topic.category}`} className="hover:text-primary">
            {topic.category_name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{topic.title}</span>
        </nav>
      </div>

      {/* Тема */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
            {topic.is_pinned && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">Закреплено</span>
            )}
          </div>
          
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              {topic.author?.avatar ? (
                <img src={topic.author.avatar} alt="" className="w-full h-full rounded-full" />
              ) : (
                <span className="text-lg">{topic.author?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="font-medium">{topic.author?.username}</div>
              <div className="text-sm text-gray-500">
                {new Date(topic.created_at).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">{topic.content}</p>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="space-y-4 mb-6">
        {posts.map((post) => (
          <div key={post.id} className="card">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-sm">{post.author?.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium">{post.author?.username}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Форма ответа */}
      {isAuthenticated ? (
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ответить</h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
                {error}
              </div>
            )}
            <form onSubmit={handleAddPost}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="input-field w-full h-32 mb-4"
                placeholder="Напишите ваш ответ..."
                required
              />
              <button type="submit" className="btn-primary">
                Отправить
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-gray-600 mb-4">
            Чтобы ответить в теме, необходимо войти в аккаунт
          </p>
          <Link to="/auth" className="btn-primary">
            Войти
          </Link>
        </div>
      )}
    </div>
  );
};

export default TopicPage;