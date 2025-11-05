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
    // Load admin info
    apiClient.get('/api/auth/admin-info')
      .then(response => {
        setAdminInfo(response.data);
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Wprowadź nazwę użytkownika i hasło');
      return;
    }
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Błąd logowania';
      setError(errorMessage);
      console.error('Login error:', err);
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

