import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const UploadGamePage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    price: '',
    is_free: false,
    rental_price: '',
    rental_days: '',
    genre: '',
    tags: '',
    version: '1.0.0',
    min_requirements: '',
    recommended_requirements: '',
    status: 'draft',
    game_type: 'executable' // 'executable', 'html5', 'webgl'
  });

  const [coverImage, setCoverImage] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [gameFile, setGameFile] = useState(null);
  const [demoFile, setDemoFile] = useState(null);
  const [html5EntryFile, setHtml5EntryFile] = useState('index.html');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Отладка
  useEffect(() => {
    console.log('📄 UploadGamePage загружена');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  loading:', loading);
    console.log('  user:', user);
    console.log('  API_URL:', API_URL);
  }, [isAuthenticated, loading, user]);

  // Проверка авторизации
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('⛔ Не авторизован, редирект на /auth');
        navigate('/auth');
        return;
      }
      
      if (user?.role !== 'developer' && user?.role !== 'admin') {
        console.log('⛔ Не разработчик, роль:', user?.role);
        navigate('/');
        return;
      }
      
      console.log('✅ Доступ разрешен');
    }
  }, [isAuthenticated, loading, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Очищаем ошибку поля при изменении
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Изображение не должно превышать 5MB');
        return;
      }
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        return;
      }
      
      setCoverImage(file);
      setFieldErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.cover_image;
        return newErrors;
      });
    }
  };

  const handleScreenshotsChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      setError('Некоторые файлы превышают 5MB');
    }
    
    // Проверяем типы файлов
    const invalidFiles = validFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Пожалуйста, выбирайте только изображения');
      return;
    }
    
    // Ограничиваем количество скриншотов
    if (screenshots.length + validFiles.length > 10) {
      setError('Максимум 10 скриншотов');
      return;
    }
    
    setScreenshots(prev => [...prev, ...validFiles]);
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleGameFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = formData.game_type === 'html5' ? 200 : 500;
      if (file.size > maxSize * 1024 * 1024) {
        setError(`Файл игры не должен превышать ${maxSize}MB`);
        return;
      }
      
      // Для HTML5 проверяем, что это ZIP
      if (formData.game_type === 'html5' && !file.name.toLowerCase().endsWith('.zip')) {
        setError('HTML5 игра должна быть загружена в ZIP архиве');
        return;
      }
      
      setGameFile(file);
      setFieldErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.game_file;
        return newErrors;
      });
    }
  };

  const handleDemoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError('Демо-версия не должна превышать 100MB');
        return;
      }
      setDemoFile(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Название игры обязательно';
    }
    
    if (!formData.short_description.trim()) {
      errors.short_description = 'Краткое описание обязательно';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Полное описание обязательно';
    }
    
    if (!coverImage) {
      errors.cover_image = 'Обложка игры обязательна';
    }
    
    if (!gameFile) {
      errors.game_file = 'Файл игры обязателен';
    }
    
    if (!formData.is_free && parseFloat(formData.price) <= 0) {
      if (!formData.price) {
        errors.price = 'Цена обязательна для платной игры';
      } else if (parseFloat(formData.price) < 0) {
        errors.price = 'Цена не может быть отрицательной';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setError('');
    setSuccess('');
    setSubmitLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Вы не авторизованы');
        navigate('/auth');
        return;
      }

      console.log('📤 Отправка данных на:', `${API_URL}/games/`);
      
      const formDataToSend = new FormData();

      // Добавляем основные поля
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          // Для числовых полей проверяем, что они не пустые строки
          if (key === 'price' || key === 'rental_price' || key === 'rental_days') {
            if (formData[key] !== '') {
              formDataToSend.append(key, formData[key]);
            }
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      // Добавляем информацию о HTML5 игре
      if (formData.game_type === 'html5') {
        formDataToSend.append('html5_entry', html5EntryFile);
      }

      // Добавляем файлы
      if (coverImage) {
        formDataToSend.append('cover_image', coverImage);
      }
      
      screenshots.forEach((screenshot) => {
        formDataToSend.append('screenshots', screenshot);
      });

      if (gameFile) {
        formDataToSend.append('game_file', gameFile);
      }

      if (demoFile) {
        formDataToSend.append('demo_file', demoFile);
      }

      const response = await apiClient.post('/games/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      console.log('✅ Ответ:', response.data);
      setSuccess('Игра успешно создана! Сейчас вы будете перенаправлены на страницу игры.');
      
      setTimeout(() => {
        navigate(`/game/${response.data.id}`);
      }, 2000);

    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      console.error('  Статус:', err.response?.status);
      console.error('  Детали:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите снова.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/auth'), 2000);
      } else if (err.response?.status === 403) {
        setError('У вас нет прав для создания игр. Нужна роль разработчика.');
      } else if (err.response?.status === 413) {
        setError('Файл слишком большой. Проверьте размер загружаемых файлов.');
      } else if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Сохраняем ошибки полей
          setFieldErrors(errorData);
          
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => {
              const fieldName = {
                title: 'Название',
                description: 'Описание',
                short_description: 'Краткое описание',
                price: 'Цена',
                game_file: 'Файл игры',
                cover_image: 'Обложка'
              }[field] || field;
              
              return `${fieldName}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
            })
            .join('\n');
          setError(errorMessages || 'Ошибка при загрузке игры');
        } else {
          setError(String(errorData));
        }
      } else if (err.code === 'ECONNABORTED') {
        setError('Превышено время ожидания. Попробуйте ещё раз.');
      } else if (err.code === 'ERR_NETWORK') {
        setError(
          process.env.NODE_ENV === 'development'
            ? 'Не удалось подключиться к серверу. Убедитесь, что Django сервер запущен на http://127.0.0.1:8000'
            : 'Ошибка сети. Проверьте подключение к интернету'
        );
      } else {
        setError('Ошибка при загрузке игры. Попробуйте позже.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Показываем загрузку
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-game-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="upload-header mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Загрузить игру</h1>
          <p className="text-gray-600">
            Заполните информацию о вашей игре и загрузите файлы
          </p>
        </div>

        {/* Отладочная информация (только в разработке) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
            <p><strong>Статус:</strong> {isAuthenticated ? '✅ Авторизован' : '❌ Не авторизован'}</p>
            <p><strong>Пользователь:</strong> {user ? user.username : 'нет'}</p>
            <p><strong>Роль:</strong> {user ? user.role : 'нет'}</p>
            <p><strong>API URL:</strong> {API_URL}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
            <div className="flex items-start">
              <span className="mr-2 text-xl">⚠️</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-start">
              <span className="mr-2 text-xl">✅</span>
              <span className="flex-1">{success}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            {[
              { id: 'basic', label: 'Основное' },
              { id: 'type', label: 'Тип игры' },
              { id: 'media', label: 'Медиа' },
              { id: 'files', label: 'Файлы' },
              { id: 'requirements', label: 'Требования' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex-1 px-4 py-3 text-center ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {fieldErrors[tab.id] && (
                  <span className="ml-2 text-red-500">*</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Основная информация</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Название игры *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Введите название игры"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
                  Краткое описание *
                </label>
                <textarea
                  id="short_description"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.short_description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows="3"
                  placeholder="Краткое описание для карточки игры"
                  maxLength="300"
                />
                <div className="flex justify-between mt-1">
                  {fieldErrors.short_description && (
                    <p className="text-sm text-red-500">{fieldErrors.short_description}</p>
                  )}
                  <small className="text-gray-500 ml-auto">
                    {formData.short_description.length}/300
                  </small>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Полное описание *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows="6"
                  placeholder="Подробное описание игры"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                    Жанр
                  </label>
                  <input
                    type="text"
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Например: RPG, Шутер, Стратегия"
                  />
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Теги (через запятую)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="экшен, приключения, инди"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
                  Версия
                </label>
                <input
                  type="text"
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0.0"
                />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Цена (₽)
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                      placeholder="299"
                    />
                    {fieldErrors.price && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="rental_price" className="block text-sm font-medium text-gray-700 mb-2">
                      Цена аренды (₽/день)
                    </label>
                    <input
                      type="number"
                      id="rental_price"
                      name="rental_price"
                      value={formData.rental_price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      placeholder="29"
                    />
                  </div>

                  <div>
                    <label htmlFor="rental_days" className="block text-sm font-medium text-gray-700 mb-2">
                      Дней аренды
                    </label>
                    <input
                      type="number"
                      id="rental_days"
                      name="rental_days"
                      value={formData.rental_days}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      placeholder="7"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликовать сразу</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Тип игры</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите тип игры *
                </label>
                <div className="space-y-3">
                  <label className={`flex items-start p-4 border rounded-lg cursor-pointer ${
                    formData.game_type === 'executable' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="game_type"
                      value="executable"
                      checked={formData.game_type === 'executable'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">💻 Исполняемый файл</div>
                      <p className="text-sm text-gray-500">
                        .exe, .app - классические игры для Windows/Mac
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start p-4 border rounded-lg cursor-pointer ${
                    formData.game_type === 'html5' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="game_type"
                      value="html5"
                      checked={formData.game_type === 'html5'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">🌐 HTML5 / WebGL</div>
                      <p className="text-sm text-gray-500">
                        Игра запускается прямо в браузере (можно играть онлайн)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.game_type === 'html5' && (
                <div>
                  <label htmlFor="html5_entry" className="block text-sm font-medium text-gray-700 mb-2">
                    Главный файл HTML5 игры
                  </label>
                  <select
                    id="html5_entry"
                    value={html5EntryFile}
                    onChange={(e) => setHtml5EntryFile(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="index.html">index.html</option>
                    <option value="game.html">game.html</option>
                    <option value="play.html">play.html</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Укажите какой файл открывать для запуска игры
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">ℹ️ О типах игр:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Исполняемый файл</strong> - пользователи скачивают и устанавливают игру (до 500 MB)</li>
                  <li>• <strong>HTML5 / WebGL</strong> - игра запускается прямо в браузере (до 200 MB, ZIP архив)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Медиа</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Обложка игры *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  fieldErrors.cover_image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="file"
                    id="cover_image"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                  <label htmlFor="cover_image" className="cursor-pointer">
                    <span className="text-4xl mb-2 block">📸</span>
                    <span className="text-gray-600">
                      {coverImage ? coverImage.name : 'Выберите обложку'}
                    </span>
                  </label>
                </div>
                {fieldErrors.cover_image && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.cover_image}</p>
                )}
                {coverImage && (
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={URL.createObjectURL(coverImage)} 
                      alt="Cover preview" 
                      className="h-32 w-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Скриншоты (до 10 штук)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400">
                  <input
                    type="file"
                    id="screenshots"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotsChange}
                    className="hidden"
                  />
                  <label htmlFor="screenshots" className="cursor-pointer">
                    <span className="text-4xl mb-2 block">🖼️</span>
                    <span className="text-gray-600">
                      Выберите скриншоты
                    </span>
                  </label>
                </div>

                {screenshots.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {screenshots.map((screenshot, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={URL.createObjectURL(screenshot)} 
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Файлы игры</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Файл игры *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  fieldErrors.game_file ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="file"
                    id="game_file"
                    accept={formData.game_type === 'html5' ? '.zip' : '.zip,.rar,.7z,.exe,.app,.dmg'}
                    onChange={handleGameFileChange}
                    className="hidden"
                  />
                  <label htmlFor="game_file" className="cursor-pointer">
                    <span className="text-4xl mb-2 block">🎮</span>
                    <span className="text-gray-600">
                      {gameFile ? gameFile.name : (
                        formData.game_type === 'html5' 
                          ? 'Загрузить ZIP архив с HTML5 игрой' 
                          : 'Загрузить игру (ZIP, RAR, EXE)'
                      )}
                    </span>
                  </label>
                </div>
                {fieldErrors.game_file && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.game_file}</p>
                )}
                {gameFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Размер: {(gameFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Демо-версия (опционально)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400">
                  <input
                    type="file"
                    id="demo_file"
                    accept=".zip,.rar,.7z,.exe,.app,.dmg"
                    onChange={handleDemoFileChange}
                    className="hidden"
                  />
                  <label htmlFor="demo_file" className="cursor-pointer">
                    <span className="text-4xl mb-2 block">🎯</span>
                    <span className="text-gray-600">
                      {demoFile ? demoFile.name : 'Загрузить демо-версию'}
                    </span>
                  </label>
                </div>
                {demoFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Размер: {(demoFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Важно:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Максимальный размер игры: {formData.game_type === 'html5' ? '200 MB' : '500 MB'}</li>
                  <li>• Максимальный размер демо-версии: 100 MB</li>
                  <li>• Поддерживаемые форматы: ZIP, RAR, 7Z, EXE, APP, DMG</li>
                  {formData.game_type === 'html5' && (
                    <li>• HTML5 игры должны быть в ZIP архиве с файлом index.html</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Системные требования</h2>

              <div>
                <label htmlFor="min_requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Минимальные требования
                </label>
                <textarea
                  id="min_requirements"
                  name="min_requirements"
                  value={formData.min_requirements}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="6"
                  placeholder="ОС: Windows 10
Процессор: Intel Core i5
Оперативная память: 8 GB
Видеокарта: NVIDIA GeForce GTX 960
DirectX: Версии 11
Место на диске: 10 GB"
                />
              </div>

              <div>
                <label htmlFor="recommended_requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Рекомендуемые требования
                </label>
                <textarea
                  id="recommended_requirements"
                  name="recommended_requirements"
                  value={formData.recommended_requirements}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="6"
                  placeholder="ОС: Windows 11
Процессор: Intel Core i7
Оперативная память: 16 GB
Видеокарта: NVIDIA GeForce RTX 2060
DirectX: Версии 12
Место на диске: 10 GB"
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/developer')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-4"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Загрузка {uploadProgress}%
                </>
              ) : (
                <>
                  <span className="mr-2">📤</span>
                  Опубликовать игру
                </>
              )}
            </button>
          </div>

          {submitLoading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center mt-2">
                {uploadProgress}% загружено
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadGamePage;