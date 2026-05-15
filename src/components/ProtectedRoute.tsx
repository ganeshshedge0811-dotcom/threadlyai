import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' 
      }}>
        <div className="logo-icon" style={{ marginBottom: '1.5rem' }}>
          <Shield size={32} color="var(--primary-green)" />
        </div>
        <div style={{ width: '160px', height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary-green), #00b4d8)',
            borderRadius: '2px',
            animation: 'authProgress 1.5s ease-in-out forwards'
          }} />
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Loading your workspace...
        </p>
        <style>{`
          @keyframes authProgress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
