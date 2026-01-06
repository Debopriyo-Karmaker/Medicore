import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, {
  fetchLabPatientDetails,
  downloadLabPatientPdf,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LabAssistantDashboard.css';

function PatientDetailsModal({ patientId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && patientId) {
      loadDetails();
    } else {
      setData(null);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patientId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchLabPatientDetails(patientId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load patient details', err);
      setError(err.response?.data?.detail || 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!patientId) return;
    try {
      setDownloading(true);
      const res = await downloadLabPatientPdf(patientId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const name =
        data?.patient?.patient_id ||
        data?.patient?.name ||
        patientId.toString();

      link.href = url;
      link.download = `patient_${name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="lab-modal-backdrop" onClick={onClose}>
      <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h2>Patient Medical Record</h2>
          <button className="lab-modal-close" onClick={onClose}>
            ✖
          </button>
        </div>

        {loading && (
          <div className="lab-loading" style={{ minHeight: '120px' }}>
            <div className="spinner-large"></div>
            <p>Loading patient details...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert-error-lab">⚠️ {error}</div>
        )}

        {!loading && !error && data && (
          <div className="patient-details-content">
            {/* Patient info */}
            <section className="details-section">
              <h3>Patient Information</h3>
              <div className="details-grid">
                <div className="detail-row">
                  <span className="detail-label">Patient ID</span>
                  <span className="detail-value">
                    {data.patient.patient_id}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{data.patient.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{data.patient.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">
                    {data.patient.gender || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Blood Group</span>
                  <span className="detail-value">
                    <span className="blood-badge-modal">
                      {data.patient.blood_group || 'N/A'}
                    </span>
                  </span>
                </div>
              </div>
            </section>

            {/* History */}
            <section className="details-section">
              <h3>
                Diagnostic History ({data.report_count || 0} reports)
              </h3>
              {data.medical_history && data.medical_history.length > 0 ? (
                <div className="reports-list">
                  {data.medical_history.map((r) => (
                    <div key={r.report_id} className="report-card">
                      <div className="report-header">
                        <h4>{r.report_type}</h4>
                        <span className="report-date">
                          {r.uploaded_at
                            ? new Date(r.uploaded_at).toLocaleString()
                            : ''}
                        </span>
                      </div>
                      <div className="report-content">
                        <p>
                          <strong>Uploaded by:</strong> {r.uploaded_by || 'N/A'}
                        </p>
                        {r.notes && (
                          <p>
                            <strong>Notes:</strong> {r.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No reports for this patient yet.</p>
              )}
            </section>

            <div className="modal-actions">
              <button
                className="lab-btn-download"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? '⏳ Generating PDF...' : '📥 Download as PDF'}
              </button>
              <button className="lab-btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LabAssistantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // reports modal state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // upload form state
  const [uploadData, setUploadData] = useState({
    patient_id: '',
    report_type: '',
    notes: '',
    file: null,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [error, setError] = useState('');

  // patient details modal state
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, patientsRes] = await Promise.all([
        api.get('/lab/statistics'),
        api.get('/lab/patients'),
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

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      setReportsError('');
      const res = await api.get('/lab/reports');
      console.log('Reports from backend:', res.data);
      setReports(res.data || []);
      setPreviewUrl('');
      setShowReportsModal(true);
    } catch (err) {
      console.error('Error loading reports:', err);
      setReportsError(err.response?.data?.detail || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await api.delete(`/lab/reports/${reportId}`);
      setReports((prev) => prev.filter((r) => r.report_id !== reportId));
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.detail || 'Failed to delete report');
    }
  };

  const handleUploadChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setUploadData((prev) => ({ ...prev, file: files[0] }));
    } else {
      setUploadData((prev) => ({ ...prev, [name]: value }));
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
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      setUploadSuccess('✅ Report uploaded successfully!');
      setUploadData({ patient_id: '', report_type: '', notes: '', file: null });

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

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

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openPatientDetails = (patientId) => {
    setSelectedPatientId(patientId);
    setShowPatientModal(true);
  };

  const closePatientDetails = () => {
    setShowPatientModal(false);
    setSelectedPatientId(null);
  };

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
          <p>
            Welcome, <strong>{user?.full_name}</strong>
          </p>
        </div>
        <div className="lab-header-actions">
          <button className="refresh-btn-lab" onClick={fetchData}>
            🔄 Refresh
          </button>
          <button
            className="refresh-btn-lab"
            onClick={() => navigate('/lab/profile')}
          >
            👤 Profile
          </button>
        </div>
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
          <div
            className="lab-stat-card stat-blue lab-stat-clickable"
            onClick={fetchReports}
          >
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
        <button className="lab-tab" onClick={() => navigate('/lab/profile')}>
          👤 Profile
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
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <strong>{patient.patient_id}</strong>
                      </td>
                      <td>{patient.name}</td>
                      <td>{patient.email}</td>
                      <td>
                        <span className="blood-badge-lab">
                          {patient.blood_group || 'N/A'}
                        </span>
                      </td>
                      <td>{patient.gender}</td>
                      <td>
                        <button
                          className="action-btn-lab"
                          onClick={() => openPatientDetails(patient.id)}
                        >
                          View
                        </button>
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
              {error && <div className="alert-error-lab">⚠️ {error}</div>}

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
                    {patients.map((p) => (
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
              <button
                onClick={() => setActiveTab('upload')}
                className="quick-btn"
              >
                📤 Upload Report
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className="quick-btn"
              >
                👥 View Patients
              </button>
              <button
                onClick={() => navigate('/lab/profile')}
                className="quick-btn"
              >
                👤 Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reports Modal */}
      {showReportsModal && (
        <div
          className="lab-modal-backdrop"
          onClick={() => {
            setShowReportsModal(false);
            setPreviewUrl('');
          }}
        >
          <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lab-modal-header">
              <h2>📄 Uploaded Reports</h2>
              <button
                className="lab-modal-close"
                onClick={() => {
                  setShowReportsModal(false);
                  setPreviewUrl('');
                }}
              >
                ✖
              </button>
            </div>

            {reportsLoading && <p>Loading reports...</p>}
            {reportsError && (
              <p className="alert-error-lab">⚠️ {reportsError}</p>
            )}

            {!reportsLoading && !reportsError && reports.length === 0 && (
              <p>No reports uploaded yet.</p>
            )}

            {!reportsLoading && reports.length > 0 && (
              <>
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.report_id}>
                        <td>{report.patient_name || report.patient_id}</td>
                        <td>{report.report_type}</td>
                        <td>
                          {report.created_at
                            ? new Date(report.created_at).toLocaleString()
                            : ''}
                        </td>
                        <td>
                          <button
                            className="action-btn-lab"
                            onClick={() => {
                              if (report.file_url) {
                                setPreviewUrl(report.file_url);
                              } else {
                                alert('No file available for this report.');
                              }
                            }}
                          >
                            View
                          </button>
                          <button
                            className="action-btn-lab danger"
                            onClick={() =>
                              handleDeleteReport(report.report_id)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {previewUrl && (
                  <div
                    style={{
                      marginTop: '20px',
                      height: '500px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <iframe
                      src={previewUrl}
                      title="Report preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patientId={selectedPatientId}
        isOpen={showPatientModal}
        onClose={closePatientDetails}
      />
    </div>
  );
}
