import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BrowsePage from './pages/BrowsePage';
import ReportItemPage from './pages/ReportItemPage';
import MyReportsPage from './pages/MyReportsPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import AuthContext from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/report-lost" element={<ReportItemPage type="Lost" />} />
          <Route path="/report-found" element={<ReportItemPage type="Found" />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
          <Route path="/items/:id" element={<ItemDetailsPage />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  );
};

export default App;
