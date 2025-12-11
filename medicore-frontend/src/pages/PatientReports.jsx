import { useState, useEffect } from 'react';
import api from '../services/api';
import './PatientReports.css';

export default function PatientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/patients/me/reports');
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="reports-container">
      <h1>📄 My Diagnostic Reports</h1>
      
      {reports.length === 0 ? (
        <div className="no-reports">
          <p>No diagnostic reports available yet.</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report.report_id} className="report-card">
              <h3>{report.report_type.replace('_', ' ').toUpperCase()}</h3>
              <p><strong>Uploaded by:</strong> {report.uploaded_by}</p>
              <p><strong>Date:</strong> {new Date(report.uploaded_at).toLocaleString()}</p>
              {report.notes && <p><strong>Notes:</strong> {report.notes}</p>}
              <button
                className="view-btn"
                onClick={() => setSelectedReport(report)}
              >
                View Report
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedReport(null)}>×</button>
            <h2>{selectedReport.report_type}</h2>
            {selectedReport.file_url.startsWith('data:image') ? (
              <img src={selectedReport.file_url} alt="Report" style={{maxWidth: '100%'}} />
            ) : (
              <iframe
                src={selectedReport.file_url}
                style={{width: '100%', height: '600px', border: 'none'}}
                title="Report PDF"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
