import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CampaignDashboard = ({ workspaceId }) => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'templates'
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

  // Campaign Wizard State
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [audienceTag, setAudienceTag] = useState('');

  // Template Creation State
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('MARKETING');

  useEffect(() => {
    if (workspaceId) {
      fetchTemplates();
      fetchCampaigns();
    }
  }, [workspaceId]);

  const fetchTemplates = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/templates?workspace_id=${workspaceId}`);
      setTemplates(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/campaigns?workspace_id=${workspaceId}`);
      setCampaigns(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSyncTemplates = async () => {
    setSyncing(true);
    try {
      const res = await axios.get(`${backendUrl}/api/meta/templates/sync?workspace_id=${workspaceId}`);
      alert(`Successfully synced ${res.data.count} templates.`);
      fetchTemplates();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic text template for MVP
      const components = [{ type: "BODY", text: newTemplateBody }];
      await axios.post(`${backendUrl}/api/meta/templates`, {
        workspace_id: workspaceId,
        name: newTemplateName.toLowerCase().replace(/\s+/g, '_'),
        language: 'en_US',
        category: newTemplateCategory,
        components
      });
      alert('Template submitted for approval!');
      setIsCreatingTemplate(false);
      setNewTemplateName('');
      setNewTemplateBody('');
      fetchTemplates();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tags = audienceTag ? [audienceTag] : [];
      await axios.post(`${backendUrl}/api/campaigns`, {
        workspace_id: workspaceId,
        name: newCampaignName,
        template_id: selectedTemplateId,
        audience_tags: tags
      });
      setIsCreatingCampaign(false);
      setNewCampaignName('');
      setAudienceTag('');
      setSelectedTemplateId('');
      fetchCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to launch this campaign to all matching contacts?')) return;
    try {
      await axios.post(`${backendUrl}/api/campaigns/${campaignId}/launch`, {
        workspace_id: workspaceId,
        variable_mapping: {} // No variables mapped in MVP UI
      });
      alert('Campaign launched!');
      fetchCampaigns();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to launch campaign');
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-center text-gray-500">Please select a workspace.</div>;
  }

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Broadcasts & Campaigns</h1>
        <div className="flex space-x-2 bg-white p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'campaigns' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'templates' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Templates
          </button>
        </div>
      </div>

      {activeTab === 'campaigns' && (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Campaigns</h2>
            <button onClick={() => setIsCreatingCampaign(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
              Create Campaign
            </button>
          </div>
          
          {isCreatingCampaign && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">New Campaign</h3>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <input required type="text" placeholder="Campaign Name" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} className="w-full px-3 py-2 border rounded" />
                <select required value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="">Select a Template</option>
                  {templates.filter(t => t.status === 'APPROVED').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <input type="text" placeholder="Audience Tag (e.g. VIP)" value={audienceTag} onChange={e => setAudienceTag(e.target.value)} className="w-full px-3 py-2 border rounded" />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsCreatingCampaign(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Save Draft'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Audience</th>
                  <th className="p-4">Analytics</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{c.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : c.status === 'SENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{c.audience_tags?.length > 0 ? c.audience_tags.join(', ') : 'All Contacts'}</td>
                    <td className="p-4 text-sm text-gray-500">
                      <div>Sent: {c.analytics?.sent || 0}</div>
                      <div>Failed: {c.analytics?.failed || 0}</div>
                    </td>
                    <td className="p-4">
                      {c.status === 'DRAFT' && (
                        <button onClick={() => handleLaunchCampaign(c.id)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                          Launch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No campaigns found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Message Templates</h2>
            <div className="flex space-x-2">
              <button onClick={() => setIsCreatingTemplate(true)} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                Create Template
              </button>
              <button onClick={handleSyncTemplates} disabled={syncing} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                {syncing ? 'Syncing...' : 'Sync from Meta'}
              </button>
            </div>
          </div>

          {isCreatingTemplate && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">New Meta Template</h3>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <input required type="text" placeholder="Template Name (e.g. welcome_msg)" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="w-full px-3 py-2 border rounded" />
                <select required value={newTemplateCategory} onChange={e => setNewTemplateCategory(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
                <textarea required placeholder="Template Body (e.g. Hello, this is a test message!)" value={newTemplateBody} onChange={e => setNewTemplateBody(e.target.value)} className="w-full px-3 py-2 border rounded h-24" />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsCreatingTemplate(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Submitting...' : 'Submit to Meta'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800 text-lg truncate">{t.name}</h3>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    t.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    t.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2 uppercase font-medium tracking-wide flex justify-between">
                  <span>{t.category}</span>
                  <span>{t.language}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 line-clamp-4 border border-gray-100 mt-3 whitespace-pre-wrap">
                  {t.components?.find(c => c.type === 'BODY')?.text || 'No Body'}
                </div>
              </div>
            ))}
            {templates.length === 0 && (
               <div className="col-span-full p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-xl">
                 No templates found. Click "Sync from Meta" to pull your existing templates.
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDashboard;
