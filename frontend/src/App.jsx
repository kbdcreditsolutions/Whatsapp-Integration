import React, { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from './supabaseClient'
import CampaignDashboard from './components/CampaignDashboard'
import MetaSetupWizard from './components/MetaSetupWizard'
import WhatsAppInbox from './components/WhatsAppInbox'
import ContactManager from './components/ContactManager'

function App() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [session, setSession] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setLoadingWorkspace(true);
      // Fetch workspace ID from profile
      supabase
        .from('profiles')
        .select('workspace_id')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setWorkspaceId(data.workspace_id);
          } else if (error) {
            console.error('Error fetching profile:', error.message);
          }
          setLoadingWorkspace(false);
        });
    } else {
      setWorkspaceId(null);
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">WhatsApp SaaS</h1>
            <p className="text-sm text-gray-500 mt-2">Sign in to access your workspace</p>
          </div>
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
          />
        </div>
      </div>
    );
  }

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
                  onClick={() => setActiveTab('contacts')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'contacts' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                >
                  Contacts
                </button>
                <button 
                  onClick={() => setActiveTab('setup')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'setup' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                >
                  Setup
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{session.user.email}</span>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingWorkspace ? (
          <div className="text-center py-20">Loading workspace...</div>
        ) : !workspaceId ? (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200">
            <strong>No workspace assigned.</strong> Please contact an administrator to link your account to a workspace.
          </div>
        ) : (
          <>
            {activeTab === 'inbox' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-tight">Live WhatsApp Inbox</h2>
                <WhatsAppInbox 
                  backendUrl={import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')} 
                  workspaceId={workspaceId}
                  userId={session.user.id}
                />
              </div>
            )}
            
            {activeTab === 'campaigns' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 md:p-8">
                <CampaignDashboard workspaceId={workspaceId} />
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="mb-6">
                <ContactManager 
                  backendUrl={import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')} 
                  workspaceId={workspaceId} 
                />
              </div>
            )}

            {activeTab === 'setup' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Meta & Interakt Setup</h2>
                <MetaSetupWizard workspaceId={workspaceId} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
