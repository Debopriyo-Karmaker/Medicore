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
    current_medications: ''
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
        current_medications: response.data.current_medications?.join(', ') || ''
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        allergies: formData.allergies?.split(',').map(s => s.trim()).filter(Boolean) || [],
        chronic_conditions: formData.chronic_conditions?.split(',').map(s => s.trim()).filter(Boolean) || [],
        current_medications: formData.current_medications?.split(',').map(s => s.trim()).filter(Boolean) || []
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
      setTimeout(() => fetchProfile(), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
      console.error('Error:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="patient-profile-container">
      <div className="profile-header">
        <h1>Patient Profile</h1>
        <p>Welcome, {user?.full_name}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!profile && !editing ? (
        <div className="no-profile">
          <p>You haven't created a profile yet.</p>
          <button onClick={() => setEditing(true)} className="btn-primary">
            Create Profile
          </button>
        </div>
      ) : (
        <div className="profile-content">
          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Blood Group</label>
                  <select name="blood_group" value={formData.blood_group} onChange={handleChange}>
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
                <div className="form-group">
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

              <div className="form-row">
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input
                    type="tel"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
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

              <div className="form-row">
                <div className="form-group">
                  <label>Allergies (comma-separated)</label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="e.g., Dust, Pollen"
                  />
                </div>
                <div className="form-group">
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

              <div className="form-group">
                <label>Current Medications (comma-separated)</label>
                <input
                  type="text"
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleChange}
                  placeholder="e.g., Aspirin, Metformin"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Save Profile</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">Date of Birth:</span>
                  <span>{profile?.date_of_birth || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Gender:</span>
                  <span>{profile?.gender || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Blood Group:</span>
                  <span>{profile?.blood_group || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Address:</span>
                  <span>{profile?.address || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Emergency Contact:</span>
                  <span>{profile?.emergency_contact || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Emergency Contact Name:</span>
                  <span>{profile?.emergency_contact_name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Allergies:</span>
                  <span>{profile?.allergies?.join(', ') || 'None'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Chronic Conditions:</span>
                  <span>{profile?.chronic_conditions?.join(', ') || 'None'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Current Medications:</span>
                  <span>{profile?.current_medications?.join(', ') || 'None'}</span>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
