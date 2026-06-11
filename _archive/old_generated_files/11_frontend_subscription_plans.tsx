// frontend/src/components/Subscription/SubscriptionPlans.tsx
// Subscription plans and purchase component

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, SubscriptionPlan } from '../../api/client';
import './SubscriptionStyles.css';

interface PlanState {
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  loading: boolean;
  error: string;
  processing: boolean;
}

export const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<PlanState>({
    plans: [],
    selectedPlan: null,
    loading: true,
    error: '',
    processing: false,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: '' }));
      const plans = await apiClient.getSubscriptionPlans();
      setState((prev) => ({
        ...prev,
        plans,
        selectedPlan: plans[0] || null,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load plans',
      }));
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setState({ ...state, selectedPlan: plan });
  };

  const handlePurchase = async () => {
    if (!state.selectedPlan) return;

    setState({ ...state, processing: true, error: '' });

    try {
      const response = await apiClient.purchaseSubscription(state.selectedPlan.id);

      // Store transaction details for payment processing
      localStorage.setItem('pendingTransaction', JSON.stringify(response));

      // In a real app, you would redirect to payment gateway
      // For now, navigate to checkout
      navigate(`/checkout/${response.transaction_ref}`);
    } catch (error: any) {
      setState({
        ...state,
        processing: false,
        error: error.response?.data?.error || 'Purchase failed',
      });
    }
  };

  if (state.loading) {
    return <div className="subscription-container"><p>Loading plans...</p></div>;
  }

  return (
    <div className="subscription-container">
      <h1>Subscription Plans</h1>
      <p className="subtitle">Choose a plan that works for you</p>

      {state.error && <div className="error-banner">{state.error}</div>}

      <div className="plans-grid">
        {state.plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${state.selectedPlan?.id === plan.id ? 'selected' : ''}`}
            onClick={() => handleSelectPlan(plan)}
          >
            <h3>{plan.name}</h3>
            <p className="description">{plan.description}</p>

            <div className="price-section">
              <span className="price">{plan.price_afn}</span>
              <span className="currency">{plan.currency}</span>
              <span className="duration">/24 hours</span>
            </div>

            <div className="features">
              <h4>Features:</h4>
              <ul>
                {plan.features && Object.entries(plan.features).map(([key, value]) => (
                  <li key={key}>
                    ✓ {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                  </li>
                ))}
              </ul>
            </div>

            <button
              className={`btn-select ${
                state.selectedPlan?.id === plan.id ? 'selected' : ''
              }`}
              disabled={state.selectedPlan?.id === plan.id}
            >
              {state.selectedPlan?.id === plan.id ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      {state.selectedPlan && (
        <div className="purchase-section">
          <div className="purchase-summary">
            <h3>Order Summary</h3>
            <div className="summary-line">
              <span>{state.selectedPlan.name}</span>
              <span>{state.selectedPlan.price_afn} AFN</span>
            </div>
            <div className="summary-line">
              <span>Duration</span>
              <span>{state.selectedPlan.duration_hours} hours</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="amount">{state.selectedPlan.price_afn} AFN</span>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={state.processing}
            className="btn-purchase"
          >
            {state.processing ? 'Processing...' : 'Proceed to Payment'}
          </button>

          <p className="payment-info">
            💳 You will be redirected to our secure payment gateway
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
