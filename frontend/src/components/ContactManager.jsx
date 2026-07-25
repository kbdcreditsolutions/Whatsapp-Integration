import React, { useState, useEffect, useRef } from 'react';

export default function ContactManager({ backendUrl, workspaceId }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/contacts?workspace_id=${workspaceId}`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching contacts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchContacts();
    }
  }, [workspaceId]);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', workspaceId);

    setImporting(true);
    try {
      const res = await fetch(`${backendUrl}/api/contacts/import`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchContacts(); // Refresh list
      } else {
        alert('Import failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Error during import: ' + e.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredContacts = contacts.filter(c => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(term);
    const phoneMatch = c.phone_number.includes(term);
    const emailMatch = (c.email || '').toLowerCase().includes(term);
    const tagMatch = (c.tags || []).some(t => t.toLowerCase().includes(term));
    return nameMatch || phoneMatch || emailMatch || tagMatch;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">CRM Contacts</h2>
          <p className="text-sm text-gray-500">Manage your leads, customers, and view their attributes.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Search by name, phone, tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {importing ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            )}
            Import CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <p>No contacts found.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category & Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.phone_number} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{contact.name || 'Unknown Name'}</span>
                      <span className="text-sm text-gray-500">+{contact.phone_number}</span>
                      {contact.email && <span className="text-xs text-gray-400">{contact.email}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {contact.category || 'Lead'}
                      </span>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {contact.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium border border-gray-200">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{contact.assigned_to_profile?.full_name || 'Unassigned'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                      {contact.custom_attributes ? Object.entries(contact.custom_attributes).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
