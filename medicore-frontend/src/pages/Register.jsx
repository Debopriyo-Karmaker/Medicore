import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'patient',
    hospital_email: '',
    specialization: '',
    phone: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }

    if (formData.role === 'doctor') {
      if (!formData.hospital_email.trim()) {
        setError('Hospital email is required for doctors');
        return false;
      }
      if (!formData.specialization.trim()) {
        setError('Specialization is required for doctors');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Registering...');
      console.log('   Email:', formData.email);
      console.log('   Role:', formData.role);

      // Prepare request data based on role
      const requestData = {
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        role: formData.role
      };

      // Add doctor-specific fields
      if (formData.role === 'doctor') {
        requestData.hospital_email = formData.hospital_email.trim();
        requestData.specialization = formData.specialization.trim();
        requestData.phone = formData.phone.trim();
      }

      const response = await api.post('/auth/register', requestData);
      const { access_token, user } = response.data;

      console.log('✅ Registration successful');
      console.log('   User role:', user.role);

      // Save to context and localStorage
      login(user, access_token);

      // Redirect based on role (now supports all roles)
      if (user.role === USER_ROLES.PATIENT) {
        navigate('/patient/profile');
      } else if (user.role === USER_ROLES.DOCTOR) {
        navigate('/doctor/dashboard');
      } else if (user.role === USER_ROLES.LAB_ASSISTANT) {
        navigate('/lab/dashboard');
      } else if (user.role === USER_ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Registration failed';
      console.error('❌ Registration failed:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Medicore</h1>
          <p>Create Account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="register-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Full Name Field */}
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="lab_assistant">Lab Assistant</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Doctor-Specific Fields */}
          {formData.role === 'doctor' && (
            <>
              <div className="form-group">
                <label htmlFor="hospital_email">Hospital Email</label>
                <input
                  id="hospital_email"
                  type="email"
                  name="hospital_email"
                  placeholder="Enter your hospital email"
                  value={formData.hospital_email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <select
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="">Select Specialization</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="General Practice">General Practice</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter password (min 8 characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              minLength="8"
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              minLength="8"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="register-btn"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="login-link"
              onClick={() => navigate('/login')}
            >
              Login here
            </button>
          </p>
        </div>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .register-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 40px;
          width: 100%;
          max-width: 500px;
        }

        .register-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .register-header h1 {
          font-size: 32px;
          color: #333;
          margin: 0;
          font-weight: 700;
        }

        .register-header p {
          font-size: 14px;
          color: #666;
          margin: 5px 0 0 0;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-error {
          background-color: #fee;
          border-left: 4px solid #e74c3c;
          color: #c0392b;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #333;
        }

        .form-group input,
        .form-group select {
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group input:disabled,
        .form-group select:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .register-btn {
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }

        .register-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .register-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .register-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 14px;
          color: #666;
        }

        .login-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          padding: 0;
        }

        .login-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .register-container {
            padding: 30px 20px;
          }

          .register-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
