import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { DashboardProvider } from './components/DashboardContext';
import CourseViewer from './components/CourseViewer';
import About from './components/About';

function App() {
  return (
    <DashboardProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/course/:courseName" element={<CourseViewer />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </DashboardProvider>
  );
}

export default App;

