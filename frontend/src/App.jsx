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
      <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
             </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            Secure Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your team passcode to access the inbox
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="glass-card py-8 px-4 sm:rounded-2xl sm:px-10 border border-white/10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="passcode" className="block text-sm font-medium text-gray-300">
                  Passcode
                </label>
                <div className="mt-2 relative">
                  <input
                    id="passcode"
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {error && <p className="mt-2 text-sm text-red-400 font-medium">{error}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f19] focus:ring-blue-500 transition-all duration-200 active:scale-[0.98]"
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
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-[#111827]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-white">WhatsApp SaaS</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`${
                    activeTab === 'inbox'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Inbox
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`${
                    activeTab === 'campaigns'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Campaigns
                </button>
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`${
                    activeTab === 'setup'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Setup
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
