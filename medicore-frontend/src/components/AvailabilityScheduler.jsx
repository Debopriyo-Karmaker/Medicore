import { useState } from 'react';
import './AvailabilityScheduler.css';

export default function AvailabilityScheduler({ availability, onUpdate, maxDays = 3 }) {
  const [schedule, setSchedule] = useState(availability || []);
  const [selectedDay, setSelectedDay] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const addDay = () => {
    if (!selectedDay) return;
    if (schedule.length >= maxDays) {
      alert(`You can only select up to ${maxDays} days`);
      return;
    }
    if (schedule.find(d => d.day === selectedDay)) {
      alert('This day is already selected');
      return;
    }

    setSchedule([...schedule, { day: selectedDay, time_slots: [] }]);
    setSelectedDay('');
  };

  const removeDay = (day) => {
    setSchedule(schedule.filter(d => d.day !== day));
  };

  const addTimeSlot = (day) => {
    if (!timeSlot) return;
    
    setSchedule(schedule.map(d => {
      if (d.day === day) {
        if (d.time_slots.includes(timeSlot)) {
          alert('This time slot already exists');
          return d;
        }
        return { ...d, time_slots: [...d.time_slots, timeSlot] };
      }
      return d;
    }));
    setTimeSlot('');
  };

  const removeTimeSlot = (day, slot) => {
    setSchedule(schedule.map(d => {
      if (d.day === day) {
        return { ...d, time_slots: d.time_slots.filter(s => s !== slot) };
      }
      return d;
    }));
  };

  const handleSave = () => {
    onUpdate(schedule);
  };

  return (
    <div className="availability-scheduler">
      <div className="scheduler-add-day">
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
          <option value="">Select a day...</option>
          {daysOfWeek.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <button type="button" onClick={addDay} className="btn-add-day">
          ➕ Add Day
        </button>
      </div>

      <div className="schedule-days">
        {schedule.map(daySchedule => (
          <div key={daySchedule.day} className="day-card">
            <div className="day-header">
              <h3>{daySchedule.day}</h3>
              <button type="button" onClick={() => removeDay(daySchedule.day)} className="btn-remove-day">
                ✕
              </button>
            </div>

            <div className="time-slot-input">
              <input
                type="time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="Add time slot"
              />
              <button type="button" onClick={() => addTimeSlot(daySchedule.day)} className="btn-add-slot">
                Add Slot
              </button>
            </div>

            <div className="time-slots-list">
              {daySchedule.time_slots.length === 0 ? (
                <p className="no-slots">No time slots added</p>
              ) : (
                daySchedule.time_slots.map((slot, idx) => (
                  <div key={idx} className="time-slot-chip">
                    <span>{slot}</span>
                    <button type="button" onClick={() => removeTimeSlot(daySchedule.day, slot)}>
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {schedule.length > 0 && (
        <button type="button" onClick={handleSave} className="btn-save-schedule">
          💾 Save Availability
        </button>
      )}
    </div>
  );
}
