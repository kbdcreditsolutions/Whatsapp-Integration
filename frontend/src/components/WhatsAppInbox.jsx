import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export default function WhatsAppInbox({ backendUrl }) {
  const [conversations, setConversations] = useState({});
  const [activeNumber, setActiveNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [contactsData, setContactsData] = useState({});
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Lead', 'Customer', 'Spam'

  // Fetch initial conversations and contacts
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        const grouped = groupMessages(data);
        setConversations(grouped);
      }
      setLoading(false);
    };

    const fetchContacts = async () => {
      const { data, error } = await supabase.from('contacts').select('*');
      if (!error && data) {
        const contactMap = {};
        data.forEach(c => contactMap[c.phone_number] = c.category);
        setContactsData(contactMap);
      }
    };

    fetchMessages();
    fetchContacts();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('New message received!', payload.new);
          setConversations((prev) => {
            const msg = payload.new;
            const existing = prev[msg.phone_number] || [];
            return {
              ...prev,
              [msg.phone_number]: [...existing, msg]
            };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Message updated!', payload.new);
          setConversations((prev) => {
            const msg = payload.new;
            const existing = prev[msg.phone_number] || [];
            const updated = existing.map(m => m.id === msg.id ? msg : m);
            return {
              ...prev,
              [msg.phone_number]: updated
            };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Message deleted!', payload.old);
          setConversations((prev) => {
            const newConvos = { ...prev };
            for (const phone in newConvos) {
              newConvos[phone] = newConvos[phone].filter(m => m.id !== payload.old.id);
              if (newConvos[phone].length === 0) delete newConvos[phone];
            }
            return newConvos;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const groupMessages = (messages) => {
    const grouped = {};
    messages.forEach(msg => {
      if (!grouped[msg.phone_number]) grouped[msg.phone_number] = [];
      grouped[msg.phone_number].push(msg);
    });
    return grouped;
  };

  const getProfileName = (num) => {
    const msgs = conversations[num] || [];
    const inboundMsgs = msgs.filter(m => m.direction === 'inbound' && m.profile_name);
    if (inboundMsgs.length > 0) {
      return inboundMsgs[inboundMsgs.length - 1].profile_name;
    }
    return null;
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeNumber) return;
    setSending(true);
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: activeNumber,
          message: replyText.trim()
        })
      });
      if (!res.ok) {
         const data = await res.json();
         alert('Error sending reply: ' + (data.error?.message || JSON.stringify(data.error) || 'Unknown error'));
      } else {
         setReplyText('');
      }
    } catch (e) {
      alert('Error sending reply: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!confirm('Are you sure you want to delete this message? This only deletes it from your dashboard.')) return;
    await supabase.from('messages').delete().eq('id', msgId);
  };

  const handleDeleteChat = async () => {
    if (!activeNumber) return;
    if (!confirm('Are you sure you want to delete this entire conversation?')) return;
    await supabase.from('messages').delete().eq('phone_number', activeNumber);
    setActiveNumber(null);
  };

  const handleCategoryChange = async (newCategory) => {
    if (!activeNumber) return;
    // Update local state immediately for snappy UI
    setContactsData(prev => ({ ...prev, [activeNumber]: newCategory }));
    
    // Upsert into Supabase
    const { error } = await supabase.from('contacts').upsert({ 
      phone_number: activeNumber, 
      category: newCategory 
    }, { onConflict: 'phone_number' });
    
    if (error) {
      alert('Error updating category. Did you run the SQL command to create the contacts table?');
    }
  };

  if (!supabase) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center text-red-500">
        Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.
      </div>
    );
  }

  const allContacts = Object.keys(conversations);
  
  // Filter contacts by active tab
  const contacts = allContacts.filter(num => {
    if (activeTab === 'All') return true;
    const cat = contactsData[num] || 'Lead'; // Default to Lead
    return cat === activeTab;
  });

  const activeMessages = activeNumber ? conversations[activeNumber] : [];

  return (
    <div className="bg-white shadow rounded-lg flex h-[600px] border border-gray-200 overflow-hidden">
      {/* Left Pane - Contacts */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 bg-white font-semibold border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 border-b border-gray-100">
            {['All', 'Lead', 'Customer', 'Spam'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-gray-800">Conversations</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="p-4 text-gray-500 text-sm">Loading...</p>
          ) : contacts.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No conversations yet.</p>
          ) : (
            contacts.map((num) => {
              const name = getProfileName(num);
              return (
                <div 
                  key={num}
                  onClick={() => setActiveNumber(num)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${activeNumber === num ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="font-medium text-gray-800">
                    {name || `+${num}`}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {name ? `+${num}` : (conversations[num][conversations[num].length - 1]?.content || 'Image/Template')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Chat */}
      <div className="w-2/3 flex flex-col bg-[#efeae2]">
        {activeNumber ? (
          <>
            <div className="p-3 bg-gray-100 font-semibold border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                  <div className="text-gray-900">{getProfileName(activeNumber) || `+${activeNumber}`}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={contactsData[activeNumber] || 'Lead'}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none"
                >
                  <option value="Lead">Lead</option>
                  <option value="Customer">Customer</option>
                  <option value="Spam">Spam</option>
                </select>
                <button 
                  onClick={handleDeleteChat}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded transition-colors"
                  title="Delete Entire Chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeMessages.map((msg, idx) => {
                const isInbound = msg.direction === 'inbound';
                return (
                  <div key={idx} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'} group`}>
                    <div className="flex items-center gap-2 max-w-[85%]">
                      {!isInbound && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      )}
                      <div className={`rounded-lg p-3 shadow-sm ${isInbound ? 'bg-white rounded-tl-none' : 'bg-[#d9fdd3] rounded-tr-none'}`}>
                      {msg.media_id ? (
                        <img 
                          src={`${backendUrl}/api/whatsapp/media/${msg.media_id}`} 
                          alt="Media" 
                          className="max-w-[200px] max-h-[200px] rounded object-contain mb-1" 
                        />
                      ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <div className="flex justify-end items-center mt-1 gap-1">
                        <span className="text-[10px] text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {!isInbound && (
                          <span className="text-[10px] text-gray-400">
                            {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : msg.status === 'sent' ? '✓' : '...'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isInbound && (
                      <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity mt-1">
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 bg-gray-100 border-t border-gray-200">
              <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex gap-2">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 rounded-full border-gray-300 border px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={sending}
                />
                <button 
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 font-medium disabled:opacity-50 transition-colors"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start reading
          </div>
        )}
      </div>
    </div>
  );
}
