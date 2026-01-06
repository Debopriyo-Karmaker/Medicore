import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PatientProfile.css'; // reuse same styling

export default function LabAssistantProfile() {
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
    contact_no: '',
    hospital: '',
    department: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/lab/profile/me');
      setProfile(response.data);
      setFormData({
        date_of_birth: response.data.date_of_birth?.split('T')[0] || '',
        gender: response.data.gender || '',
        blood_group: response.data.blood_group || '',
        contact_no: response.data.contact_no || '',
        hospital: response.data.hospital || '',
        department: response.data.department || '',
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

    const payload = { ...formData };

    try {
      if (profile) {
        await api.put('/lab/profile/me', payload);
        setSuccess('Profile updated successfully!');
      } else {
        const response = await api.post('/lab/profile', payload);
        setProfile(response.data);
        setSuccess('Profile created successfully!');
      }

      setEditing(false);
      setTimeout(() => fetchProfile(), 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
      console.error('Error saving lab assistant profile:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="patient-profile-container">
      <div className="profile-header">
        <h1>Lab Assistant Profile</h1>
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
              </div>

              <div className="form-row">
                <div className="form-group">
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
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    name="contact_no"
                    value={formData.contact_no}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hospital</label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    placeholder="Hospital name"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Department"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Profile
                </button>
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
                  <span className="label">Contact No:</span>
                  <span>{profile?.contact_no || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Hospital:</span>
                  <span>{profile?.hospital || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Department:</span>
                  <span>{profile?.department || 'N/A'}</span>
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
