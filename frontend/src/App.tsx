import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePlayPage from './pages/GamePlayPage';
import StreamingPage from './pages/StreamingPage';
import DashboardPage from './pages/DashboardPage';
import { isAuthenticated } from './utils/authSession';

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

function LoginRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/streaming" element={<StreamingPage />} />
            <Route path="/gameplay" element={<GamePlayPage />} />
          </Route>
          <Route path="*" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
