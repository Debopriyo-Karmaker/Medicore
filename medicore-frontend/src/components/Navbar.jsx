// src/components/Navbar.jsx
import './Navbar.css';
import {
  Navbar as BSNavbar,
  Nav,
  Container,
  Button,
  Dropdown,
  Badge,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaCalendarAlt,
  FaUserCircle,
  FaFileAlt,
  FaPills,
  FaMoon,
  FaSun,
} from 'react-icons/fa';
import { USER_ROLES } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.PATIENT:
        return 'Patient';
      case USER_ROLES.DOCTOR:
        return 'Doctor';
      case USER_ROLES.LAB_ASSISTANT:
        return 'Lab Assistant';
      case USER_ROLES.ADMIN:
        return 'Admin';
      default:
        return role;
    }
  };

  return (
    <header className="app-navbar-wrapper">
      <BSNavbar
        expand="lg"
        bg="transparent"
        variant={isDark ? 'dark' : 'light'}
        className={`app-navbar ${isDark ? 'app-navbar-dark' : 'app-navbar-light'}`}
      >
        <Container>
          {/* Brand with modern floating logo */}
          <BSNavbar.Brand as={Link} to="/" className="app-navbar-brand">
            <div className="app-navbar-logo-orbit">
              <div className="app-navbar-logo-circle">
                <span className="app-navbar-logo-text">M</span>
                <span className="app-navbar-logo-plus">+</span>
              </div>
            </div>
            <div className="app-navbar-brand-text">
              <span className="app-navbar-title">Medicore</span>
              <small className="app-navbar-tagline">
                Where every record meets precision
              </small>
            </div>
          </BSNavbar.Brand>

          {/* Theme toggle + burger */}
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="app-theme-toggle"
            >
              {isDark ? <FaSun /> : <FaMoon />}
            </Button>

            <BSNavbar.Toggle aria-controls="main-navbar" />
          </div>

          <BSNavbar.Collapse id="main-navbar">
            <Nav className="ms-auto align-items-center gap-2 app-navbar-links">
              {user ? (
                <>
                  {/* Home */}
                  <Nav.Link as={Link} to="/" className="app-navbar-link">
                    <FaHome className="me-1" /> Home
                  </Nav.Link>

                  {/* Patient links */}
                  {user.role === USER_ROLES.PATIENT && (
                    <>
                      <Nav.Link
                        as={Link}
                        to="/patient/profile"
                        className="app-navbar-link"
                      >
                        <FaUserCircle className="me-1" /> Profile
                      </Nav.Link>
                      <Nav.Link
                        as={Link}
                        to="/patient/appointments"
                        className="app-navbar-link"
                      >
                        <FaCalendarAlt className="me-1" /> Appointments
                      </Nav.Link>
                      <Nav.Link
                        as={Link}
                        to="/patient/prescriptions"
                        className="app-navbar-link"
                      >
                        <FaPills className="me-1" /> Prescriptions
                      </Nav.Link>
                      <Nav.Link
                        as={Link}
                        to="/patient/reports"
                        className="app-navbar-link"
                      >
                        <FaFileAlt className="me-1" /> Reports
                      </Nav.Link>
                    </>
                  )}

                  {/* Doctor links */}
                  {user.role === USER_ROLES.DOCTOR && (
                    <Nav.Link
                      as={Link}
                      to="/doctor/dashboard"
                      className="app-navbar-link"
                    >
                      <FaCalendarAlt className="me-1" /> Dashboard
                    </Nav.Link>
                  )}

                  {/* Lab Assistant links */}
                  {user.role === USER_ROLES.LAB_ASSISTANT && (
                    <>
                      <Nav.Link
                        as={Link}
                        to="/lab/dashboard"
                        className="app-navbar-link"
                      >
                        <FaCalendarAlt className="me-1" /> Dashboard
                      </Nav.Link>
                      <Nav.Link
                        as={Link}
                        to="/lab/profile"
                        className="app-navbar-link"
                      >
                        <FaUserCircle className="me-1" /> Profile
                      </Nav.Link>
                    </>
                  )}

                  {/* Admin links */}
                  {user.role === USER_ROLES.ADMIN && (
                    <Nav.Link
                      as={Link}
                      to="/admin/dashboard"
                      className="app-navbar-link"
                    >
                      <FaCalendarAlt className="me-1" /> Dashboard
                    </Nav.Link>
                  )}

                  {/* User dropdown */}
                  <Dropdown align="end" className="ms-2">
                    <Dropdown.Toggle
                      id="user-dropdown"
                      className="app-navbar-user-toggle d-flex align-items-center gap-2"
                    >
                      <FaUser />
                      <span className="d-none d-md-inline">
                        {user.full_name}
                      </span>
                      <Badge
                        bg="secondary"
                        className="text-uppercase app-navbar-role-badge"
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </Dropdown.Toggle>

                    <Dropdown.Menu
                      className={`app-navbar-user-menu ${
                        isDark ? 'app-navbar-user-menu-dark' : ''
                      }`}
                    >
                      <Dropdown.ItemText>
                        <div className="fw-semibold">{user.full_name}</div>
                        <div className="small text-muted">{user.email}</div>
                      </Dropdown.ItemText>
                      <Dropdown.Divider />
                      <Dropdown.Item
                        onClick={handleLogout}
                        className="d-flex align-items-center gap-2"
                      >
                        <FaSignOutAlt /> Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login" className="app-navbar-link">
                    Login
                  </Nav.Link>
                  <Button
                    as={Link}
                    to="/register"
                    size="sm"
                    className="app-navbar-register-btn ms-1"
                  >
                    Register
                  </Button>
                </>
              )}
            </Nav>
          </BSNavbar.Collapse>
        </Container>
      </BSNavbar>
    </header>
  );
};

export default Navbar;
