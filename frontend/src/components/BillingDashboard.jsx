import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BillingDashboard = ({ workspace, onWorkspaceUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

  useEffect(() => {
    if (workspace && workspace.plan_type) {
      setCurrentPlan(workspace.plan_type);
    } else {
      setCurrentPlan('free');
    }
  }, [workspace]);

  const handleSubscribe = async (planType) => {
    if (!workspace?.id) return alert('Workspace not loaded.');
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/stripe/create-checkout-session`, {
        workspace_id: workspace.id,
        plan_type: planType,
        success_url: window.location.origin + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: window.location.origin
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!workspace?.id) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/stripe/create-portal-session`, {
        workspace_id: workspace.id,
        return_url: window.location.origin
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'starter', name: 'Starter', price: '$29', features: ['Up to 1,000 Contacts', 'Basic Campaigns', 'Standard Support'] },
    { id: 'pro', name: 'Pro', price: '$99', features: ['Up to 10,000 Contacts', 'Advanced Automations', 'Priority Support'], popular: true },
    { id: 'enterprise', name: 'Enterprise', price: '$299', features: ['Unlimited Contacts', 'Custom Flows', '24/7 Phone Support'] }
  ];

  return (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Billing & Plans</h1>
            <p className="text-gray-500 mt-2">Manage your subscription and usage limits.</p>
          </div>
          {workspace?.stripe_customer_id && (
            <button 
              onClick={handleManageBilling}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition"
            >
              Manage Billing Portal
            </button>
          )}
        </div>

        {workspace?.subscription_status === 'past_due' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
            <strong>Action Required:</strong> Your subscription payment is past due. Please update your payment method to avoid service interruption.
          </div>
        )}

        {/* Current Plan Overview */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Current Plan</h2>
              <div className="text-4xl font-bold text-gray-900 mt-2 capitalize">{currentPlan}</div>
              {workspace?.current_period_end && workspace.subscription_status === 'active' && (
                <p className="text-sm text-gray-500 mt-2">Renews on {new Date(workspace.current_period_end).toLocaleDateString()}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                workspace?.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                workspace?.subscription_status === 'canceled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {workspace?.subscription_status || 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Available Plans</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border flex flex-col p-8 relative ${plan.popular ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">/mo</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-600 text-sm">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading || currentPlan === plan.id}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition ${
                  currentPlan === plan.id 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.popular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                }`}
              >
                {currentPlan === plan.id ? 'Current Plan' : `Subscribe to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default BillingDashboard;
