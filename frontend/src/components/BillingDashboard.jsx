import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Zap, Info } from 'lucide-react';

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
    { 
      id: 'starter', 
      name: 'Starter', 
      price: '₹1,499', 
      features: ['Up to 1,000 Contacts', 'Up to 3 Team Agents', 'Basic Campaigns', 'Standard Email Support'] 
    },
    { 
      id: 'pro', 
      name: 'Pro', 
      price: '₹3,499', 
      popular: true,
      features: ['Up to 10,000 Contacts', 'Up to 10 Team Agents', 'Advanced Automations & Chatbots', 'Priority Support'] 
    },
    { 
      id: 'enterprise', 
      name: 'Enterprise', 
      price: '₹9,999', 
      features: ['Unlimited Contacts', 'Unlimited Agents', 'Custom Integrations', '24/7 Dedicated Support'] 
    }
  ];

  return (
    <div className="p-8 h-full bg-[#f8fafc] overflow-y-auto flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Billing & Plans</h1>
            <p className="text-gray-500 mt-2 text-lg">Manage your subscription and usage limits.</p>
          </div>
          {workspace?.stripe_customer_id && (
            <button 
              onClick={handleManageBilling}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition shadow-sm"
            >
              Manage Billing Portal
            </button>
          )}
        </div>

        {workspace?.subscription_status === 'past_due' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center shadow-sm">
            <Info className="w-5 h-5 mr-3 flex-shrink-0" />
            <strong>Action Required:</strong>&nbsp;Your subscription payment is past due. Please update your payment method to avoid service interruption.
          </div>
        )}

        {/* Current Plan Overview */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Plan</h2>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-extrabold text-gray-900 capitalize tracking-tight">{currentPlan}</div>
                {currentPlan === 'pro' && <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
              </div>
              {workspace?.current_period_end && workspace.subscription_status === 'active' && (
                <p className="text-sm text-gray-500 mt-3 font-medium">Renews on {new Date(workspace.current_period_end).toLocaleDateString()}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${
                workspace?.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                workspace?.subscription_status === 'canceled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {workspace?.subscription_status || 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Simple, transparent pricing</h3>
          <p className="text-gray-500 mt-3 text-lg">Choose the plan that best fits your business needs.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`rounded-3xl flex flex-col p-8 relative transition-all duration-200 hover:shadow-xl ${
                plan.popular 
                  ? 'bg-gradient-to-b from-blue-900 to-indigo-900 text-white shadow-lg transform md:-translate-y-2' 
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className={`text-xl font-semibold ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`ml-2 text-lg font-medium ${plan.popular ? 'text-blue-200' : 'text-gray-500'}`}>/mo</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-sm md:text-base font-medium">
                    <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-blue-300' : 'text-blue-600'}`} />
                    <span className={plan.popular ? 'text-gray-100' : 'text-gray-600'}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading || currentPlan === plan.id}
                className={`w-full py-4 px-4 rounded-xl font-bold transition-all duration-200 ${
                  currentPlan === plan.id 
                    ? (plan.popular ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                    : plan.popular 
                      ? 'bg-white text-indigo-900 hover:bg-gray-50 shadow-md'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {currentPlan === plan.id ? 'Current Plan' : `Get Started with ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Messaging Cost Disclaimer */}
        <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <p className="text-blue-900 font-medium flex items-center justify-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Important Note on Messaging Costs
          </p>
          <p className="text-blue-700 mt-2 text-sm max-w-3xl mx-auto leading-relaxed">
            Platform subscription fees do not include Meta's WhatsApp conversation charges. Messages are billed separately based on Meta's official country-wise rates plus a small margin. You will only pay for the conversations you initiate or receive outside the free tier.
          </p>
        </div>

      </div>
    </div>
  );
};

export default BillingDashboard;
