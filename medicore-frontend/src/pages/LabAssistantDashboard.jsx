import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LabAssistantDashboard.css';

export default function LabAssistantDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload form state
  const [uploadData, setUploadData] = useState({
    patient_id: '',
    report_type: '',
    notes: '',
    file: null
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, patientsRes] = await Promise.all([
        api.get('/lab/statistics'),
        api.get('/lab/patients')
      ]);

      setStatistics(statsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setUploadData(prev => ({ ...prev, file: files[0] }));
    } else {
      setUploadData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);

      await api.post(
        `/lab/upload-report/${uploadData.patient_id}?report_type=${uploadData.report_type}&notes=${uploadData.notes}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadSuccess('✅ Report uploaded successfully!');
      setUploadData({ patient_id: '', report_type: '', notes: '', file: null });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Refresh statistics
      setTimeout(() => {
        fetchData();
        setUploadSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload report');
      console.error('Upload error:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="lab-loading">
        <div className="spinner-large"></div>
        <p>Loading Lab Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="lab-dashboard">
      {/* Header */}
      <div className="lab-header">
        <div className="lab-welcome">
          <h1>🧪 Lab Assistant Dashboard</h1>
          <p>Welcome, <strong>{user?.full_name}</strong></p>
        </div>
        <button className="refresh-btn-lab" onClick={fetchData}>
          🔄 Refresh
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="lab-stats-grid">
          <div className="lab-stat-card stat-green">
            <div className="lab-stat-icon">🏥</div>
            <div className="lab-stat-content">
              <h3>{statistics.total_patients}</h3>
              <p>Total Patients</p>
            </div>
          </div>
          <div className="lab-stat-card stat-blue">
            <div className="lab-stat-icon">📄</div>
            <div className="lab-stat-content">
              <h3>{statistics.reports_uploaded}</h3>
              <p>Reports Uploaded</p>
            </div>
          </div>
          <div className="lab-stat-card stat-orange">
            <div className="lab-stat-icon">⏳</div>
            <div className="lab-stat-content">
              <h3>{statistics.pending_tests}</h3>
              <p>Pending Tests</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="lab-tabs">
        <button
          className={`lab-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`lab-tab ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          👥 Patients ({patients.length})
        </button>
        <button
          className={`lab-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Upload Report
        </button>
      </div>

      {/* Content */}
      <div className="lab-content">
        {activeTab === 'patients' && (
          <>
            <div className="lab-search">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="patients-table-container">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Blood Group</th>
                    <th>Gender</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => (
                    <tr key={patient.id}>
                      <td><strong>{patient.patient_id}</strong></td>
                      <td>{patient.name}</td>
                      <td>{patient.email}</td>
                      <td>
                        <span className="blood-badge-lab">{patient.blood_group || 'N/A'}</span>
                      </td>
                      <td>{patient.gender}</td>
                      <td>
                        <button className="action-btn-lab">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'upload' && (
          <div className="upload-section">
            <div className="upload-card">
              <h2>📤 Upload Diagnostic Report</h2>
              
              {uploadSuccess && (
                <div className="alert-success-lab">{uploadSuccess}</div>
              )}
              {error && (
                <div className="alert-error-lab">⚠️ {error}</div>
              )}
              
              <form onSubmit={handleUploadSubmit} className="upload-form">
                <div className="form-group-lab">
                  <label>Select Patient *</label>
                  <select
                    name="patient_id"
                    value={uploadData.patient_id}
                    onChange={handleUploadChange}
                    required
                    disabled={uploadLoading}
                  >
                    <option value="">Choose patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.patient_id} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group-lab">
                  <label>Report Type *</label>
                  <select
                    name="report_type"
                    value={uploadData.report_type}
                    onChange={handleUploadChange}
                    required
                    disabled={uploadLoading}
                  >
                    <option value="">Select type...</option>
                    <option value="blood_test">Blood Test</option>
                    <option value="xray">X-Ray</option>
                    <option value="mri">MRI</option>
                    <option value="ct_scan">CT Scan</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group-lab">
                  <label>Upload File (PDF/Image) *</label>
                  <input
                    type="file"
                    name="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadChange}
                    required
                    disabled={uploadLoading}
                  />
                  {uploadData.file && (
                    <small className="file-info">
                      Selected: {uploadData.file.name}
                    </small>
                  )}
                </div>
                
                <div className="form-group-lab">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={uploadData.notes}
                    onChange={handleUploadChange}
                    rows="4"
                    placeholder="Add any additional notes..."
                    disabled={uploadLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  className="submit-btn-lab"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? '⏳ Uploading...' : '📤 Upload Report'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Welcome to Lab Assistant Dashboard</h2>
            <p>Manage patient diagnostic reports and lab tests efficiently.</p>
            <div className="quick-actions">
              <button onClick={() => setActiveTab('upload')} className="quick-btn">
                📤 Upload Report
              </button>
              <button onClick={() => setActiveTab('patients')} className="quick-btn">
                👥 View Patients
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
