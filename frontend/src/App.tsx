import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import AppBottomNav from './components/AppBottomNav';
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
import { EntitlementsProvider } from './context/EntitlementsContext';

function ShellLayout() {
  return (
    <EntitlementsProvider>
      <Header />
      <Outlet />
      <AppBottomNav />
    </EntitlementsProvider>
  );
}

function AuthGate() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function LoginRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

function HomeRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <HomePage />;
}

function App() {
  return (
    <div className="App">
      <I18nProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/" element={<HomeRoute />} />
            <Route element={<AuthGate />}>
              <Route element={<ShellLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/home" element={<Navigate to="/dashboard" replace />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/history" element={<TransactionHistoryPage />} />
                <Route path="/pay/palzio" element={<PalzioCheckoutPage />} />
                <Route path="/gameplay" element={<GamePlayPage />} />
                <Route path="/streaming" element={<StreamingPage />} />
                <Route path="/earn-share" element={<EarnSharePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/'} replace />} />
          </Routes>
        </Router>
      </I18nProvider>
    </div>
  );
}

export default App;
