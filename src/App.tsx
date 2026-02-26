import { Navigate, Route, Routes } from 'react-router-dom';
import SiteListPage from './pages/SiteListPage';
import SiteProfilePage from './pages/SiteProfilePage';
import SiteUpdatePage from './pages/SiteUpdatePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteListPage />} />
      <Route path="/site/:siteId" element={<SiteProfilePage />} />
      <Route path="/site/:siteId/update" element={<SiteUpdatePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
