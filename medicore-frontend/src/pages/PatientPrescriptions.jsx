import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PatientPrescriptions.css';
import { FaPills, FaCalendarAlt, FaUserMd, FaVial, FaStethoscope, FaClipboardList, FaChevronDown } from 'react-icons/fa';

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');

      const patientResponse = await api.get('/patients/me');
      const patientId = patientResponse.data.patient_id;

      const prescResponse = await api.get(`/prescriptions/patient/${patientId}`);
      setPrescriptions(prescResponse.data);
      console.log('✅ Prescriptions loaded:', prescResponse.data);
    } catch (err) {
      console.error('❌ Error loading prescriptions:', err);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="prescriptions-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prescriptions-page">
      {/* Header Section */}
      <div className="prescriptions-header-modern">
        <div className="header-content">
          <div className="header-icon">
            <FaPills />
          </div>
          <div className="header-text">
            <h1>My Prescriptions</h1>
            <p>All your medical prescriptions in one place</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-number">{prescriptions.length}</span>
            <span className="stat-label">Total Prescriptions</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {prescriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FaPills />
          </div>
          <h2>No Prescriptions Yet</h2>
          <p>Your prescriptions from doctors will appear here</p>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {prescriptions.map((presc, idx) => (
            <div 
              key={idx} 
              className={`prescription-card-modern ${expandedCard === idx ? 'expanded' : ''}`}
              onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
            >
              {/* Card Header */}
              <div className="card-header-modern">
                <div className="doctor-info">
                  <div className="doctor-avatar">
                    <FaUserMd />
                  </div>
                  <div className="doctor-details">
                    <h3>Dr. {presc.doctor_name}</h3>
                    <p className="prescription-id">{presc.prescription_id}</p>
                  </div>
                </div>
                <div className="card-date">
                  <FaCalendarAlt />
                  <span>{new Date(presc.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Main Content - Visible */}
              <div className="card-content-modern">
                {/* Diagnosis */}
                <div className="content-section diagnosis-section">
                  <h4>
                    <FaStethoscope /> Diagnosis
                  </h4>
                  <p className="diagnosis-text">{presc.diagnosis}</p>
                </div>

                {/* Medicines - Eye Catching */}
                {presc.medicines && presc.medicines.length > 0 && (
                  <div className="content-section medicines-section">
                    <h4 className="medicines-title">
                      <FaPills /> Medicines ({presc.medicines.length})
                    </h4>
                    <div className="medicines-chips">
                      {presc.medicines.map((med, medIdx) => (
                        <div key={medIdx} className="medicine-chip">
                          <div className="medicine-chip-header">
                            <span className="medicine-name">{med.name}</span>
                            <span className="medicine-dosage">{med.dosage}</span>
                          </div>
                          <div className="medicine-chip-footer">
                            <span className="badge frequency">{med.frequency}</span>
                            <span className="badge duration">{med.duration}</span>
                          </div>
                          {med.instructions && (
                            <div className="medicine-instructions">{med.instructions}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vital Signs */}
                {presc.vital_signs && Object.keys(presc.vital_signs).length > 0 && (
                  <div className="content-section vitals-section">
                    <h4>
                      <FaStethoscope /> Vital Signs
                    </h4>
                    <div className="vitals-grid">
                      {presc.vital_signs.bp && (
                        <div className="vital-card">
                          <span className="vital-label">Blood Pressure</span>
                          <span className="vital-value">{presc.vital_signs.bp}</span>
                        </div>
                      )}
                      {presc.vital_signs.temp && (
                        <div className="vital-card">
                          <span className="vital-label">Temperature</span>
                          <span className="vital-value">{presc.vital_signs.temp}°C</span>
                        </div>
                      )}
                      {presc.vital_signs.pulse && (
                        <div className="vital-card">
                          <span className="vital-label">Pulse</span>
                          <span className="vital-value">{presc.vital_signs.pulse} bpm</span>
                        </div>
                      )}
                      {presc.vital_signs.weight && (
                        <div className="vital-card">
                          <span className="vital-label">Weight</span>
                          <span className="vital-value">{presc.vital_signs.weight} kg</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lab Tests */}
                {presc.lab_tests_ordered && presc.lab_tests_ordered.length > 0 && (
                  <div className="content-section labs-section">
                    <h4>
                      <FaVial /> Lab Tests Ordered
                    </h4>
                    <div className="labs-list">
                      {presc.lab_tests_ordered.map((test, testIdx) => (
                        <div key={testIdx} className="lab-item">
                          <span className="lab-icon">🧪</span>
                          <span>{test}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {presc.symptoms && (
                  <div className="content-section symptoms-section">
                    <h4>
                      <FaClipboardList /> Symptoms
                    </h4>
                    <p className="symptoms-text">{presc.symptoms}</p>
                  </div>
                )}

                {/* Advice */}
                {presc.advice && (
                  <div className="content-section advice-section">
                    <h4>Doctor's Advice</h4>
                    <div className="advice-box">{presc.advice}</div>
                  </div>
                )}

                {/* Follow-up */}
                {presc.follow_up_date && (
                  <div className="content-section followup-section">
                    <h4>
                      <FaCalendarAlt /> Follow-up Appointment
                    </h4>
                    <div className="followup-date">
                      {new Date(presc.follow_up_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Expand Button */}
              <div className="card-footer-modern">
                <button className="expand-btn">
                  <FaChevronDown className={expandedCard === idx ? 'rotated' : ''} />
                  {expandedCard === idx ? 'Show Less' : 'Show More'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
