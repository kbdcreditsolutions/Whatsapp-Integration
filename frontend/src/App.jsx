import React, { useState } from 'react'
import WhatsAppCampaignWidget from './components/WhatsAppCampaignWidget'
import MetaSetupWizard from './components/MetaSetupWizard'
import WhatsAppInbox from './components/WhatsAppInbox'

function App() {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'campaigns', 'setup'

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
