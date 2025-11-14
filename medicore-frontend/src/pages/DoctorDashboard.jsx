import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [responseData, setResponseData] = useState({
    doctor_notes: '',
    rejection_reason: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments/doctor-appointments');
      setAppointments(response.data);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, status) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, {
        status,
        doctor_notes: status === 'confirmed' ? responseData.doctor_notes : undefined,
        rejection_reason: status === 'rejected' ? responseData.rejection_reason : undefined
      });

      setError('');
      setSelectedAppt(null);
      setActionType(null);
      setResponseData({ doctor_notes: '', rejection_reason: '' });
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update appointment');
    }
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="doctor-dashboard-container">
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <p>Welcome, Dr. {user?.full_name}</p>
        <p className="specialization">{user?.specialization}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="appointments-section">
        <h2>Pending Appointments</h2>
        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments scheduled</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map(apt => (
              <div key={apt.id} className="appointment-card">
                <div className="apt-header">
                  <h3>{apt.patient_name}</h3>
                  <span className={`status ${apt.status}`}>{apt.status}</span>
                </div>

                <div className="apt-content">
                  <p><strong>Date:</strong> {new Date(apt.appointment_date).toLocaleString()}</p>
                  <p><strong>Reason:</strong> {apt.reason}</p>
                  {apt.notes && <p><strong>Patient Notes:</strong> {apt.notes}</p>}
                  {apt.doctor_notes && <p><strong>Your Notes:</strong> {apt.doctor_notes}</p>}
                </div>

                {apt.status === 'pending' && (
                  <div className="apt-actions">
                    <button
                      className="btn-confirm"
                      onClick={() => {
                        setSelectedAppt(apt.id);
                        setActionType('confirm');
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => {
                        setSelectedAppt(apt.id);
                        setActionType('reject');
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {actionType === 'confirm' ? 'Confirm Appointment' : 'Reject Appointment'}
            </h3>

            {actionType === 'confirm' && (
              <div className="form-group">
                <label>Doctor's Notes</label>
                <textarea
                  value={responseData.doctor_notes}
                  onChange={(e) =>
                    setResponseData(prev => ({
                      ...prev,
                      doctor_notes: e.target.value
                    }))
                  }
                  placeholder="Add any notes for the patient..."
                  rows="4"
                />
              </div>
            )}

            {actionType === 'reject' && (
              <div className="form-group">
                <label>Reason for Rejection</label>
                <textarea
                  value={responseData.rejection_reason}
                  onChange={(e) =>
                    setResponseData(prev => ({
                      ...prev,
                      rejection_reason: e.target.value
                    }))
                  }
                  placeholder="Why are you rejecting this appointment?"
                  rows="4"
                  required
                />
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  handleAction(
                    selectedAppt,
                    actionType === 'confirm' ? 'confirmed' : 'rejected'
                  )
                }
              >
                {actionType === 'confirm' ? 'Confirm' : 'Reject'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedAppt(null);
                  setActionType(null);
                  setResponseData({ doctor_notes: '', rejection_reason: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
