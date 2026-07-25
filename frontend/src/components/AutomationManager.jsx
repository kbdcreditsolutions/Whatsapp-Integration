import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AutomationManager = ({ workspaceId }) => {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('keyword');
  const [keywords, setKeywords] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

  useEffect(() => {
    if (workspaceId) {
      fetchAutomations();
    }
  }, [workspaceId]);

  const fetchAutomations = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/automations?workspace_id=${workspaceId}`);
      setAutomations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trigger_config = triggerType === 'keyword' 
        ? { keywords: keywords.split(',').map(k => k.trim()).filter(k => k) }
        : {};
      
      const action_config = { message: replyMessage };

      await axios.post(`${backendUrl}/api/automations`, {
        workspace_id: workspaceId,
        name,
        trigger_type: triggerType,
        trigger_config,
        action_config,
        is_active: true
      });
      
      setIsCreating(false);
      setName('');
      setKeywords('');
      setReplyMessage('');
      fetchAutomations();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create automation');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await axios.put(`${backendUrl}/api/automations/${id}`, { is_active: !currentStatus });
      fetchAutomations();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteRule = async (id) => {
    if(!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await axios.delete(`${backendUrl}/api/automations/${id}`);
      fetchAutomations();
    } catch (error) {
      console.error(error);
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-center text-gray-500">Please select a workspace.</div>;
  }

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Automation Rules</h1>
        <button 
          onClick={() => setIsCreating(true)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Create Rule
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">New Auto-Reply Rule</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <input required type="text" placeholder="e.g. Pricing Inquiry" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
              <select required value={triggerType} onChange={e => setTriggerType(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                <option value="keyword">Keyword Match</option>
                <option value="out_of_office">Out of Office (Always on if active)</option>
              </select>
            </div>
            
            {triggerType === 'keyword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (Comma separated)</label>
                <input required type="text" placeholder="e.g. price, cost, pricing" value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Reply Message</label>
              <textarea required placeholder="Type the message to send automatically..." value={replyMessage} onChange={e => setReplyMessage(e.target.value)} className="w-full px-3 py-2 border rounded h-24 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{loading ? 'Saving...' : 'Save Rule'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Status</th>
              <th className="p-4">Rule Name</th>
              <th className="p-4">Trigger</th>
              <th className="p-4">Response</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {automations.map(rule => (
              <tr key={rule.id} className={`transition-colors ${rule.is_active ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-75'}`}>
                <td className="p-4">
                  <button 
                    onClick={() => toggleActive(rule.id, rule.is_active)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${rule.is_active ? 'translate-x-4.5' : 'translate-x-1'}`} style={{ transform: rule.is_active ? 'translateX(18px)' : 'translateX(2px)' }}/>
                  </button>
                </td>
                <td className="p-4 font-medium text-gray-800">{rule.name}</td>
                <td className="p-4 text-sm text-gray-600">
                  <span className="font-semibold uppercase text-xs text-gray-500">{rule.trigger_type.replace(/_/g, ' ')}</span>
                  {rule.trigger_type === 'keyword' && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rule.trigger_config?.keywords?.map((k, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">{k}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-500 truncate max-w-[200px]" title={rule.action_config?.message}>
                  {rule.action_config?.message}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => deleteRule(rule.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {automations.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">No automation rules yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AutomationManager;
