import React from 'react'
import WhatsAppCampaignWidget from './components/WhatsAppCampaignWidget'
import MetaSetupWizard from './components/MetaSetupWizard'
import WhatsAppInbox from './components/WhatsAppInbox'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            SaaS Multi-Provider WhatsApp Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Embed this widget in your SaaS to let users trigger campaigns via Interakt or Meta.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: The Setup Wizard */}
          <div>
            <MetaSetupWizard />
          </div>

          {/* Right Column: The Sending Widget */}
          <div className="sticky top-12">
            <WhatsAppCampaignWidget backendUrl={import.meta.env.DEV ? "http://localhost:3001" : ""} />
          </div>
        </div>
        
        {/* Full Width Row: WhatsApp Inbox */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Live WhatsApp Inbox</h2>
          <WhatsAppInbox backendUrl={import.meta.env.DEV ? "http://localhost:3001" : ""} />
        </div>
      </div>
    </div>
  )
}

export default App
