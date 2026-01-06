
# MediCore – Smart Medical Management Platform

MediCore is a full‑stack medical management system that streamlines how clinics handle appointments, prescriptions, reports, and user roles. It provides dedicated dashboards and workflows for doctors, patients, admins, and lab assistants, focusing on a clean UX and clear separation of responsibilities.
---
## Features

- **Role‑based dashboards**
  - Doctor, Patient, Admin, and Lab Assistant views with tailored navigation and permissions.
- **Appointment management**
  - View, search, filter, confirm, and reject appointments with rich cards and status badges.
- **Doctor availability**
  - Interactive scheduler for setting time slots and managing availability.
- **Prescriptions & reports**
  - Create and manage prescriptions, view patient prescription history, and download reports.
- **Patient profiles**
  - Detailed patient information, blood group, medical history, and attached reports in a structured layout.
- **Modern UI**
  - Responsive, theme‑aware dashboards with glassmorphism cards, sticky header, modals, and smooth animations.
---
## Tech Stack

### Backend

- **Language:** Python
- **Framework:** FastAPI (or similar ASGI framework, via Uvicorn)
- **Database layer:** Custom `database.py` and models for users, appointments, prescriptions, reports, etc.
- **Auth & security:** Token‑based authentication, role checks, and dedicated `auth.py` / `security.py` modules.

### Frontend

- **Framework:** React
- **Bundler:** Vite
- **Routing & context:**
  - Custom `App.jsx`, `AuthContext.jsx`, `ThemeContext.jsx`, `ProtectedRoute.jsx`
- **UI modules:**
  - `DoctorDashboard`, `AdminDashboard`, `LabAssistantDashboard`
  - `PatientProfile`, `PatientReports`, `PatientPrescriptions`
  - Shared components like `Navbar`, `AvailabilityScheduler`, `PrescriptionForm`, `LoadingSpinner`

### Dependencies

All Python dependencies are listed in `requirements.txt`. Frontend dependencies are managed via `package.json`.


`Create and activate a virtual environment, then install dependencies:`
`bash`
python -m venv venv
source venv/bin/activate       
pip install -r requirements.txt

``uvicorn main:app --reload``

``Frontend setup (React + Vite)``
From the frontend directory (or project root if Vite is there):

``bash``
npm install
npm run dev

### Contributors

``Debopriyo Karmaker``

``Nafiul Islam Nibir``

``Abdullah Bin Islam``

``Abir Raihan Shafat``

