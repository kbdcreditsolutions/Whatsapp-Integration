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
      <div className="glass-card rounded-2xl p-8 text-center text-red-400 max-w-md mx-auto mt-20">
        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <p>Supabase is not configured. Please add keys to environment variables.</p>
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
    <div className="glass-card rounded-2xl flex h-[700px] overflow-hidden border border-white/10 shadow-2xl relative z-10">
      {/* Left Pane - Contacts */}
      <div className="w-1/3 border-r border-white/5 flex flex-col bg-[#0b0f19]/50">
        <div className="p-5 font-semibold border-b border-white/5 bg-[#111827]/80 backdrop-blur-md z-10">
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-white/5 hide-scrollbar">
            {['All', 'Lead', 'Customer', 'Spam'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-gray-200 text-lg tracking-tight">Conversations</span>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            contacts.map((num) => {
              const name = getProfileName(num);
              const isActive = activeNumber === num;
              return (
                <div 
                  key={num}
                  onClick={() => setActiveNumber(num)}
                  className={`p-4 cursor-pointer transition-all border-l-4 ${
                    isActive 
                      ? 'bg-white/10 border-blue-500' 
                      : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {name || `+${num}`}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1.5 flex items-center gap-1.5">
                    {name ? `+${num}` : (conversations[num][conversations[num].length - 1]?.content || 'Media Message')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Chat */}
      <div className="w-2/3 flex flex-col bg-[#0b0f19] relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        {activeNumber ? (
          <>
            <div className="p-4 font-semibold border-b border-white/5 bg-[#111827]/80 backdrop-blur-md z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                  <div className="text-white text-lg">{getProfileName(activeNumber) || `+${activeNumber}`}</div>
                  <div className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select 
                    value={contactsData[activeNumber] || 'Lead'}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-8 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <option value="Lead" className="bg-gray-900">Lead</option>
                    <option value="Customer" className="bg-gray-900">Customer</option>
                    <option value="Spam" className="bg-gray-900">Spam</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                <button 
                  onClick={handleDeleteChat}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                  title="Delete Entire Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar">
              {activeMessages.map((msg, idx) => {
                const isInbound = msg.direction === 'inbound';
                return (
                  <div key={idx} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'} group`}>
                    <div className="flex items-end gap-2 max-w-[75%]">
                      {!isInbound && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all bg-white/5 rounded-full mb-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      )}
                      
                      <div className={`relative px-4 py-2.5 shadow-sm ${
                        isInbound 
                          ? 'bg-[#1f2937] text-gray-100 rounded-2xl rounded-bl-sm border border-white/5' 
                          : 'bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-blue-900/20'
                      }`}>
                        {msg.media_id ? (
                          <img 
                            src={`${backendUrl}/api/whatsapp/media/${msg.media_id}`} 
                            alt="Media" 
                            className="max-w-[240px] max-h-[240px] rounded-xl object-contain mb-2 mt-1" 
                          />
                        ) : (
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <div className={`flex justify-end items-center mt-1 gap-1.5 ${isInbound ? 'text-gray-400' : 'text-blue-200'}`}>
                          <span className="text-[10px] font-medium tracking-wide">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {!isInbound && (
                            <span className="text-[11px]">
                              {msg.status === 'read' ? (
                                <svg className="w-3.5 h-3.5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 13l4 4L24 7" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"/></svg>
                              ) : msg.status === 'delivered' ? (
                                <svg className="w-3.5 h-3.5 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              ) : (
                                <svg className="w-3 h-3 text-blue-200/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isInbound && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all bg-white/5 rounded-full mb-1">
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Chat Input */}
            <div className="p-5 bg-transparent z-10">
              <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message..." 
                    className="w-full bg-[#1f2937] border border-white/10 rounded-full pl-5 pr-12 py-3.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                    disabled={sending}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 py-3 font-medium disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Send</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative z-10">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <p className="text-lg">Select a conversation to start reading</p>
          </div>
        )}
      </div>
    </div>
  );
}
