import React, { useState } from 'react'
import WhatsAppCampaignWidget from './components/WhatsAppCampaignWidget'
import MetaSetupWizard from './components/MetaSetupWizard'
import WhatsAppInbox from './components/WhatsAppInbox'

function App() {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'campaigns', 'setup'
  
  // Dashboard Security: Persist across refreshes
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (!import.meta.env.VITE_DASHBOARD_PASSCODE) return true;
    return localStorage.getItem('whatsapp_saas_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === import.meta.env.VITE_DASHBOARD_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('whatsapp_saas_auth', 'true');
      setError('');
    } else {
      setError('Incorrect passcode');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">WhatsApp SaaS</h1>
              <div className="flex gap-1">
                <button 
                  onClick={() => setActiveTab('inbox')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                >
                  Inbox
                </button>
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'campaigns' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                >
                  Campaigns
                </button>
                <button 
                  onClick={() => setActiveTab('setup')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'setup' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                >
                  Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inbox' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">Live WhatsApp Inbox</h2>
            {!isAuthenticated ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-sm mx-auto text-center mt-12">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Inbox Locked</h3>
                <p className="text-gray-500 text-sm mb-6">Enter your passcode to view live messages</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <input 
                    type="password" 
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Passcode" 
                    className="w-full bg-[#f5f5f7] border-0 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-center text-lg tracking-widest"
                    autoFocus
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-medium transition-colors"
                  >
                    Unlock
                  </button>
                </form>
              </div>
            ) : (
              <WhatsAppInbox backendUrl={import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')} />
            )}
          </div>
        )}
        
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send Campaigns</h2>
            <WhatsAppCampaignWidget backendUrl={import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')} />
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Meta & Interakt Setup</h2>
            <MetaSetupWizard />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
