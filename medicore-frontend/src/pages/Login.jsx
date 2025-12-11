import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { access_token, user } = response.data;
      login(user, access_token);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Go to central dashboard route; it will redirect based on user.role
      navigate('/dashboard');
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Login failed. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <div className="logo-circle">
            <span className="logo-text">M+</span>
          </div>
        </div>

        <div className="login-header">
          <h1>Medicore</h1>
          <p>Where Every Record Meets Precision</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-text">{error}</span>
            <button
              type="button"
              className="alert-close"
              onClick={() => setError('')}
              aria-label="Close alert"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
                className="form-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-password"
              onClick={() =>
                alert('Password reset feature coming soon!')
              }
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              <>
                Login
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="register-link"
              onClick={() => navigate('/register')}
            >
              Register here
            </button>
          </p>
        </div>

        <div className="login-security">
          <span className="security-badge">🔒 Secure Connection</span>
        </div>
      </div>
    </div>
  );
}
