import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

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

  // Отладка
  useEffect(() => {
    console.log('📄 UploadGamePage загружена');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  loading:', loading);
    console.log('  user:', user);
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
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Изображение не должно превышать 5MB');
        return;
      }
      setCoverImage(file);
    }
  };

  const handleScreenshotsChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      setError('Некоторые файлы превышают 5MB');
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
      setGameFile(file);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
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
      
      screenshots.forEach((screenshot, index) => {
        formDataToSend.append(`screenshots`, screenshot);
      });

      if (gameFile) {
        formDataToSend.append('game_file', gameFile);
      }

      if (demoFile) {
        formDataToSend.append('demo_file', demoFile);
      }

      const response = await axios.post(`${API_URL}/games/`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      console.log('✅ Ответ:', response.data);
      setSuccess('Игра успешно создана!');
      
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
      } else if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          setError(errorMessages || 'Ошибка при загрузке игры');
        } else {
          setError(String(errorData));
        }
      } else {
        setError('Ошибка при загрузке игры');
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
      <div className="container">
        <div className="upload-header">
          <h1 className="upload-title">Загрузить игру</h1>
          <p className="upload-subtitle">
            Заполните информацию о вашей игре и загрузите файлы
          </p>
        </div>

        {/* Отладочная информация */}
        <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
          <p><strong>Статус:</strong> {isAuthenticated ? '✅ Авторизован' : '❌ Не авторизован'}</p>
          <p><strong>Пользователь:</strong> {user ? user.username : 'нет'}</p>
          <p><strong>Роль:</strong> {user ? user.role : 'нет'}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="whitespace-pre-line">{error}</span>
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span>{success}</span>
          </div>
        )}

        <div className="upload-tabs">
          <button
            className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Основное
          </button>
          <button
            className={`tab-btn ${activeTab === 'type' ? 'active' : ''}`}
            onClick={() => setActiveTab('type')}
          >
            Тип игры
          </button>
          <button
            className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            Медиа
          </button>
          <button
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Файлы
          </button>
          <button
            className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
            onClick={() => setActiveTab('requirements')}
          >
            Требования
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {activeTab === 'basic' && (
            <div className="tab-pane active">
              <div className="form-section">
                <h2 className="section-title">Основная информация</h2>
                
                <div className="form-group">
                  <label htmlFor="title">Название игры *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    placeholder="Введите название игры"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="short_description">Краткое описание *</label>
                  <textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    rows="3"
                    placeholder="Краткое описание для карточки игры"
                    maxLength="300"
                  />
                  <small className="char-counter">
                    {formData.short_description.length}/300
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Полное описание *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    rows="6"
                    placeholder="Подробное описание игры"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="genre">Жанр</label>
                    <input
                      type="text"
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Например: RPG, Шутер, Стратегия"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tags">Теги (через запятую)</label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="экшен, приключения, инди"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="version">Версия</label>
                  <input
                    type="text"
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="1.0.0"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_free"
                      checked={formData.is_free}
                      onChange={handleInputChange}
                    />
                    Бесплатная игра
                  </label>
                </div>

                {!formData.is_free && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="price">Цена (₽)</label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="form-control"
                          min="0"
                          step="0.01"
                          placeholder="299"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rental_price">Цена аренды (₽/день)</label>
                        <input
                          type="number"
                          id="rental_price"
                          name="rental_price"
                          value={formData.rental_price}
                          onChange={handleInputChange}
                          className="form-control"
                          min="0"
                          step="0.01"
                          placeholder="29"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rental_days">Дней аренды</label>
                        <input
                          type="number"
                          id="rental_days"
                          name="rental_days"
                          value={formData.rental_days}
                          onChange={handleInputChange}
                          className="form-control"
                          min="1"
                          placeholder="7"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="status">Статус</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="draft">Черновик</option>
                    <option value="published">Опубликовать сразу</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="tab-pane active">
              <div className="form-section">
                <h2 className="section-title">Тип игры</h2>
                
                <div className="form-group">
                  <label>Выберите тип игры *</label>
                  <div className="game-type-options">
                    <label className="game-type-option">
                      <input
                        type="radio"
                        name="game_type"
                        value="executable"
                        checked={formData.game_type === 'executable'}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <span className="option-icon">💻</span>
                        <div>
                          <h4>Исполняемый файл</h4>
                          <p>.exe, .app - классические игры для Windows/Mac</p>
                        </div>
                      </div>
                    </label>

                    <label className="game-type-option">
                      <input
                        type="radio"
                        name="game_type"
                        value="html5"
                        checked={formData.game_type === 'html5'}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <span className="option-icon">🌐</span>
                        <div>
                          <h4>HTML5 / WebGL</h4>
                          <p>Игра запускается прямо в браузере (можно играть онлайн)</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.game_type === 'html5' && (
                  <div className="form-group">
                    <label htmlFor="html5_entry">Главный файл HTML5 игры</label>
                    <select
                      id="html5_entry"
                      value={html5EntryFile}
                      onChange={(e) => setHtml5EntryFile(e.target.value)}
                      className="form-control"
                    >
                      <option value="index.html">index.html</option>
                      <option value="game.html">game.html</option>
                      <option value="play.html">play.html</option>
                    </select>
                    <small className="text-muted">
                      Укажите какой файл открывать для запуска игры
                    </small>
                  </div>
                )}

                <div className="form-info">
                  <h4>ℹ️ О типах игр:</h4>
                  <ul>
                    <li><strong>Исполняемый файл</strong> - пользователи скачивают и устанавливают игру</li>
                    <li><strong>HTML5 / WebGL</strong> - игра запускается прямо в браузере (максимум 200MB)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="tab-pane active">
              <div className="form-section">
                <h2 className="section-title">Медиа</h2>

                <div className="form-group">
                  <label>Обложка игры *</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="cover_image"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="file-input"
                    />
                    <label htmlFor="cover_image" className="file-upload-label">
                      <span className="upload-icon">📸</span>
                      <span className="upload-text">
                        {coverImage ? coverImage.name : 'Выберите обложку'}
                      </span>
                    </label>
                  </div>
                  {coverImage && (
                    <div className="file-preview">
                      <img src={URL.createObjectURL(coverImage)} alt="Cover preview" />
                      <button
                        type="button"
                        onClick={() => setCoverImage(null)}
                        className="remove-file"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Скриншоты (до 10 штук)</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="screenshots"
                      accept="image/*"
                      multiple
                      onChange={handleScreenshotsChange}
                      className="file-input"
                    />
                    <label htmlFor="screenshots" className="file-upload-label">
                      <span className="upload-icon">🖼️</span>
                      <span className="upload-text">
                        Выберите скриншоты
                      </span>
                    </label>
                  </div>

                  {screenshots.length > 0 && (
                    <div className="screenshots-grid">
                      {screenshots.map((screenshot, index) => (
                        <div key={index} className="screenshot-item">
                          <img src={URL.createObjectURL(screenshot)} alt={`Screenshot ${index + 1}`} />
                          <button
                            type="button"
                            onClick={() => removeScreenshot(index)}
                            className="remove-screenshot"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="tab-pane active">
              <div className="form-section">
                <h2 className="section-title">Файлы игры</h2>

                <div className="form-group">
                  <label>Файл игры *</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="game_file"
                      accept={formData.game_type === 'html5' ? '.zip' : '.zip,.rar,.7z,.exe,.app,.dmg'}
                      onChange={handleGameFileChange}
                      className="file-input"
                    />
                    <label htmlFor="game_file" className="file-upload-label">
                      <span className="upload-icon">🎮</span>
                      <span className="upload-text">
                        {gameFile ? gameFile.name : (
                          formData.game_type === 'html5' 
                            ? 'Загрузить ZIP архив с HTML5 игрой' 
                            : 'Загрузить игру (ZIP, RAR, EXE)'
                        )}
                      </span>
                    </label>
                  </div>
                  {gameFile && (
                    <div className="file-info">
                      <span>Размер: {(gameFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Демо-версия (опционально)</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="demo_file"
                      accept=".zip,.rar,.7z,.exe,.app,.dmg"
                      onChange={handleDemoFileChange}
                      className="file-input"
                    />
                    <label htmlFor="demo_file" className="file-upload-label">
                      <span className="upload-icon">🎯</span>
                      <span className="upload-text">
                        {demoFile ? demoFile.name : 'Загрузить демо-версию'}
                      </span>
                    </label>
                  </div>
                  {demoFile && (
                    <div className="file-info">
                      <span>Размер: {(demoFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>

                <div className="form-info">
                  <h4>⚠️ Важно:</h4>
                  <ul>
                    <li>Максимальный размер игры: {formData.game_type === 'html5' ? '200 MB' : '500 MB'}</li>
                    <li>Максимальный размер демо-версии: 100 MB</li>
                    <li>Поддерживаемые форматы: ZIP, RAR, 7Z, EXE, APP, DMG</li>
                    {formData.game_type === 'html5' && (
                      <li>HTML5 игры должны быть в ZIP архиве с файлом index.html</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="tab-pane active">
              <div className="form-section">
                <h2 className="section-title">Системные требования</h2>

                <div className="form-group">
                  <label htmlFor="min_requirements">Минимальные требования</label>
                  <textarea
                    id="min_requirements"
                    name="min_requirements"
                    value={formData.min_requirements}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="6"
                    placeholder="ОС: Windows 10
Процессор: Intel Core i5
Оперативная память: 8 GB
Видеокарта: NVIDIA GeForce GTX 960
DirectX: Версии 11
Место на диске: 10 GB"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recommended_requirements">Рекомендуемые требования</label>
                  <textarea
                    id="recommended_requirements"
                    name="recommended_requirements"
                    value={formData.recommended_requirements}
                    onChange={handleInputChange}
                    className="form-control"
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
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <span className="spinner"></span>
                  Загрузка {uploadProgress}%
                </>
              ) : (
                <>
                  <span className="btn-icon">📤</span>
                  Опубликовать игру
                </>
              )}
            </button>
          </div>

          {submitLoading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="progress-text">{uploadProgress}% загружено</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadGamePage;