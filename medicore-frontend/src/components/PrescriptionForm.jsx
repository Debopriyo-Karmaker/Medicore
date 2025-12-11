import { useState } from 'react';
import './PrescriptionForm.css';

export default function PrescriptionForm({
  patientId,
  patientName,
  onSubmit,
  onCancel
}) {
  const [formData, setFormData] = useState({
    diagnosis: '',
    symptoms: '',
    vital_signs: {
      bp: '',
      temp: '',
      pulse: '',
      weight: ''
    },
    medicines: [],
    lab_tests_ordered: [],
    advice: '',
    follow_up_date: ''
  });

  const [currentMedicine, setCurrentMedicine] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const [currentLabTest, setCurrentLabTest] = useState('');

  const addMedicine = () => {
    if (
      currentMedicine.name &&
      currentMedicine.dosage &&
      currentMedicine.frequency &&
      currentMedicine.duration
    ) {
      setFormData((prev) => ({
        ...prev,
        medicines: [...prev.medicines, currentMedicine]
      }));
      setCurrentMedicine({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    } else {
      alert('Please fill in all medicine fields (except instructions)');
    }
  };

  const removeMedicine = (index) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const addLabTest = () => {
    if (currentLabTest.trim()) {
      setFormData((prev) => ({
        ...prev,
        lab_tests_ordered: [
          ...prev.lab_tests_ordered,
          currentLabTest.trim()
        ]
      }));
      setCurrentLabTest('');
    }
  };

  const removeLabTest = (index) => {
    setFormData((prev) => ({
      ...prev,
      lab_tests_ordered: prev.lab_tests_ordered.filter(
        (_, i) => i !== index
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.diagnosis) {
      alert('Please enter a diagnosis');
      return;
    }

    if (formData.medicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    // Convert follow_up_date to ISO datetime format if provided
    const followUpDateTime = formData.follow_up_date
      ? `${formData.follow_up_date}T00:00:00`
      : null;

    const prescriptionData = {
      patient_id: patientId,
      appointment_id: null,
      diagnosis: formData.diagnosis,
      symptoms: formData.symptoms || null,
      vital_signs: Object.values(formData.vital_signs).some((v) => v)
        ? {
            bp: formData.vital_signs.bp || null,
            temp: formData.vital_signs.temp || null,
            pulse: formData.vital_signs.pulse || null,
            weight: formData.vital_signs.weight || null
          }
        : null,
      medicines: formData.medicines.map((med) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || null
      })),
      lab_tests_ordered: formData.lab_tests_ordered.length > 0
        ? formData.lab_tests_ordered
        : [],
      advice: formData.advice || null,
      follow_up_date: followUpDateTime
    };

    console.log('📤 Sending prescription data:', prescriptionData);
    onSubmit(prescriptionData);
  };

  return (
    <form onSubmit={handleSubmit} className="prescription-form">
      <div className="form-section patient-info-header">
        <p>
          <strong>Patient:</strong> {patientName}
        </p>
        <p>
          <strong>Date:</strong> {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="form-section">
        <h3>📋 Clinical Assessment</h3>

        <div className="form-group">
          <label>Diagnosis *</label>
          <input
            type="text"
            placeholder="e.g., Acute Bronchitis, Type 2 Diabetes"
            value={formData.diagnosis}
            onChange={(e) =>
              setFormData({
                ...formData,
                diagnosis: e.target.value
              })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>Symptoms</label>
          <textarea
            rows="3"
            placeholder="Patients reported symptoms..."
            value={formData.symptoms}
            onChange={(e) =>
              setFormData({
                ...formData,
                symptoms: e.target.value
              })
            }
          />
        </div>

        <div className="vital-signs-grid">
          <div className="form-group">
            <label>Blood Pressure</label>
            <input
              type="text"
              placeholder="120/80"
              value={formData.vital_signs.bp}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vital_signs: {
                    ...formData.vital_signs,
                    bp: e.target.value
                  }
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Temperature (°F)</label>
            <input
              type="text"
              placeholder="98.6"
              value={formData.vital_signs.temp}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vital_signs: {
                    ...formData.vital_signs,
                    temp: e.target.value
                  }
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Pulse (bpm)</label>
            <input
              type="text"
              placeholder="72"
              value={formData.vital_signs.pulse}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vital_signs: {
                    ...formData.vital_signs,
                    pulse: e.target.value
                  }
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="text"
              placeholder="70"
              value={formData.vital_signs.weight}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vital_signs: {
                    ...formData.vital_signs,
                    weight: e.target.value
                  }
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>💊 Prescription *</h3>

        <div className="medicine-input-grid">
          <div className="form-group">
            <label>Medicine Name</label>
            <input
              type="text"
              placeholder="e.g., Paracetamol"
              value={currentMedicine.name}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  name: e.target.value
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Dosage</label>
            <input
              type="text"
              placeholder="e.g., 500mg"
              value={currentMedicine.dosage}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  dosage: e.target.value
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Frequency</label>
            <select
              value={currentMedicine.frequency}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  frequency: e.target.value
                })
              }
            >
              <option value="">Select...</option>
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Four times daily">Four times daily</option>
              <option value="Every 4 hours">Every 4 hours</option>
              <option value="Every 6 hours">Every 6 hours</option>
              <option value="Every 8 hours">Every 8 hours</option>
              <option value="As needed">As needed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Duration</label>
            <input
              type="text"
              placeholder="e.g., 7 days, 2 weeks"
              value={currentMedicine.duration}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  duration: e.target.value
                })
              }
            />
          </div>

          <div className="form-group full-width">
            <label>Instructions</label>
            <input
              type="text"
              placeholder="e.g., After meals, Before bedtime"
              value={currentMedicine.instructions}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  instructions: e.target.value
                })
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addMedicine}
          className="btn-add-medicine"
        >
          + Add Medicine
        </button>

        {formData.medicines.length > 0 && (
          <div className="medicines-list">
            <h4>Prescribed Medicines ({formData.medicines.length})</h4>
            {formData.medicines.map((med, index) => (
              <div key={index} className="medicine-item">
                <div className="medicine-details">
                  <strong>{med.name}</strong> - {med.dosage}
                  <br />
                  <span className="medicine-meta">
                    {med.frequency} for {med.duration}
                    {med.instructions && ` • ${med.instructions}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMedicine(index)}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>🧪 Lab Tests Ordered</h3>

        <div className="add-item-group">
          <input
            type="text"
            placeholder="e.g., Complete Blood Count, Lipid Profile"
            value={currentLabTest}
            onChange={(e) => setCurrentLabTest(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLabTest();
              }
            }}
          />
          <button
            type="button"
            onClick={addLabTest}
            className="btn-add"
          >
            + Add Test
          </button>
        </div>

        {formData.lab_tests_ordered.length > 0 && (
          <div className="tags-list">
            {formData.lab_tests_ordered.map((test, index) => (
              <span key={index} className="tag">
                {test}
                <button
                  type="button"
                  onClick={() => removeLabTest(index)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>📝 Additional Instructions</h3>

        <div className="form-group">
          <label>Medical Advice</label>
          <textarea
            rows="4"
            placeholder="General advice, lifestyle changes, precautions..."
            value={formData.advice}
            onChange={(e) =>
              setFormData({
                ...formData,
                advice: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Follow-up Date</label>
          <input
            type="date"
            value={formData.follow_up_date}
            onChange={(e) =>
              setFormData({
                ...formData,
                follow_up_date: e.target.value
              })
            }
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn-submit-prescription"
        >
          ✓ Submit Prescription
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel"
        >
          ✕ Cancel
        </button>
      </div>
    </form>
  );
}