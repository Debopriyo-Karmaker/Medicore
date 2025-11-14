import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user?.full_name}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({data.users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          🏥 Patients ({data.patients.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          👨‍⚕️ Doctors ({data.doctors.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Appointments ({data.appointments.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'statistics' && <StatisticsTab data={data.statistics} />}
        {activeTab === 'users' && <UsersTab users={data.users} />}
        {activeTab === 'patients' && <PatientsTab patients={data.patients} />}
        {activeTab === 'doctors' && <DoctorsTab doctors={data.doctors} />}
        {activeTab === 'appointments' && <AppointmentsTab appointments={data.appointments} />}
      </div>
    </div>
  );
}

// Statistics Component
function StatisticsTab({ data }) {
  if (!data) return <div>Loading statistics...</div>;

  return (
    <div className="statistics-grid">
      <div className="stat-card">
        <div className="stat-label">Total Users</div>
        <div className="stat-number">{data.total_users}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total Patients</div>
        <div className="stat-number">{data.total_patients}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total Doctors</div>
        <div className="stat-number">{data.total_doctors}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total Appointments</div>
        <div className="stat-number">{data.total_appointments}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Pending Appointments</div>
        <div className="stat-number" style={{ color: '#f39c12' }}>
          {data.appointments_by_status.pending}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Confirmed Appointments</div>
        <div className="stat-number" style={{ color: '#27ae60' }}>
          {data.appointments_by_status.confirmed}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Rejected Appointments</div>
        <div className="stat-number" style={{ color: '#e74c3c' }}>
          {data.appointments_by_status.rejected}
        </div>
      </div>
    </div>
  );
}

// Users Component
function UsersTab({ users }) {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Full Name</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.full_name}</td>
              <td>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
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
function PatientsTab({ patients }) {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>DOB</th>
            <th>Gender</th>
            <th>Blood Group</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(patient => (
            <tr key={patient.id}>
              <td>{patient.patient_id}</td>
              <td>{patient.user_name}</td>
              <td>{patient.user_email}</td>
              <td>{patient.date_of_birth || 'N/A'}</td>
              <td>{patient.gender}</td>
              <td>{patient.blood_group}</td>
              <td>{new Date(patient.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Doctors Component
function DoctorsTab({ doctors }) {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Hospital Email</th>
            <th>Specialization</th>
            <th>Phone</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map(doctor => (
            <tr key={doctor.id}>
              <td>{doctor.full_name}</td>
              <td>{doctor.email}</td>
              <td>{doctor.hospital_email}</td>
              <td>{doctor.specialization}</td>
              <td>{doctor.phone || 'N/A'}</td>
              <td>{new Date(doctor.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Appointments Component
function AppointmentsTab({ appointments }) {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Specialization</th>
            <th>Date & Time</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(apt => (
            <tr key={apt.id}>
              <td>
                <div>{apt.patient_name}</div>
                <small>{apt.patient_email}</small>
              </td>
              <td>
                <div>{apt.doctor_name}</div>
                <small>{apt.doctor_email}</small>
              </td>
              <td>{apt.doctor_specialization}</td>
              <td>{new Date(apt.appointment_date).toLocaleString()}</td>
              <td>{apt.reason}</td>
              <td>
                <span className={`status-badge status-${apt.status}`}>{apt.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
