import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePlayPage from './pages/GamePlayPage';
import StreamingPage from './pages/StreamingPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import PalzioCheckoutPage from './pages/PalzioCheckoutPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import EarnSharePage from './pages/EarnSharePage';
import { isAuthenticated } from './utils/authSession';
import { I18nProvider } from './i18n';

function ShellLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

function ProtectedLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <ShellLayout />;
}

function PublicLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

function LoginRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

function App() {
  return (
    <div className="App">
      <I18nProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
            </Route>
            <Route element={<ProtectedLayout />}>
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/history" element={<TransactionHistoryPage />} />
              <Route path="/pay/palzio" element={<PalzioCheckoutPage />} />
              <Route path="/gameplay" element={<GamePlayPage />} />
              <Route path="/streaming" element={<StreamingPage />} />
              <Route path="/earn-share" element={<EarnSharePage />} />
            </Route>
            <Route path="*" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/'} replace />} />
          </Routes>
        </Router>
      </I18nProvider>
    </div>
  );
}

export default App;
