import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AvailabilityScheduler from '../components/AvailabilityScheduler';
import PrescriptionForm from '../components/PrescriptionForm';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [responseData, setResponseData] = useState({
    doctor_notes: '',
    rejection_reason: ''
  });

  // Doctor Profile & Availability
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [availability, setAvailability] = useState([]);

  // Prescription
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    blood_group: '',
    condition: '',
    min_age: '',
    max_age: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctorProfile();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments/doctor-appointments');
      setAppointments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctor-profile/me');
      setProfile(response.data);
      setAvailability(response.data.availability || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Failed to load profile:', err);
      }
    }
  };

  const searchPatients = async () => {
    if (!searchQuery.trim() && !filters.blood_group && !filters.condition) {
      setError('Please enter a search term or select filters');
      return;
    }

    try {
      setSearchLoading(true);
      setError('');
      const params = new URLSearchParams();

      if (searchQuery) params.append('query', searchQuery);
      if (filters.blood_group) params.append('blood_group', filters.blood_group);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.min_age) params.append('min_age', filters.min_age);
      if (filters.max_age) params.append('max_age', filters.max_age);

      const response = await api.get(`/patients/search?${params.toString()}`);
      setPatients(response.data);

      if (response.data.length === 0) {
        setError('No patients found matching your search');
      }
    } catch (err) {
      setError('Failed to search patients');
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // ✅ CORRECT: Use /details endpoint from backend
  const viewPatientDetails = async (patientId) => {
    try {
      setError('');
      setLoading(true);

      console.log('Fetching patient details for ID:', patientId);

      // Backend endpoint: GET /patients/{patient_id}/details
      const response = await api.get(`/patients/${patientId}/details`);
      
      console.log('Patient details response:', response.data);
      
      setSelectedPatient(response.data);
      setActiveTab('patient-details');

      // Prescriptions are already included in the /details response
      if (response.data.prescriptions) {
        setPrescriptions(response.data.prescriptions);
      } else {
        setPrescriptions([]);
      }
    } catch (err) {
      console.error('Full error object:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url
      });
      
      setError(
        `Failed to load patient details: ${err.response?.data?.detail || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, status) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, {
        status,
        doctor_notes:
          status === 'confirmed' ? responseData.doctor_notes : undefined,
        rejection_reason:
          status === 'rejected' ? responseData.rejection_reason : undefined
      });

      setSuccess('Appointment updated successfully!');
      setError('');
      setSelectedAppt(null);
      setActionType(null);
      setResponseData({ doctor_notes: '', rejection_reason: '' });
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update appointment');
    }
  };

  const handleAvailabilityUpdate = async (newAvailability) => {
    try {
      setProfileLoading(true);
      await api.put('/doctor-profile/availability', {
        availability: newAvailability
      });
      setAvailability(newAvailability);
      setSuccess('Availability updated successfully!');
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to update availability'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePrescriptionSubmit = async (prescriptionData) => {
    try {
      await api.post('/prescriptions/', prescriptionData);
      setSuccess('Prescription created successfully!');
      setShowPrescriptionForm(false);

      // Reload prescriptions if patient is selected
      if (selectedPatient) {
        // Re-fetch full patient details to get updated prescriptions
        const response = await api.get(
          `/patients/${selectedPatient.id}/details`
        );
        if (response.data.prescriptions) {
          setPrescriptions(response.data.prescriptions);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to create prescription'
      );
    }
  };

  const downloadReport = (fileUrl, reportType) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${reportType}_report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download report');
      console.error(err);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPatients();
    }
  };

  const clearFilters = () => {
    setFilters({
      blood_group: '',
      condition: '',
      min_age: '',
      max_age: ''
    });
    setSearchQuery('');
    setPatients([]);
  };

  if (loading && activeTab === 'appointments') {
    return (
      <div className="loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="doctor-dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Doctor Dashboard</h1>
            <p>
              Welcome, Dr. {user?.full_name}{' '}
              <span className="specialization">
                {user?.specialization}
              </span>
            </p>
          </div>
          {profile && (
            <div className="profile-stats">
              <div className="stat-card">
                <span className="stat-number">
                  {profile.total_consultations || 0}
                </span>
                <span className="stat-label">Total Consultations</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  ${profile.consultation_fee || 0}
                </span>
                <span className="stat-label">Consultation Fee</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {profile.experience_years || 0}
                </span>
                <span className="stat-label">Years Experience</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button
            onClick={() => setError('')}
            className="alert-close"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button
            onClick={() => setSuccess('')}
            className="alert-close"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`${activeTab === 'appointments' ? 'tab active' : 'tab'}`}
          onClick={() => {
            setActiveTab('appointments');
            setError('');
            setSuccess('');
          }}
        >
          📅 Appointments
        </button>
        <button
          className={`${activeTab === 'patients' ? 'tab active' : 'tab'}`}
          onClick={() => {
            setActiveTab('patients');
            setError('');
            setSuccess('');
            setSearchQuery('');
            setPatients([]);
          }}
        >
          🔍 Search Patients
        </button>
        <button
          className={`${activeTab === 'availability' ? 'tab active' : 'tab'}`}
          onClick={() => {
            setActiveTab('availability');
            setError('');
            setSuccess('');
          }}
        >
          📆 My Availability
        </button>
        {selectedPatient && (
          <button
            className={`${
              activeTab === 'patient-details' ? 'tab active' : 'tab'
            }`}
            onClick={() => setActiveTab('patient-details')}
          >
            👤 Patient {selectedPatient.name}
          </button>
        )}
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="appointments-section">
          <h2>My Appointments</h2>
          {appointments.length === 0 ? (
            <div className="no-appointments">
              <p>No appointments scheduled</p>
            </div>
          ) : (
            <div className="appointments-grid">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`appointment-card status-${apt.status}`}
                >
                  <div className="apt-header">
                    <h3>{apt.patient_name}</h3>
                    <span className={`status ${apt.status}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="apt-content">
                    <p>
                      <strong>Date:</strong>{' '}
                      {new Date(apt.appointment_date).toLocaleString()}
                    </p>
                    <p>
                      <strong>Reason:</strong> {apt.reason}
                    </p>

                    {apt.notes && (
                      <p>
                        <strong>Patient Notes:</strong> {apt.notes}
                      </p>
                    )}

                    {apt.doctor_notes && (
                      <p>
                        <strong>Your Notes:</strong> {apt.doctor_notes}
                      </p>
                    )}

                    {apt.rejection_reason && (
                      <p>
                        <strong>Rejection Reason:</strong>{' '}
                        {apt.rejection_reason}
                      </p>
                    )}
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
      )}

      {/* Search Patients Tab */}
      {activeTab === 'patients' && (
        <div className="patients-section">
          <h2>Search Patients</h2>

          {/* Search Bar with Filters */}
          <div className="search-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="search-input"
              />
              <button
                onClick={searchPatients}
                className="btn-search"
                disabled={searchLoading}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="filters-section">
              <h3>⚙️ Advanced Filters</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Blood Group</label>
                  <select
                    value={filters.blood_group}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        blood_group: e.target.value
                      })
                    }
                  >
                    <option value="">All</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B">B</option>
                    <option value="B-">B-</option>
                    <option value="O">O</option>
                    <option value="O-">O-</option>
                    <option value="AB">AB</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Condition</label>
                  <input
                    type="text"
                    placeholder="e.g., Diabetes, Hypertension"
                    value={filters.condition}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        condition: e.target.value
                      })
                    }
                  />
                </div>

                <div className="filter-group">
                  <label>Min Age</label>
                  <input
                    type="number"
                    placeholder="18"
                    value={filters.min_age}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        min_age: e.target.value
                      })
                    }
                  />
                </div>

                <div className="filter-group">
                  <label>Max Age</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={filters.max_age}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        max_age: e.target.value
                      })
                    }
                  />
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="btn-clear-filters"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {searchLoading && (
            <div className="loading">Searching patients...</div>
          )}

          {patients.length === 0 && !searchLoading ? (
            <div className="no-data">
              <p>Enter search criteria to find patients</p>
            </div>
          ) : (
            <div className="patients-table-container">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Blood Group</th>
                    <th>Gender</th>
                    <th>Conditions</th>
                    <th>Reports</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <strong>{patient.patient_id}</strong>
                      </td>
                      <td>{patient.name}</td>
                      <td>{patient.age || 'N/A'}</td>
                      <td>
                        <span className="blood-badge">
                          {patient.blood_group || 'N/A'}
                        </span>
                      </td>
                      <td>{patient.gender}</td>
                      <td>
                        {patient.chronic_conditions?.length > 0
                          ? patient.chronic_conditions
                              .slice(0, 2)
                              .join(', ')
                          : 'None'}
                      </td>
                      <td>
                        <span className="badge">
                          {patient.diagnostic_reports?.length || 0}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() =>
                            viewPatientDetails(patient.id)
                          }
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div className="availability-section">
          <h2>My Availability Schedule</h2>
          <p className="section-description">
            Set your weekly schedule. You can select up to 3 days and
            choose time slots for each day.
          </p>

          <AvailabilityScheduler
            availability={availability}
            onUpdate={handleAvailabilityUpdate}
            maxDays={3}
          />

          {profileLoading && (
            <div className="saving-indicator">
              Saving availability...
            </div>
          )}

          {availability.length > 0 && (
            <div className="availability-summary">
              <h3>📅 Current Schedule Summary</h3>
              <div className="summary-cards">
                {availability.map((day) => (
                  <div
                    key={day.day}
                    className="day-summary-card"
                  >
                    <h4>{day.day}</h4>
                    <p className="slots-count">
                      {day.time_slots.length} time slots
                    </p>
                    <div className="mini-slots">
                      {day.time_slots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="mini-slot"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patient Details Tab */}
      {activeTab === 'patient-details' && selectedPatient && (
        <div className="patient-details-section">
          <div className="details-actions-bar">
            <button
              className="btn-back"
              onClick={() => setActiveTab('patients')}
            >
              ← Back to Search
            </button>
            <button
              className="btn-prescribe"
              onClick={() => setShowPrescriptionForm(true)}
            >
              ✏️ Write Prescription
            </button>
          </div>

          <h2>Patient Details: {selectedPatient.name}</h2>

          <div className="details-grid">
            {/* Personal Information */}
            <div className="detail-card">
              <h3>👤 Personal Information</h3>

              <div className="detail-item">
                <span className="label">Patient ID</span>
                <span className="value">
                  {selectedPatient.patient_id}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Full Name</span>
                <span className="value">
                  {selectedPatient.name}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Age</span>
                <span className="value">
                  {selectedPatient.age || 'N/A'} years
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Email</span>
                <span className="value">
                  {selectedPatient.email}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Phone</span>
                <span className="value">
                  {selectedPatient.phone || 'N/A'}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Date of Birth</span>
                <span className="value">
                  {selectedPatient.date_of_birth
                    ? new Date(
                        selectedPatient.date_of_birth
                      ).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Gender</span>
                <span className="value">
                  {selectedPatient.gender}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Blood Group</span>
                <span className="value">
                  <span className="blood-group-badge">
                    {selectedPatient.blood_group || 'N/A'}
                  </span>
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Address</span>
                <span className="value">
                  {selectedPatient.address || 'N/A'}
                </span>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="detail-card">
              <h3>🚨 Emergency Contact</h3>

              <div className="detail-item">
                <span className="label">Contact Name</span>
                <span className="value">
                  {selectedPatient.emergency_contact_name ||
                    'N/A'}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">Contact Phone</span>
                <span className="value">
                  {selectedPatient.emergency_contact ||
                    'N/A'}
                </span>
              </div>
            </div>

            {/* Medical History */}
            <div className="detail-card">
              <h3>⚕️ Medical History</h3>

              <div className="detail-item">
                <span className="label">Allergies</span>
                <span className="value">
                  {selectedPatient.allergies?.length > 0
                    ? selectedPatient.allergies.join(', ')
                    : 'None reported'}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">
                  Chronic Conditions
                </span>
                <span className="value">
                  {selectedPatient.chronic_conditions
                    ?.length > 0
                    ? selectedPatient.chronic_conditions.join(
                        ', '
                      )
                    : 'None reported'}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">
                  Current Medications
                </span>
                <span className="value">
                  {selectedPatient.current_medications
                    ?.length > 0
                    ? selectedPatient.current_medications.join(
                        ', '
                      )
                    : 'None reported'}
                </span>
              </div>
            </div>
          </div>

          {/* Prescription History */}
          <div className="prescriptions-history">
            <h3>
              💊 Prescription History ({prescriptions.length})
            </h3>
            {prescriptions.length === 0 ? (
              <div className="no-data">
                <p>No prescriptions found</p>
              </div>
            ) : (
              <div className="prescriptions-grid">
                {prescriptions.map((presc) => (
                  <div
                    key={presc.id}
                    className="prescription-card"
                  >
                    <div className="presc-header">
                      <h4>{presc.prescription_id}</h4>
                      <span className="presc-date">
                        {new Date(
                          presc.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="presc-body">
                      <p>
                        <strong>Doctor:</strong>{' '}
                        {presc.doctor_name}
                      </p>
                      <p>
                        <strong>Diagnosis:</strong>{' '}
                        {presc.diagnosis}
                      </p>
                      <p>
                        <strong>Medicines:</strong>{' '}
                        {presc.medicines_count ||
                          presc.medicines?.length ||
                          0}{' '}
                        prescribed
                      </p>

                      {presc.follow_up_date && (
                        <p>
                          <strong>Follow-up:</strong>{' '}
                          {new Date(
                            presc.follow_up_date
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostic Reports Section */}
          {selectedPatient.diagnostic_reports?.length > 0 && (
            <div className="reports-section">
              <h3>
                📄 Diagnostic Reports{' '}
                ({selectedPatient.diagnostic_reports?.length})
              </h3>
              {selectedPatient.diagnostic_reports?.length ===
              0 ? (
                <div className="no-data">
                  <p>No diagnostic reports uploaded yet</p>
                </div>
              ) : (
                <div className="reports-grid">
                  {selectedPatient.diagnostic_reports?.map(
                    (report) => (
                      <div
                        key={report.report_id}
                        className="report-card"
                      >
                        <div className="report-header">
                          <h4>{report.report_type}</h4>
                          <span className="report-badge">
                            Lab Report
                          </span>
                        </div>

                        <div className="report-body">
                          <p>
                            <strong>Uploaded by:</strong>{' '}
                            {report.uploaded_by}
                          </p>
                          <p>
                            <strong>Upload Date:</strong>{' '}
                            {new Date(
                              report.uploaded_at
                            ).toLocaleString()}
                          </p>

                          {report.notes && (
                            <p>
                              <strong>Notes:</strong>{' '}
                              {report.notes}
                            </p>
                          )}
                        </div>

                        <div className="report-actions">
                          <button
                            className="btn-download"
                            onClick={() =>
                              downloadReport(
                                report.file_url,
                                report.report_type
                              )
                            }
                          >
                            📥 Download Report
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Appointment History */}
          {selectedPatient.appointments &&
            selectedPatient.appointments.length > 0 && (
              <div className="appointments-history">
                <h3>
                  📅 Appointment History{' '}
                  ({selectedPatient.appointments.length})
                </h3>
                <div className="history-timeline">
                  {selectedPatient.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="history-item"
                    >
                      <div className="history-date">
                        {new Date(
                          apt.appointment_date
                        ).toLocaleDateString()}
                      </div>
                      <div className="history-content">
                        <p>
                          <strong>Doctor:</strong>{' '}
                          {apt.doctor_name}
                        </p>
                        <p>
                          <strong>Reason:</strong>{' '}
                          {apt.reason}
                        </p>
                        <p>
                          <strong>Status:</strong>{' '}
                          <span
                            className={`status ${apt.status}`}
                          >
                            {apt.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Action Modal */}
      {selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {actionType === 'confirm'
                ? 'Confirm Appointment'
                : 'Reject Appointment'}
            </h3>

            {actionType === 'confirm' && (
              <div className="form-group">
                <label>Doctor's Notes</label>
                <textarea
                  value={responseData.doctor_notes}
                  onChange={(e) =>
                    setResponseData((prev) => ({
                      ...prev,
                      doctor_notes: e.target.value
                    }))
                  }
                  placeholder="Add any notes for the patient..."
                  rows="4"
                ></textarea>
              </div>
            )}

            {actionType === 'reject' && (
              <div className="form-group">
                <label>Reason for Rejection</label>
                <textarea
                  value={responseData.rejection_reason}
                  onChange={(e) =>
                    setResponseData((prev) => ({
                      ...prev,
                      rejection_reason: e.target.value
                    }))
                  }
                  placeholder="Why are you rejecting this appointment?"
                  rows="4"
                  required
                ></textarea>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  handleAction(
                    selectedAppt,
                    actionType === 'confirm'
                      ? 'confirmed'
                      : 'rejected'
                  )
                }
                disabled={
                  actionType === 'reject' &&
                  !responseData.rejection_reason
                }
              >
                {actionType === 'confirm'
                  ? 'Confirm'
                  : 'Reject'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedAppt(null);
                  setActionType(null);
                  setResponseData({
                    doctor_notes: '',
                    rejection_reason: ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Form Modal */}
      {showPrescriptionForm && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content prescription-modal">
            <div className="modal-header">
              <h3>
                Write Prescription for{' '}
                {selectedPatient.name}
              </h3>
              <button
                className="modal-close"
                onClick={() =>
                  setShowPrescriptionForm(false)
                }
              >
                ×
              </button>
            </div>

            <PrescriptionForm
              patientId={selectedPatient.id}
              patientName={selectedPatient.name}
              onSubmit={handlePrescriptionSubmit}
              onCancel={() =>
                setShowPrescriptionForm(false)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}