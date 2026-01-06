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
      setReports(response.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setSelectedReport(null);

  if (loading) {
    return (
      <div className="patient-reports-loading">
        <div className="reports-spinner" />
        <p>Loading your diagnostic reports...</p>
      </div>
    );
  }

  const hasReports = reports.length > 0;

  return (
    <div className="patient-reports-page">
      {/* Header */}
      <div className="reports-hero glass-card">
        <div className="reports-hero-left">
          <div className="reports-icon-pill">📄</div>
          <div>
            <h1>My Diagnostic Reports</h1>
            <p className="reports-subtitle">
              Securely view and preview all lab and diagnostic documents in one place.
            </p>
          </div>
        </div>
        <div className="reports-hero-meta">
          <div className="reports-meta-pill">
            <span className="reports-meta-label">Total Reports</span>
            <span className="reports-meta-value">{reports.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {!hasReports ? (
        <div className="reports-empty glass-card">
          <h2>No reports available</h2>
          <p>
            Once your lab or doctor uploads diagnostic reports, they will
            appear here for quick access and download.
          </p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <article key={report.report_id} className="report-card glass-card">
              <header className="report-card-header">
                <span className="report-type-pill">
                  {report.report_type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="report-date">
                  {new Date(report.uploaded_at).toLocaleString()}
                </span>
              </header>

              <div className="report-card-body">
                <p className="report-field">
                  <span className="report-label">Uploaded by</span>
                  <span className="report-value">{report.uploaded_by}</span>
                </p>
                {report.notes && (
                  <p className="report-notes">
                    <span className="report-label">Notes</span>
                    <span className="report-value">{report.notes}</span>
                  </p>
                )}
              </div>

              <footer className="report-card-footer">
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => setSelectedReport(report)}
                >
                  View report
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedReport && (
        <div className="report-modal-overlay" onClick={closeModal}>
          <div
            className="report-modal glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="report-modal-header">
              <div>
                <h2>
                  {selectedReport.report_type.replace('_', ' ').toUpperCase()}
                </h2>
                <p className="report-modal-meta">
                  Uploaded by {selectedReport.uploaded_by} ·{' '}
                  {new Date(selectedReport.uploaded_at).toLocaleString()}
                </p>
              </div>
              <button
                className="modal-close-btn"
                type="button"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="report-modal-body">
              {selectedReport.file_url?.startsWith('data:image') ? (
                <img
                  src={selectedReport.file_url}
                  alt="Diagnostic report"
                  className="report-preview-image"
                />
              ) : (
                <iframe
                  src={selectedReport.file_url}
                  className="report-preview-frame"
                  title="Report PDF"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
