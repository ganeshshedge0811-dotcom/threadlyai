import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';

const NotFoundScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-dark)', fontFamily: 'var(--font-family)', padding: '2rem',
      backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(0,210,106,0.06) 0%, transparent 60%)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{
          fontSize: '8rem', fontWeight: 800, lineHeight: 1,
          background: 'linear-gradient(135deg, var(--primary-green), #00b4d8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>404</div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Shield size={20} color="var(--primary-green)" />
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>ThreadlyAI</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            <Home size={16} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundScreen;
