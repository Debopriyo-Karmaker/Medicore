import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('statistics');
  const [data, setData] = useState({
    statistics: null,
    users: [],
    patients: [],
    doctors: [],
    appointments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, usersRes, patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
        api.get('/admin/statistics'),
        api.get('/admin/users'),
        api.get('/admin/patients'),
        api.get('/admin/doctors'),
        api.get('/admin/appointments')
      ]);

      setData({
        statistics: statsRes.data,
        users: usersRes.data,
        patients: patientsRes.data,
        doctors: doctorsRes.data,
        appointments: appointmentsRes.data
      });

      console.log('✅ All admin data fetched');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load data');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-modern">
      {/* Header */}
      <div className="admin-header-modern">
        <div className="admin-welcome">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, <strong>{user?.full_name}</strong></p>
        </div>
        <div className="admin-actions">
          <button className="refresh-btn" onClick={fetchAllData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-modern alert-error-modern">
          ⚠️ {error}
        </div>
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
          onClick={() => setActiveTab('statistics')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-modern ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({data.users.length})
        </button>
        <button
          className={`tab-modern ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          🏥 Patients ({data.patients.length})
        </button>
        <button
          className={`tab-modern ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          👨‍⚕️ Doctors ({data.doctors.length})
        </button>
        <button
          className={`tab-modern ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
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
        {activeTab === 'users' && <UsersTab users={data.users} searchTerm={searchTerm} />}
        {activeTab === 'patients' && <PatientsTab patients={data.patients} searchTerm={searchTerm} />}
        {activeTab === 'doctors' && <DoctorsTab doctors={data.doctors} searchTerm={searchTerm} />}
        {activeTab === 'appointments' && <AppointmentsTab appointments={data.appointments} searchTerm={searchTerm} />}
      </div>
    </div>
  );
}

// Users Component
function UsersTab({ users, searchTerm }) {
  const filtered = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(user => (
            <tr key={user.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar">{user.full_name.charAt(0)}</div>
                  <span>{user.full_name}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <span className={`badge-modern badge-${user.role}`}>
                  {user.role}
                </span>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Patients Component
function PatientsTab({ patients, searchTerm }) {
  const filtered = patients.filter(p => 
    p.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          </tr>
        </thead>
        <tbody>
          {filtered.map(patient => (
            <tr key={patient.id}>
              <td><strong>{patient.patient_id}</strong></td>
              <td>{patient.user_name}</td>
              <td>{patient.gender}</td>
              <td>
                <span className="blood-badge">{patient.blood_group || 'N/A'}</span>
              </td>
              <td>{patient.user_email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Doctors Component
function DoctorsTab({ doctors, searchTerm }) {
  const filtered = doctors.filter(d => 
    d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialization</th>
            <th>Hospital Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(doctor => (
            <tr key={doctor.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar doctor-avatar">{doctor.full_name.charAt(0)}</div>
                  <span>{doctor.full_name}</span>
                </div>
              </td>
              <td>
                <span className="specialization-badge">{doctor.specialization}</span>
              </td>
              <td>{doctor.hospital_email}</td>
              <td>{doctor.phone || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Appointments Component
function AppointmentsTab({ appointments, searchTerm }) {
  const filtered = appointments.filter(a => 
    a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-container-modern">
      <table className="table-modern">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(apt => (
            <tr key={apt.id}>
              <td>{apt.patient_name}</td>
              <td>{apt.doctor_name}</td>
              <td>{new Date(apt.appointment_date).toLocaleString()}</td>
              <td>
                <span className={`status-badge-modern status-${apt.status}`}>
                  {apt.status}
                </span>
              </td>
              <td className="reason-cell">{apt.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
