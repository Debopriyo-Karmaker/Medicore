import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: '',
    blood_group: '',
    address: '',
    emergency_contact: '',
    emergency_contact_name: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/me');
      setProfile(response.data);
      setFormData({
        date_of_birth: response.data.date_of_birth?.split('T')[0] || '',
        gender: response.data.gender || '',
        blood_group: response.data.blood_group || '',
        address: response.data.address || '',
        emergency_contact: response.data.emergency_contact || '',
        emergency_contact_name: response.data.emergency_contact_name || '',
        allergies: response.data.allergies?.join(', ') || '',
        chronic_conditions: response.data.chronic_conditions?.join(', ') || '',
        current_medications: response.data.current_medications?.join(', ') || '',
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        allergies:
          formData.allergies
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) || [],
        chronic_conditions:
          formData.chronic_conditions
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) || [],
        current_medications:
          formData.current_medications
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) || [],
      };

      if (profile) {
        await api.put('/patients/me', payload);
        setSuccess('Profile updated successfully!');
      } else {
        const response = await api.post('/patients/', payload);
        setProfile(response.data);
        setSuccess('Profile created successfully!');
      }

      setEditing(false);
      setTimeout(() => fetchProfile(), 800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="patient-profile-loading">
        <div className="patient-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const hasProfile = !!profile;

  return (
    <div className="patient-profile-page">
      {/* Header / Hero */}
      <div className="patient-profile-hero glass-card">
        <div className="hero-left">
          <div className="avatar-ring">
            <div className="avatar-circle">
              {(user?.full_name || 'P')[0]?.toUpperCase()}
            </div>
          </div>
          <div className="hero-text">
            <div className="hero-title-row">
              <h1>Patient Profile</h1>
              <span className="role-pill">Patient</span>
            </div>
            <p className="hero-subtitle">
              Welcome, <span className="hero-name">{user?.full_name}</span>
            </p>
            <p className="hero-caption">
              Keep your medical details up to date so doctors can give you better care.
            </p>
          </div>
        </div>

        {hasProfile && (
          <div className="hero-metrics">
            <div className="metric-pill">
              <span className="metric-label">Blood Group</span>
              <span className="metric-value">
                {profile?.blood_group || '—'}
              </span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Chronic</span>
              <span className="metric-value">
                {profile?.chronic_conditions?.length || 0}
              </span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Medications</span>
              <span className="metric-value">
                {profile?.current_medications?.length || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="patient-profile-alerts">
        {error && <div className="alert-modern alert-error-modern">{error}</div>}
        {success && (
          <div className="alert-modern alert-success-modern">{success}</div>
        )}
      </div>

      {/* Layout: left summary + right content */}
      <div className="patient-profile-layout">
        {/* Left summary card */}
        {hasProfile && !editing && (
          <aside className="patient-summary glass-card">
            <h2>Quick Summary</h2>
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-label">Date of Birth</span>
                <span className="summary-value">
                  {profile?.date_of_birth?.split('T')[0] || 'N/A'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Gender</span>
                <span className="summary-value">
                  {profile?.gender || 'N/A'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Blood Group</span>
                <span className="summary-value badge-chip">
                  {profile?.blood_group || 'N/A'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Emergency Contact</span>
                <span className="summary-value">
                  {profile?.emergency_contact || 'N/A'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Contact Name</span>
                <span className="summary-value">
                  {profile?.emergency_contact_name || 'N/A'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="btn-primary btn-full"
            >
              Edit Profile
            </button>
          </aside>
        )}

        {/* Right main card */}
        <main className="patient-main-card glass-card">
          {!hasProfile && !editing && (
            <div className="no-profile-modern">
              <h2>No profile yet</h2>
              <p>
                Add your medical details once and reuse them across appointments
                and prescriptions.
              </p>
              <button
                onClick={() => setEditing(true)}
                className="btn-primary"
              >
                Create Profile
              </button>
            </div>
          )}

          {editing && (
            <form onSubmit={handleSubmit} className="patient-profile-form">
              <div className="section-header">
                <h2>{hasProfile ? 'Edit Profile' : 'Create Profile'}</h2>
                <p>Basic information, emergency contacts and medical history.</p>
              </div>

              {/* Basic info */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-grid two-col">
                  <div className="form-field">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Blood Group</label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street address"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency contacts */}
              <div className="form-section">
                <h3>Emergency Contact</h3>
                <div className="form-grid two-col">
                  <div className="form-field">
                    <label>Emergency Contact</label>
                    <input
                      type="tel"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="form-field">
                    <label>Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="Full name"
                    />
                  </div>
                </div>
              </div>

              {/* Medical details */}
              <div className="form-section">
                <h3>Medical Details</h3>
                <div className="form-grid two-col">
                  <div className="form-field">
                    <label>Allergies (comma-separated)</label>
                    <input
                      type="text"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="e.g., Dust, Pollen"
                    />
                  </div>
                  <div className="form-field">
                    <label>Chronic Conditions (comma-separated)</label>
                    <input
                      type="text"
                      name="chronic_conditions"
                      value={formData.chronic_conditions}
                      onChange={handleChange}
                      placeholder="e.g., Diabetes, Asthma"
                    />
                  </div>
                </div>

                <div className="form-field full-width">
                  <label>Current Medications (comma-separated)</label>
                  <input
                    type="text"
                    name="current_medications"
                    value={formData.current_medications}
                    onChange={handleChange}
                    placeholder="e.g., Aspirin, Metformin"
                  />
                </div>
              </div>

              <div className="form-actions-modern">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary-outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!editing && hasProfile && (
            <div className="patient-details-sections">
              <section className="details-section">
                <h2>Personal Information</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-value">
                      {profile?.date_of_birth?.split('T')[0] || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gender</span>
                    <span className="detail-value">
                      {profile?.gender || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Blood Group</span>
                    <span className="detail-value badge-chip">
                      {profile?.blood_group || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item full">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">
                      {profile?.address || 'N/A'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="details-section">
                <h2>Emergency</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Contact Name</span>
                    <span className="detail-value">
                      {profile?.emergency_contact_name || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact Number</span>
                    <span className="detail-value">
                      {profile?.emergency_contact || 'N/A'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="details-section">
                <h2>Medical History</h2>
                <div className="details-grid">
                  <div className="detail-item full">
                    <span className="detail-label">Allergies</span>
                    <span className="detail-value">
                      {profile?.allergies?.length
                        ? profile.allergies.join(', ')
                        : 'None reported'}
                    </span>
                  </div>
                  <div className="detail-item full">
                    <span className="detail-label">Chronic Conditions</span>
                    <span className="detail-value">
                      {profile?.chronic_conditions?.length
                        ? profile.chronic_conditions.join(', ')
                        : 'None reported'}
                    </span>
                  </div>
                  <div className="detail-item full">
                    <span className="detail-label">Current Medications</span>
                    <span className="detail-value">
                      {profile?.current_medications?.length
                        ? profile.current_medications.join(', ')
                        : 'None'}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
