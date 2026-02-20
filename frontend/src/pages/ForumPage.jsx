import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';


const ForumPage = () => {
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchCategories();
    fetchTopics();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/forum/categories/`, {
        headers: getAuthHeaders()
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  const fetchTopics = async (categoryId = null) => {
    try {
      setLoading(true);
      const url = categoryId 
        ? `${API_URL}/forum/topics/?category=${categoryId}`
        : `${API_URL}/forum/topics/`;
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      setTopics(response.data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки тем:', err);
      setError('Ошибка загрузки тем');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchTopics(category.id);
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      setError('Заполните все поля');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Не авторизован');
        navigate('/auth');
        return;
      }

      const topicData = {
        title: newTopic.title,
        content: newTopic.content,
        category: selectedCategory?.id || 1
      };

      const response = await axios.post(
        `${API_URL}/forum/topics/`,
        topicData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setTopics([response.data, ...topics]);
      setShowNewTopicForm(false);
      setNewTopic({ title: '', content: '' });
      setError(null);
    } catch (err) {
      console.error('Ошибка при создании темы:', err);
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setError('Ошибка при создании темы');
      }
    }
  };

  if (categories.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Форум</h1>
          <div className="card p-12">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">Категории не найдены</h2>
            <p className="text-gray-600 mb-4">
              Администратор еще не создал категории для форума.
            </p>
            {user?.role === 'admin' && (
              <a
                href="http://localhost:8000/admin/api/forumcategory/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Создать категории в админке
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Форум</h1>
        {isAuthenticated ? (
          <button
            onClick={() => setShowNewTopicForm(!showNewTopicForm)}
            className="btn-primary"
          >
            + Новая тема
          </button>
        ) : (
          <Link to="/auth" className="btn-primary">
            Войдите чтобы создать тему
          </Link>
        )}
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl whitespace-pre-line">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Категории */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <div className="p-6">
              <h2 className="font-semibold text-lg mb-4">Категории</h2>
              {categories.length > 0 ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      !selectedCategory 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    Все темы
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedCategory?.id === category.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500">
                        {category.topic_count || 0} тем
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Категории загружаются...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Список тем */}
        <div className="lg:col-span-3">
          {showNewTopicForm && (
            <div className="card mb-6">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Создать новую тему</h2>
                <form onSubmit={handleCreateTopic}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категория
                    </label>
                    <select
                      value={selectedCategory?.id || ''}
                      onChange={(e) => {
                        const cat = categories.find(c => c.id === Number(e.target.value));
                        setSelectedCategory(cat);
                      }}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Заголовок
                    </label>
                    <input
                      type="text"
                      value={newTopic.title}
                      onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                      className="input-field w-full"
                      placeholder="Введите заголовок темы"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сообщение
                    </label>
                    <textarea
                      value={newTopic.content}
                      onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                      className="input-field w-full h-32"
                      placeholder="Введите текст сообщения"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">
                      Создать
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewTopicForm(false);
                        setNewTopic({ title: '', content: '' });
                        setError(null);
                      }}
                      className="btn-secondary"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedCategory 
                      ? `В категории "${selectedCategory.name}" пока нет тем` 
                      : 'Тем пока нет'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isAuthenticated 
                      ? 'Будьте первым, кто создаст тему!' 
                      : 'Войдите, чтобы создать тему'}
                  </p>
                  {isAuthenticated ? (
                    <button
                      onClick={() => setShowNewTopicForm(true)}
                      className="btn-primary"
                    >
                      Создать тему
                    </button>
                  ) : (
                    <Link to="/auth" className="btn-primary">
                      Войти
                    </Link>
                  )}
                </div>
              ) : (
                topics.map((topic) => (
                  <Link
                    key={topic.id}
                    to={`/forum/topic/${topic.id}`}
                    className="card block hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {topic.title}
                        </h3>
                        {topic.is_pinned && (
                          <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                            Закреплено
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {topic.content}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-4">
                          Автор: {topic.author?.username}
                        </span>
                        <span className="mr-4">
                          {topic.post_count || 0} ответов
                        </span>
                        <span>
                          {new Date(topic.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPage;