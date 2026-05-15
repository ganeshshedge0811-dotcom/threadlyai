import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingScreen from './screens/OnboardingScreen';
import InboxScreen from './screens/InboxScreen';
import ApprovedQueueScreen from './screens/ApprovedQueueScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import BillingScreen from './screens/BillingScreen';
import LandingPage from './screens/LandingPage';
import AuthScreen from './screens/AuthScreen';
import AdminScreen from './screens/AdminScreen';
import NotFoundScreen from './screens/NotFoundScreen';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - outside the dashboard layout */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        
        {/* Dashboard routes - protected and wrapped in Layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard/inbox" replace />} />
            <Route path="onboarding" element={<OnboardingScreen />} />
            <Route path="inbox" element={<InboxScreen />} />
            <Route path="approved" element={<ApprovedQueueScreen />} />
            <Route path="analytics" element={<AnalyticsScreen />} />
            <Route path="billing" element={<BillingScreen />} />
          </Route>
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
