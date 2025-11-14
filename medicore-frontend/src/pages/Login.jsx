import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, ROUTES } from '../utils/constants';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Logging in...');
      
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      const { access_token, user } = response.data;

      console.log('✅ Login successful');
      
      // Save to context and localStorage
      login(user, access_token);

      // Redirect based on role
      if (user.role === USER_ROLES.PATIENT) {
        navigate(ROUTES.PATIENT_PROFILE);
      } else if (user.role === USER_ROLES.DOCTOR) {
        navigate(ROUTES.DOCTOR_DASHBOARD);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Login failed';
      setError(errorMsg);
      console.error('❌ Login failed:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Medicore</h1>
          <p>Where Every Record Meets Precision</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

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
      </div>
    </div>
  );
}
