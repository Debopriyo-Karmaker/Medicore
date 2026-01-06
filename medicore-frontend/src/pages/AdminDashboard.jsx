// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  fetchAdminStatistics,
  fetchAdminUsers,
  fetchAdminPatients,
  fetchAdminDoctors,
  fetchAdminAppointments,
  updateUserRole,
  deleteUser,
  deletePatient,
  deleteDoctor,
  deleteAppointment,
  adminUpdateAppointment,
  adminUpdateAppointmentStatus,
  fetchAdminUserProfile,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { APPOINTMENT_STATUS } from '../utils/constants';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Read ?tab=... from URL, default to 'statistics'
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'statistics';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState({
    statistics: null,
    users: [],
    patients: [],
    doctors: [],
    appointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // user profile modal state
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  // Keep activeTab in sync when URL query changes (back/forward)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'statistics';
    setActiveTab(tab);
  }, [location.search]);

  const setTabAndUrl = (tab) => {
    setActiveTab(tab);
    navigate(`/admin/dashboard?tab=${tab}`, { replace: true });
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, usersRes, patientsRes, doctorsRes, appointmentsRes] =
        await Promise.all([
          fetchAdminStatistics(),
          fetchAdminUsers(),
          fetchAdminPatients(),
          fetchAdminDoctors(),
          fetchAdminAppointments(),
        ]);

      setData({
        statistics: statsRes.data,
        users: usersRes.data,
        patients: patientsRes.data,
        doctors: doctorsRes.data,
        appointments: appointmentsRes.data,
      });

      console.log('✅ All admin data fetched');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load data');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openUserProfile = async (userId) => {
    try {
      setProfileLoading(true);
      setProfileError('');
      setSelectedUserProfile(null);
      const res = await fetchAdminUserProfile(userId);
      setSelectedUserProfile(res.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setProfileError(
        err.response?.data?.detail || 'Failed to load user profile'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const closeUserProfile = () => {
    setSelectedUserProfile(null);
    setProfileError('');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Derived data: lab assistants from all users
  const labAssistants = data.users.filter((u) => u.role === 'lab_assistant');

  // Helper to update a single user in local state when role changes
  const handleUserRoleUpdated = (updatedUser) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u
      ),
    }));
  };

  // Deletion handlers update local state after API call
  const handleUserDeleted = (id) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  };

  const handlePatientDeleted = (id) => {
    setData((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== id),
    }));
  };

  const handleDoctorDeleted = (id) => {
    setData((prev) => ({
      ...prev,
      doctors: prev.doctors.filter((d) => d.id !== id),
    }));
  };

  const handleAppointmentDeleted = (id) => {
    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
    }));
  };

  const handleAppointmentUpdated = (updated) => {
    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === updated.id ? { ...a, ...updated } : a
      ),
    }));
  };

  return (
    <div className="admin-dashboard-modern">
      {/* Header */}
      <div className="admin-header-modern">
        <div className="admin-welcome">
          <h1>Admin Dashboard</h1>
          <p>
            Welcome back, <strong>{user?.full_name}</strong>
          </p>
        </div>
        <div className="admin-actions">
          <button className="refresh-btn" onClick={fetchAllData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-modern alert-error-modern">⚠️ {error}</div>
      )}

      {/* Statistics Cards */}
      {activeTab === 'statistics' && data.statistics && (
        <div className="stats-grid-modern">
          <div className="stat-card-modern stat-primary">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{data.statistics.total_users}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card-modern stat-success">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <h3>{data.statistics.total_patients}</h3>
              <p>Patients</p>
            </div>
          </div>
          <div className="stat-card-modern stat-info">
            <div className="stat-icon">👨‍⚕️</div>
            <div className="stat-content">
              <h3>{data.statistics.total_doctors}</h3>
              <p>Doctors</p>
            </div>
          </div>
          <div className="stat-card-modern stat-warning">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{data.statistics.total_appointments}</h3>
              <p>Appointments</p>
            </div>
          </div>
          <div className="stat-card-modern stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{data.statistics.appointments_by_status.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card-modern stat-confirmed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{data.statistics.appointments_by_status.confirmed}</h3>
              <p>Confirmed</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs-modern">
        <button
          className={`tab-modern ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setTabAndUrl('statistics')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-modern ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setTabAndUrl('users')}
        >
          👥 Users ({data.users.length})
        </button>
        <button
          className={`tab-modern ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setTabAndUrl('patients')}
        >
          🏥 Patients ({data.patients.length})
        </button>
        <button
          className={`tab-modern ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setTabAndUrl('doctors')}
        >
          👨‍⚕️ Doctors ({data.doctors.length})
        </button>
        <button
          className={`tab-modern ${
            activeTab === 'lab_assistants' ? 'active' : ''
          }`}
          onClick={() => setTabAndUrl('lab_assistants')}
        >
          🧪 Lab Assistants ({labAssistants.length})
        </button>
        <button
          className={`tab-modern ${
            activeTab === 'appointments' ? 'active' : ''
          }`}
          onClick={() => setTabAndUrl('appointments')}
        >
          📅 Appointments ({data.appointments.length})
        </button>
      </div>

      {/* Search Bar */}
      {activeTab !== 'statistics' && (
        <div className="search-bar-modern">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content-modern">
        {activeTab === 'users' && (
          <UsersTab
            users={data.users}
            searchTerm={searchTerm}
            onRoleUpdated={handleUserRoleUpdated}
            onDeleted={handleUserDeleted}
            onViewProfile={openUserProfile}
          />
        )}
        {activeTab === 'patients' && (
          <PatientsTab
            patients={data.patients}
            searchTerm={searchTerm}
            onDeleted={handlePatientDeleted}
          />
        )}
        {activeTab === 'doctors' && (
          <DoctorsTab
            doctors={data.doctors}
            searchTerm={searchTerm}
            onDeleted={handleDoctorDeleted}
          />
        )}
        {activeTab === 'lab_assistants' && (
          <LabAssistantsTab
            labAssistants={labAssistants}
            searchTerm={searchTerm}
            onDeleted={handleUserDeleted}
          />
        )}
        {activeTab === 'appointments' && (
          <AppointmentsTab
            appointments={data.appointments}
            searchTerm={searchTerm}
            onDeleted={handleAppointmentDeleted}
            onUpdated={handleAppointmentUpdated}
          />
        )}
      </div>

      {/* User Profile Modal (admin only view) */}
      {(profileLoading || selectedUserProfile || profileError) && (
        <div className="modal-backdrop">
          <div className="modal-modern admin-profile-modal">
            <div className="modal-header-modern">
              <h3>
                {selectedUserProfile
                  ? `User Profile: ${selectedUserProfile.full_name}`
                  : 'User Profile'}
              </h3>
              <button
                className="modal-close-btn"
                onClick={closeUserProfile}
                disabled={profileLoading}
              >
                ✖
              </button>
            </div>

            <div className="modal-body-modern">
              {profileLoading && (
                <div className="profile-loading">
                  <div className="spinner-small" />
                  <p>Loading profile...</p>
                </div>
              )}

              {profileError && !profileLoading && (
                <div className="alert-modern alert-error-modern">
                  ⚠️ {profileError}
                </div>
              )}

              {selectedUserProfile && !profileLoading && (
                <>
                  {/* Basic info */}
                  <section className="profile-section">
                    <h4>Basic Information</h4>
                    <div className="profile-grid">
                      <div className="profile-field">
                        <label>Full Name</label>
                        <span>{selectedUserProfile.full_name}</span>
                      </div>
                      <div className="profile-field">
                        <label>Email</label>
                        <span>{selectedUserProfile.email}</span>
                      </div>
                      <div className="profile-field">
                        <label>Role</label>
                        <span className={`badge-modern badge-${selectedUserProfile.role}`}>
                          {selectedUserProfile.role?.toUpperCase()}
                        </span>
                      </div>
                      <div className="profile-field">
                        <label>Phone</label>
                        <span>{selectedUserProfile.phone || 'N/A'}</span>
                      </div>
                      <div className="profile-field">
                        <label>Active</label>
                        <span>
                          {selectedUserProfile.is_active ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="profile-field">
                        <label>Verified</label>
                        <span>
                          {selectedUserProfile.is_verified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="profile-field">
                        <label>Joined</label>
                        <span>
                          {selectedUserProfile.created_at
                            ? new Date(
                                selectedUserProfile.created_at
                              ).toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Doctor extra */}
                  {selectedUserProfile.role === 'doctor' &&
                    selectedUserProfile.doctor_profile && (
                      <section className="profile-section">
                        <h4>Doctor Profile</h4>
                        <div className="profile-grid">
                          <div className="profile-field">
                            <label>Specialization</label>
                            <span>
                              {selectedUserProfile.specialization || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Hospital Email</label>
                            <span>
                              {selectedUserProfile.hospital_email || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Experience (years)</label>
                            <span>
                              {
                                selectedUserProfile.doctor_profile
                                  .experience_years
                              }
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Consultation Fee</label>
                            <span>
                              {
                                selectedUserProfile.doctor_profile
                                  .consultation_fee
                              }
                            </span>
                          </div>
                          <div className="profile-field full-width">
                            <label>About</label>
                            <span>
                              {selectedUserProfile.doctor_profile.about ||
                                'N/A'}
                            </span>
                          </div>
                          <div className="profile-field full-width">
                            <label>Qualifications</label>
                            <span>
                              {selectedUserProfile.doctor_profile
                                .qualifications?.length
                                ? selectedUserProfile.doctor_profile.qualifications.join(
                                    ', '
                                  )
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field full-width">
                            <label>Languages</label>
                            <span>
                              {selectedUserProfile.doctor_profile.languages
                                ?.length
                                ? selectedUserProfile.doctor_profile.languages.join(
                                    ', '
                                  )
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </section>
                    )}

                  {/* Patient extra */}
                  {selectedUserProfile.role === 'patient' &&
                    selectedUserProfile.patient_profile && (
                      <section className="profile-section">
                        <h4>Patient Profile</h4>
                        <div className="profile-grid">
                          <div className="profile-field">
                            <label>Patient ID</label>
                            <span>
                              {
                                selectedUserProfile.patient_profile
                                  .patient_id
                              }
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Date of Birth</label>
                            <span>
                              {selectedUserProfile.patient_profile
                                .date_of_birth
                                ? new Date(
                                    selectedUserProfile.patient_profile
                                      .date_of_birth
                                  ).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Gender</label>
                            <span>
                              {selectedUserProfile.patient_profile.gender ||
                                'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Blood Group</label>
                            <span>
                              {selectedUserProfile.patient_profile
                                .blood_group || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field full-width">
                            <label>Address</label>
                            <span>
                              {selectedUserProfile.patient_profile.address ||
                                'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Emergency Contact</label>
                            <span>
                              {selectedUserProfile.patient_profile
                                .emergency_contact || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Contact Name</label>
                            <span>
                              {selectedUserProfile.patient_profile
                                .emergency_contact_name || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field full-width">
                            <label>Allergies</label>
                            <span>
                              {selectedUserProfile.patient_profile.allergies
                                ?.length
                                ? selectedUserProfile.patient_profile.allergies.join(
                                    ', '
                                  )
                                : 'None'}
                            </span>
                          </div>
                          <div className="profile-field full-width">
                            <label>Chronic Conditions</label>
                            <span>
                              {selectedUserProfile.patient_profile
                                .chronic_conditions?.length
                                ? selectedUserProfile.patient_profile.chronic_conditions.join(
                                    ', '
                                  )
                                : 'None'}
                            </span>
                          </div>
                        </div>
                      </section>
                    )}

                  {/* Lab assistant extra */}
                  {selectedUserProfile.role === 'lab_assistant' &&
                    selectedUserProfile.lab_assistant_profile && (
                      <section className="profile-section">
                        <h4>Lab Assistant Profile</h4>
                        <div className="profile-grid">
                          <div className="profile-field">
                            <label>Date of Birth</label>
                            <span>
                              {selectedUserProfile.lab_assistant_profile
                                .date_of_birth
                                ? new Date(
                                    selectedUserProfile.lab_assistant_profile
                                      .date_of_birth
                                  ).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Gender</label>
                            <span>
                              {selectedUserProfile.lab_assistant_profile
                                .gender || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Blood Group</label>
                            <span>
                              {selectedUserProfile.lab_assistant_profile
                                .blood_group || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Contact No</label>
                            <span>
                              {selectedUserProfile.lab_assistant_profile
                                .contact_no || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Hospital</label>
                            <span>
                              {selectedUserProfile.lab_assistant_profile
                                .hospital || 'N/A'}
                            </span>
                          </div>
                          <div className="profile-field">
                            <label>Department</label>
                            <span>
                              {selectedUserProfile.lab_assistant_profile
                                .department || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </section>
                    )}
                </>
              )}
            </div>

            <div className="modal-footer-modern">
              <button
                className="btn-secondary-outline"
                onClick={closeUserProfile}
                disabled={profileLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// Users Component
// ========================

function UsersTab({
  users,
  searchTerm,
  onRoleUpdated,
  onDeleted,
  onViewProfile,
}) {
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangeRole = async (user, newRole) => {
    if (newRole === user.role) return;

    const confirmChange = window.confirm(
      `Change ${user.full_name}'s role from ${user.role} to ${newRole}?`
    );
    if (!confirmChange) return;

    try {
      setSavingId(user.id);
      const res = await updateUserRole(user.id, newRole);
      onRoleUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user role');
      console.error('Error updating role:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const ok = window.confirm(
      `Are you sure you want to delete user "${user.full_name}"? This may remove related data.`
    );
    if (!ok) return;

    try {
      setDeletingId(user.id);
      await deleteUser(user.id);
      onDeleted(user.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>View</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar">{user.full_name.charAt(0)}</div>
                  <span>{user.full_name}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <div className="role-editor">
                  <span className={`badge-modern badge-${user.role}`}>
                    {user.role.toUpperCase()}
                  </span>
                  <div className="role-select-wrapper">
                    <select
                      className={`role-select role-select-${user.role}`}
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(e) => handleChangeRole(user, e.target.value)}
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="lab_assistant">Lab Assistant</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </td>
              <td>
                <button
                  className="btn-view"
                  onClick={() => onViewProfile(user.id)}
                >
                  View
                </button>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteUser(user)}
                  disabled={deletingId === user.id}
                >
                  {deletingId === user.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ========================
// Patients Component
// ========================

function PatientsTab({ patients, searchTerm, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const filtered = patients.filter(
    (p) =>
      p.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePatient = async (patient) => {
    const ok = window.confirm(
      `Delete patient profile "${patient.user_name}" (${patient.patient_id})?`
    );
    if (!ok) return;

    try {
      setDeletingId(patient.id);
      await deletePatient(patient.id);
      onDeleted(patient.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete patient');
      console.error('Error deleting patient:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Blood Group</th>
            <th>Contact</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((patient) => (
            <tr key={patient.id}>
              <td>
                <strong>{patient.patient_id}</strong>
              </td>
              <td>{patient.user_name}</td>
              <td>{patient.gender}</td>
              <td>
                <span className="blood-badge">
                  {patient.blood_group || 'N/A'}
                </span>
              </td>
              <td>{patient.user_email}</td>
              <td>
                <button
                  className="btn-danger"
                  onClick={() => handleDeletePatient(patient)}
                  disabled={deletingId === patient.id}
                >
                  {deletingId === patient.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ========================
// Doctors Component
// ========================

function DoctorsTab({ doctors, searchTerm, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const filtered = doctors.filter(
    (d) =>
      d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteDoctorClick = async (doctor) => {
    const ok = window.confirm(
      `Delete doctor "${doctor.full_name}" (${doctor.specialization})?`
    );
    if (!ok) return;

    try {
      setDeletingId(doctor.id);
      await deleteDoctor(doctor.id);
      onDeleted(doctor.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete doctor');
      console.error('Error deleting doctor:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialization</th>
            <th>Hospital Email</th>
            <th>Phone</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((doctor) => (
            <tr key={doctor.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar doctor-avatar">
                    {doctor.full_name.charAt(0)}
                  </div>
                  <span>{doctor.full_name}</span>
                </div>
              </td>
              <td>
                <span className="specialization-badge">
                  {doctor.specialization}
                </span>
              </td>
              <td>{doctor.hospital_email}</td>
              <td>{doctor.phone || 'N/A'}</td>
              <td>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteDoctorClick(doctor)}
                  disabled={deletingId === doctor.id}
                >
                  {deletingId === doctor.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ========================
// Lab Assistants Component
// ========================

function LabAssistantsTab({ labAssistants, searchTerm, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const filtered = labAssistants.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteLabAssistant = async (user) => {
    const ok = window.confirm(
      `Delete lab assistant "${user.full_name}" (${user.email})?`
    );
    if (!ok) return;

    try {
      setDeletingId(user.id);
      await deleteUser(user.id); // same endpoint as other users
      onDeleted(user.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete lab assistant');
      console.error('Error deleting lab assistant:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar">{user.full_name.charAt(0)}</div>
                  <span>{user.full_name}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteLabAssistant(user)}
                  disabled={deletingId === user.id}
                >
                  {deletingId === user.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ========================
// Appointments Component
// ========================

function AppointmentsTab({ appointments, searchTerm, onDeleted, onUpdated }) {
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null); // current appointment being edited
  const [saving, setSaving] = useState(false);

  const filtered = appointments.filter(
    (a) =>
      a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteAppointmentClick = async (appointment) => {
    const ok = window.confirm(
      `Delete appointment for "${appointment.patient_name}" with "${appointment.doctor_name}"?`
    );
    if (!ok) return;

    try {
      setDeletingId(appointment.id);
      await deleteAppointment(appointment.id);
      onDeleted(appointment.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete appointment');
      console.error('Error deleting appointment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (apt) => {
    setEditing({
      ...apt,
      // convert to datetime-local compatible string
      appointment_date_input: new Date(apt.appointment_date)
        .toISOString()
        .slice(0, 16),
      status_input: apt.status,
      admin_notes_input: '',
    });
  };

  const closeEditModal = () => {
    setEditing(null);
    setSaving(false);
  };

  const handleEditChange = (field, value) => {
    setEditing((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const ok = window.confirm(
      'Save changes to this appointment (status and date/time)?'
    );
    if (!ok) return;

    try {
      setSaving(true);

      // Build payload for reschedule + status + admin note
      const updatePayload = {
        appointment_date: new Date(
          editing.appointment_date_input
        ).toISOString(),
        status: editing.status_input,
        admin_notes: editing.admin_notes_input || undefined,
      };

      const res = await adminUpdateAppointment(editing.id, updatePayload);

      onUpdated(res.data);
      closeEditModal();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update appointment');
      console.error('Error updating appointment:', err);
      setSaving(false);
    }
  };

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date &amp; Time</th>
            <th>Status</th>
            <th>Reason</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((apt) => (
            <tr key={apt.id}>
              <td>{apt.patient_name}</td>
              <td>{apt.doctor_name}</td>
              <td>{new Date(apt.appointment_date).toLocaleString()}</td>
              <td>
                <span
                  className={`status-badge-modern status-${apt.status}`}
                >
                  {apt.status}
                </span>
              </td>
              <td className="reason-cell">{apt.reason}</td>
              <td>
                <div className="table-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => openEditModal(apt)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteAppointmentClick(apt)}
                    disabled={deletingId === apt.id}
                  >
                    {deletingId === apt.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Appointment Modal */}
      {editing && (
        <div className="modal-backdrop">
          <div className="modal-modern">
            <div className="modal-header-modern">
              <h3>Edit Appointment</h3>
              <button
                className="modal-close-btn"
                onClick={closeEditModal}
                disabled={saving}
              >
                ✖
              </button>
            </div>

            <div className="modal-body-modern">
              <div className="modal-row">
                <div className="modal-field">
                  <label>Patient</label>
                  <input type="text" value={editing.patient_name} disabled />
                </div>
                <div className="modal-field">
                  <label>Doctor</label>
                  <input type="text" value={editing.doctor_name} disabled />
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={editing.appointment_date_input}
                    onChange={(e) =>
                      handleEditChange('appointment_date_input', e.target.value)
                    }
                    disabled={saving}
                  />
                </div>
                <div className="modal-field">
                  <label>Status</label>
                  <select
                    value={editing.status_input}
                    onChange={(e) =>
                      handleEditChange('status_input', e.target.value)
                    }
                    disabled={saving}
                  >
                    <option value={APPOINTMENT_STATUS.PENDING}>Pending</option>
                    <option value={APPOINTMENT_STATUS.CONFIRMED}>
                      Confirmed
                    </option>
                    <option value={APPOINTMENT_STATUS.REJECTED}>
                      Rejected
                    </option>
                    <option value={APPOINTMENT_STATUS.COMPLETED}>
                      Completed
                    </option>
                    <option value={APPOINTMENT_STATUS.CANCELLED}>
                      Cancelled
                    </option>
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label>Admin Notes (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Why are you changing this appointment?"
                  value={editing.admin_notes_input}
                  onChange={(e) =>
                    handleEditChange('admin_notes_input', e.target.value)
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="modal-footer-modern">
              <button
                className="btn-secondary-outline"
                onClick={closeEditModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
