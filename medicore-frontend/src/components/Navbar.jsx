import { Navbar as BSNavbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaHome, FaCalendarAlt, FaUserCircle } from 'react-icons/fa';
import { USER_ROLES } from '../utils/constants';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold">
          <span className="text-white">Medicore</span>
          <small className="d-block" style={{ fontSize: '0.7rem', marginTop: '-5px' }}>
            Where Every Record Meets Precision
          </small>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {user ? (
              <>
                <Nav.Link as={Link} to="/" className="text-white">
                  <FaHome className="me-1" /> Home
                </Nav.Link>
                
                {user.role === USER_ROLES.PATIENT && (
                  <>
                    <Nav.Link as={Link} to="/patient/profile" className="text-white">
                      <FaUserCircle className="me-1" /> Profile
                    </Nav.Link>
                    <Nav.Link as={Link} to="/patient/appointments" className="text-white">
                      <FaCalendarAlt className="me-1" /> Appointments
                    </Nav.Link>
                  </>
                )}
                
                {user.role === USER_ROLES.DOCTOR && (
                  <>
                    <Nav.Link as={Link} to="/doctor/dashboard" className="text-white">
                      <FaCalendarAlt className="me-1" /> Dashboard
                    </Nav.Link>
                  </>
                )}
                
                <Dropdown align="end" className="ms-3">
                  <Dropdown.Toggle variant="light" id="user-dropdown">
                    <FaUser className="me-2" />
                    {user.full_name}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.ItemText>
                      <strong>{user.email}</strong>
                      <br />
                      <small className="text-muted">Role: {user.role}</small>
                    </Dropdown.ItemText>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" />
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="text-white">
                  Login
                </Nav.Link>
                <Button
                  as={Link}
                  to="/register"
                  variant="light"
                  size="sm"
                  className="ms-2"
                >
                  Register
                </Button>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;