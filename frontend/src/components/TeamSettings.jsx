import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function TeamSettings({ workspaceId }) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteLink, setInviteLink] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchTeam = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
      
      const response = await fetch(`${baseUrl}/api/team/members`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setMembers(data.members || []);
        setInvites(data.invites || []);
      }
    } catch (err) {
      console.error('Failed to fetch team', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [workspaceId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteLink('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
      
      const response = await fetch(`${baseUrl}/api/team/invite`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      const data = await response.json();
      if (response.ok && data.invitation) {
        // Construct the full invite URL
        const link = `${window.location.origin}/?invite=${data.invitation.token}`;
        setInviteLink(link);
        setInviteEmail('');
        fetchTeam(); // Refresh invites list
      } else {
        alert('Failed to generate invite: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error creating invite.');
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  if (loading) return <div>Loading team data...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Team Management</h2>
        <p className="text-sm text-gray-500 mt-1">Manage workspace members and their roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Roster */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Active Members</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {members.map(m => (
                <li key={m.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.email}</p>
                    <p className="text-xs text-gray-500">Joined {new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    m.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    m.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {invites.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Pending Invites</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {invites.map(inv => (
                  <li key={inv.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                      <p className="text-xs text-orange-500">Expires in 7 days</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      {inv.role} (Pending)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col: Invite Form */}
        <div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Invite New Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="agent@company.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="agent">Agent (Inbox & Contacts only)</option>
                  <option value="manager">Manager (+ Campaigns)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={inviting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {inviting ? 'Generating Link...' : 'Generate Invite Link'}
              </button>
            </form>

            {inviteLink && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Invite Link Generated!</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={inviteLink}
                    className="flex-1 bg-white border border-green-300 rounded px-2 py-1 text-xs text-gray-600 outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-2">Send this link directly to the user. It will expire in 7 days.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TeamSettings;
