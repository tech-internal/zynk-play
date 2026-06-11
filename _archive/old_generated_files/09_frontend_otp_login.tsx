// frontend/src/components/Auth/OTPLogin.tsx
// OTP-based login component

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import './AuthStyles.css';

interface LoginStep {
  phoneNumber: string;
  otpCode: string;
  sentOTP: boolean;
  loading: boolean;
  error: string;
}

export const OTPLogin: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<LoginStep>({
    phoneNumber: '',
    otpCode: '',
    sentOTP: false,
    loading: false,
    error: '',
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, phoneNumber: e.target.value, error: '' });
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, otpCode: e.target.value, error: '' });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ ...state, loading: true, error: '' });

    try {
      if (!state.phoneNumber || state.phoneNumber.length < 9) {
        throw new Error('Please enter a valid phone number');
      }

      await apiClient.sendOTP(state.phoneNumber);
      setState({ ...state, sentOTP: true, loading: false });
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.response?.data?.error || error.message || 'Failed to send OTP',
      });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ ...state, loading: true, error: '' });

    try {
      if (!state.otpCode || state.otpCode.length !== 6) {
        throw new Error('Please enter a 6-digit OTP');
      }

      const response = await apiClient.verifyOTP(state.phoneNumber, state.otpCode);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/dashboard');
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.response?.data?.error || error.message || 'Invalid OTP',
      });
    }
  };

  const handleBackToPhone = () => {
    setState({
      ...state,
      sentOTP: false,
      otpCode: '',
      error: '',
    });
  };

  if (!state.sentOTP) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Entertainment Platform</h1>
          <p className="subtitle">Login with OTP</p>

          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label htmlFor="phone">Mobile Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g., +93701234567"
                value={state.phoneNumber}
                onChange={handlePhoneChange}
                disabled={state.loading}
              />
            </div>

            {state.error && <div className="error-message">{state.error}</div>}

            <button type="submit" disabled={state.loading} className="btn-primary">
              {state.loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <p className="info-text">
            We'll send a 6-digit code to your mobile number
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Verify OTP</h1>
        <p className="subtitle">Enter the 6-digit code sent to {state.phoneNumber}</p>

        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              id="otp"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={state.otpCode}
              onChange={handleOTPChange}
              disabled={state.loading}
              className="otp-input"
            />
          </div>

          {state.error && <div className="error-message">{state.error}</div>}

          <button type="submit" disabled={state.loading} className="btn-primary">
            {state.loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <button onClick={handleBackToPhone} className="btn-secondary">
          Back
        </button>
      </div>
    </div>
  );
};

export default OTPLogin;
