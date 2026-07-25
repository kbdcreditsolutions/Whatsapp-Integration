import React, { useState } from 'react';
import axios from 'axios';

const MetaSetupWizard = ({ workspaceId }) => {
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState([]);

  React.useEffect(() => {
    if (!workspaceId) return;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
    fetch(`${backendUrl}/api/workspaces/team?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTeam(data);
      })
      .catch(console.error);
  }, [workspaceId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
      const res = await axios.post(`${backendUrl}/api/workspaces/update`, {
        workspace_id: workspaceId,
        meta_phone_number_id: phoneId,
        meta_waba_id: wabaId,
        meta_access_token: accessToken
      });

      if (res.data.success) {
        setStatus({ type: 'success', message: 'Credentials saved successfully!' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to save credentials.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden m-4 p-8 border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Meta WhatsApp API Setup Guide</h2>
      </div>

      <p className="text-gray-600 mb-8">
        Follow these steps to connect your own Meta WhatsApp Business account to the platform and avoid third-party API fees.
      </p>

      <div className="space-y-8">
        {/* Step 1 */}
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">1</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a Meta Developer App</h3>
            <p className="text-gray-600 mb-2">
              Go to the <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">Meta App Dashboard</a> and click <strong>Create App</strong>.
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-2 space-y-1 text-sm">
              <li>Select <strong>Other</strong> for your app use case.</li>
              <li>Select <strong>Business</strong> as the app type.</li>
              <li>Name your app and connect it to your Business Manager account.</li>
            </ul>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">2</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Add the WhatsApp Product</h3>
            <p className="text-gray-600 text-sm mb-3">
              On the "Add products to your app" page, scroll down to <strong>WhatsApp</strong> and click <strong>Set Up</strong>.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Important Setup Information:</p>
              <p className="text-sm text-gray-600">Meta will provide you with a temporary test phone number immediately. To use a real number, you will need to complete Business Verification.</p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">3</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Get Your API Credentials</h3>
            <p className="text-gray-600 text-sm mb-3">
              Navigate to <strong>WhatsApp &gt; API Setup</strong> in the left sidebar. You need two pieces of information:
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <span className="font-semibold text-gray-700">Phone Number ID</span>
                  <p className="text-xs text-gray-500">Found directly under the Send and Receive messages section.</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                <div>
                  <span className="font-semibold text-gray-700">Permanent Access Token</span>
                  <p className="text-xs text-gray-500">Do not use the Temporary Token. Go to Business Settings &gt; System Users to generate a permanent token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form to Save Credentials */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Credentials to Workspace</h3>
          {status.message && (
            <div className={`mb-4 p-3 rounded text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {status.message}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
              <input 
                type="text" 
                value={phoneId} 
                onChange={(e) => setPhoneId(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g. 101234567891011"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
              <input 
                type="text" 
                value={wabaId} 
                onChange={(e) => setWabaId(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g. 101234567891011"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required for Campaign Broadcasts and Template Sync.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Access Token</label>
              <input 
                type="password" 
                value={accessToken} 
                onChange={(e) => setAccessToken(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="EAAGm0..."
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={saving || !workspaceId}
              className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
            {!workspaceId && (
              <p className="text-xs text-red-500 mt-2 text-center">Cannot save: No workspace assigned to your account.</p>
            )}
          </form>
        </div>

        {/* Workspace Team */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Workspace Team</h3>
          <p className="text-sm text-gray-600 mb-4">These users have access to the Inbox for this workspace.</p>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {team.length > 0 ? team.map(member => (
                <li key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {(member.full_name || member.auth_email?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.full_name || 'No Name'}</p>
                      <p className="text-xs text-gray-500">{member.auth_email?.email || 'Unknown Email'}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {member.role || 'Agent'}
                  </span>
                </li>
              )) : (
                <li className="p-4 text-sm text-gray-500 text-center">No team members found.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaSetupWizard;
