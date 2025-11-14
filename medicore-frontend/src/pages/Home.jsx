import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserMd, FaUser, FaCalendarCheck, FaFileAlt } from 'react-icons/fa';
import { USER_ROLES } from '../utils/constants';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaUser size={40} />,
      title: 'Patient Profile Management',
      description: 'Maintain comprehensive personal and medical data with unique patient IDs'
    },
    {
      icon: <FaUserMd size={40} />,
      title: 'Doctor Verification',
      description: 'Verified doctors with hospital email authentication'
    },
    {
      icon: <FaCalendarCheck size={40} />,
      title: 'Appointment Booking',
      description: 'Easy appointment scheduling with real-time status updates'
    },
    {
      icon: <FaFileAlt size={40} />,
      title: 'Medical Records',
      description: 'Access your complete medical history, allergies, and prescriptions'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col md={6}>
              <h1 className="display-4 fw-bold mb-4">Welcome to Medicore</h1>
              <p className="lead mb-4">Where Every Record Meets Precision</p>
              <p className="mb-4">
                Your comprehensive digital healthcare management system. 
                Manage patient records, book appointments, and access medical history - all in one place.
              </p>
              {!user ? (
                <div>
                  <Button
                    as={Link}
                    to="/register"
                    variant="light"
                    size="lg"
                    className="me-3"
                  >
                    Get Started
                  </Button>
                  <Button
                    as={Link}
                    to="/login"
                    variant="outline-light"
                    size="lg"
                  >
                    Login
                  </Button>
                </div>
              ) : (
                <div>
                  {user.role === USER_ROLES.PATIENT && (
                    <Button
                      as={Link}
                      to="/patient/profile"
                      variant="light"
                      size="lg"
                    >
                      Go to My Profile
                    </Button>
                  )}
                  {user.role === USER_ROLES.DOCTOR && (
                    <Button
                      as={Link}
                      to="/doctor/dashboard"
                      variant="light"
                      size="lg"
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </div>
              )}
            </Col>
            <Col md={6} className="text-center">
              <div className="hero-image">
                <FaUserMd size={200} className="text-white opacity-75" />
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Our Features</h2>
        <Row>
          {features.map((feature, index) => (
            <Col md={6} lg={3} key={index} className="mb-4">
              <Card className="h-100 text-center shadow-sm hover-card">
                <Card.Body>
                  <div className="text-primary mb-3">{feature.icon}</div>
                  <Card.Title className="h5">{feature.title}</Card.Title>
                  <Card.Text className="text-muted">
                    {feature.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* CTA Section */}
      {!user && (
        <div className="bg-light py-5">
          <Container>
            <Row className="justify-content-center text-center">
              <Col md={8}>
                <h3 className="mb-4">Ready to Get Started?</h3>
                <p className="mb-4">
                  Join thousands of patients and healthcare professionals using Medicore
                </p>
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  size="lg"
                >
                  Create Your Account
                </Button>
              </Col>
            </Row>
          </Container>
        </div>
      )}
    </div>
  );
};

export default Home;