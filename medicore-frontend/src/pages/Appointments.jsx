import { useState, useEffect } from 'react';
import api from '../services/api';


export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes] = await Promise.all([
        api.get('/appointments/my-appointments'),
        api.get('/appointments/doctors')
      ]);
      setAppointments(appointmentsRes.data);
      setDoctors(doctorsRes.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
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
      await api.post('/appointments/', {
        doctor_id: formData.doctor_id,
        appointment_date: formData.appointment_date,
        reason: formData.reason,
        notes: formData.notes
      });

      setSuccess('Appointment booked successfully!');
      setFormData({ doctor_id: '', appointment_date: '', reason: '', notes: '' });
      setShowForm(false);
      setTimeout(() => fetchData(), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book appointment');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>My Appointments</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Book Appointment
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="booking-form-container">
          <h2>Book an Appointment</h2>
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label>Select Doctor</label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Appointment Date & Time</label>
              <input
                type="datetime-local"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Reason for Visit</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Why are you visiting?"
                required
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Book Appointment</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="appointments-list">
        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map(apt => (
              <div key={apt.id} className="appointment-card">
                <div className="apt-header">
                  <h3>{apt.doctor_name}</h3>
                  <span className={`status ${apt.status}`}>{apt.status}</span>
                </div>
                <div className="apt-content">
                  <p><strong>Specialization:</strong> {apt.doctor_specialization}</p>
                  <p><strong>Date:</strong> {new Date(apt.appointment_date).toLocaleString()}</p>
                  <p><strong>Reason:</strong> {apt.reason}</p>
                  {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
