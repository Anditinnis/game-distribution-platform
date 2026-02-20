import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';

const EditGamePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    price: '',
    is_free: false,
    genre: '',
    tags: '',
    version: '1.0.0',
    status: 'draft',
    game_type: 'executable'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (user?.role !== 'developer' && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (id !== 'new') {
      fetchGame();
    } else {
      setLoading(false);
    }
  }, [id, isAuthenticated, user, navigate]);

  const fetchGame = async () => {
    try {
      const response = await apiClient.get(`/games/${id}/`);
      setFormData(response.data);
    } catch (err) {
      console.error('Ошибка загрузки игры:', err);
      setError('Не удалось загрузить игру');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (id === 'new') {
        await apiClient.post('/games/', formData);
        alert('Игра создана! Теперь можно загрузить файлы');
        navigate('/developer');
      } else {
        await apiClient.put(`/games/${id}/`, formData);
        alert('Изменения сохранены');
        navigate('/developer');
      }
    } catch (err) {
      console.error('Ошибка сохранения игры:', err);
      setError('Ошибка сохранения игры');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {id === 'new' ? 'Новая игра' : 'Редактирование игры'}
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название игры *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Краткое описание *
          </label>
          <textarea
            name="short_description"
            value={formData.short_description}
            onChange={handleInputChange}
            required
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Полное описание *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows="6"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Жанр
            </label>
            <input
              type="text"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Версия
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_free"
            name="is_free"
            checked={formData.is_free}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_free" className="ml-2 text-sm text-gray-700">
            Бесплатная игра
          </label>
        </div>

        {!formData.is_free && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цена (₽)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликовано</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/developer')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditGamePage;