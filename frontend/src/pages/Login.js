import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const callbackRef = useRef(null);
  callbackRef.current = async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured. Set REACT_APP_GOOGLE_CLIENT_ID.');
      return;
    }
    const handleCredential = (response) => {
      if (callbackRef.current) callbackRef.current(response);
    };
    if (typeof window.google === 'undefined') {
      const checkGoogle = () => {
        if (typeof window.google !== 'undefined' && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredential,
            auto_select: false,
          });
          if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
              type: 'standard',
              theme: 'filled_blue',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
            });
          }
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
    });
    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
      });
    }
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign in</h2>
        <p className="auth-subtitle">Use your Google account to continue</p>
        {error && <div className="error">{error}</div>}
        <div className="google-signin-wrapper">
          {GOOGLE_CLIENT_ID ? (
            <div
              ref={buttonRef}
              className="google-button-container"
              style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
            />
          ) : (
            <p className="error">REACT_APP_GOOGLE_CLIENT_ID is not set.</p>
          )}
        </div>
        {loading && <p className="auth-loading">Signing in...</p>}
      </div>
    </div>
  );
};

export default Login;
