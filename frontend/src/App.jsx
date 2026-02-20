import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import AuthPage from './pages/AuthPage';
import DeveloperDashboard from './pages/DeveloperDashboard';
import ForumPage from './pages/ForumPage';
import TopicPage from './pages/TopicPage';
import ProfilePage from './pages/ProfilePage';
import UploadGamePage from './pages/UploadGamePage';
import { useAuth } from './hooks/useAuth';
import './index.css';
import './App.css';
// Компонент навигации
const Navigation = () => {
  const location = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const getDeveloperLink = () => {
    if (!isAuthenticated) return '/auth';
    if (user?.role === 'developer' || user?.role === 'admin') return '/developer';
    return '/profile?tab=developer';
  };

  if (loading) {
    return (
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <Link to="/" className="logo">
              <div className="logo-icon">G</div>
              <span className="logo-text">GameDistrib</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo">
            <div className="logo-icon">G</div>
            <span className="logo-text">GameDistrib</span>
          </Link>

          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              🏠 Магазин
            </Link>
            <Link to="/forum" className={`nav-link ${isActive('/forum') ? 'active' : ''}`}>
              💬 Форум
            </Link>
            <Link 
              to={getDeveloperLink()} 
              className={`nav-link ${isActive('/developer') || (isActive('/profile') && location.search === '?tab=developer') ? 'active' : ''}`}
            >
              👨‍💻 Разработчикам
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="profile-btn">
                  <div className="profile-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">{user?.username}</span>
                    <span className="profile-role">
                      {user?.role === 'developer' && 'Разработчик'}
                      {user?.role === 'admin' && 'Админ'}
                      {user?.role === 'user' && 'Пользователь'}
                    </span>
                  </div>
                </Link>
                <button onClick={logout} className="logout-btn" title="Выйти">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </>
            ) : (
              <Link to="/auth" className="login-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Войти
              </Link>
            )}
            
            <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer" className="admin-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2"/>
              </svg>
              <span>Админ</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Компонент футера
const Footer = () => {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/games/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const handleRetry = () => {
    setBackendStatus('checking');
    checkBackendStatus();
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <div className="logo-icon">G</div>
              <span className="logo-text">GameDistrib</span>
            </div>
            <p className="footer-description">
              Платформа для независимых разработчиков игр. Публикуйте, распространяйте и монетизируйте свои проекты.
            </p>
          </div>

          <div className="footer-col">
            <h4>Навигация</h4>
            <ul>
              <li>
                <Link to="/">
                  <span>🏠</span> Магазин игр
                </Link>
              </li>
              <li>
                <Link to="/forum">
                  <span>💬</span> Форум
                </Link>
              </li>
              <li>
                <Link to="/developer">
                  <span>👨‍💻</span> Для разработчиков
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Ресурсы</h4>
            <ul>
              <li>
                <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer">
                  <span>⚙️</span> Админ-панель
                </a>
              </li>
              <li>
                <a href="http://localhost:8000/api/" target="_blank" rel="noopener noreferrer">
                  <span>📚</span> API Документация
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Контакты</h4>
            <div className="contact-info">
              <span className="contact-icon">📧</span>
              <span>support@gamedistrib.ru</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2024 GameDistrib Platform. Все права защищены.</span>
          <div className="footer-status">
            <span className="version">v1.0.0</span>
            <div 
              className={`status-indicator status-${backendStatus}`} 
              onClick={handleRetry}
              title={backendStatus === 'offline' ? 'Нажмите для повторной проверки' : 'Статус подключения'}
            >
              <div className="status-dot"></div>
              <span className="status-text">
                {backendStatus === 'online' && 'Бэкенд онлайн'}
                {backendStatus === 'offline' && 'Бэкенд недоступен'}
                {backendStatus === 'checking' && 'Проверка...'}
              </span>
              {backendStatus === 'offline' && (
                <svg className="retry-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M23 4v6h-6M1 20v-6h6" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Главный компонент
function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game/:id" element={<GamePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/developer" element={<DeveloperDashboard />} />
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/forum/topic/:id" element={<TopicPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/upload" element={<UploadGamePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;