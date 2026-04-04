import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App';
import AboutPage from '../pages/AboutPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/erp/dashboard" replace />} />
      <Route path="/erp/:section" element={<App />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
