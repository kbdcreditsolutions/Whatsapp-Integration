import React, { useState } from 'react'
import WhatsAppCampaignWidget from './components/WhatsAppCampaignWidget'
import MetaSetupWizard from './components/MetaSetupWizard'
import WhatsAppInbox from './components/WhatsAppInbox'

function App() {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'campaigns', 'setup'
  
  // Dashboard Security: Simple Passcode
  const [isAuthenticated, setIsAuthenticated] = useState(
    !import.meta.env.VITE_DASHBOARD_PASSCODE // Automatically authenticate if no passcode is set
  );
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === import.meta.env.VITE_DASHBOARD_PASSCODE) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect passcode');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Secure Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your team passcode to access the inbox.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="passcode" className="block text-sm font-medium text-gray-700">
                  Passcode
                </label>
                <div className="mt-1">
                  <input
                    id="passcode"
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Enter Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">WhatsApp SaaS</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`${
                    activeTab === 'inbox'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Live Inbox
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`${
                    activeTab === 'campaigns'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Send Campaigns
                </button>
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`${
                    activeTab === 'setup'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  API Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'inbox' && (
          <div className="fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Live WhatsApp Inbox</h2>
            <WhatsAppInbox backendUrl={import.meta.env.DEV ? "http://localhost:3001" : ""} />
          </div>
        )}
        
        {activeTab === 'campaigns' && (
          <div className="max-w-2xl mx-auto fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Campaigns</h2>
            <WhatsAppCampaignWidget backendUrl={import.meta.env.DEV ? "http://localhost:3001" : ""} />
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="max-w-3xl mx-auto fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Meta & Interakt Setup</h2>
            <MetaSetupWizard />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
