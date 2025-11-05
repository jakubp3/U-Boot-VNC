import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminInfo, setAdminInfo] = useState<{exists: boolean; username?: string; password?: string; message?: string} | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // First check if backend is accessible
    const checkBackend = async () => {
      try {
        // Try health check first
        const healthResponse = await apiClient.get('/api/health');
        console.log('Backend health:', healthResponse.data);
        
        // Then load admin info
        const adminResponse = await apiClient.get('/api/auth/admin-info');
        setAdminInfo(adminResponse.data);
      } catch (error: any) {
        console.error('Backend connection error:', error);
        // If health check fails, show error
        if (error.code === 'ERR_NETWORK' || !error.response) {
          setError('Nie można połączyć się z serwerem. Sprawdź czy backend działa na porcie 18888.');
        }
      }
    };
    
    checkBackend();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Wprowadź nazwę użytkownika i hasło');
      return;
    }
    try {
      setError(''); // Clear error before login
      await login(username.trim(), password);
      // Clear error on success and navigate
      setError('');
      // Small delay to ensure token is set
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (err: any) {
      console.error('Login error details:', err);
      
      // Better error handling for network errors
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Błąd połączenia z serwerem. Sprawdź czy backend działa na porcie 18888.');
      } else if (err.response?.data?.detail) {
        // Only show error if it's not a successful login that was interrupted
        const errorDetail = err.response.data.detail;
        if (errorDetail !== 'Incorrect username or password' || err.response.status !== 401) {
          setError(errorDetail);
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Błąd logowania. Sprawdź konsolę przeglądarki (F12) dla szczegółów.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { authAPI } = await import('../api/auth');
      await authAPI.register({ username, email, password, full_name: fullName });
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Błąd rejestracji');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>U-Boot VNC</h1>
        {isRegistering ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Nazwa użytkownika</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Pełne imię</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Hasło</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn-primary">
              Zarejestruj się
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsRegistering(false);
                setError('');
                setUsername('');
                setPassword('');
                setEmail('');
                setFullName('');
              }}
            >
              Zaloguj się
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Nazwa użytkownika</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Hasło</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn-primary">
              Zaloguj się
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsRegistering(true);
                setError('');
                setUsername('');
                setPassword('');
              }}
            >
              Zarejestruj się
            </button>
          </form>
        )}
        {adminInfo?.exists && (
          <div className="admin-info">
            <hr />
            <div className="admin-info-content">
              <strong>Domyślne konto administratora:</strong>
              <div className="admin-credentials">
                <span>Login: <code>{adminInfo.username}</code></span>
                <span>Hasło: <code>{adminInfo.password}</code></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

