import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth';
import LoginPage from './pages/LoginPage';
import SiteListPage from './pages/SiteListPage';
import SiteProfilePage from './pages/SiteProfilePage';
import SiteUpdatePage from './pages/SiteUpdatePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<SiteListPage />} />
        <Route path="/site/:siteCode" element={<SiteProfilePage />} />
        <Route path="/site/:siteCode/update" element={<SiteUpdatePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
