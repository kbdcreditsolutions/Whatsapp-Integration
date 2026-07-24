import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    if (!replyText.trim() && !selectedFile) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('phoneNumber', activeNumber);
      if (replyText.trim()) formData.append('message', replyText);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(`${backendUrl}/api/whatsapp/send`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
         setReplyText('');
         clearFile();
      } else {
         alert('Error sending reply: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (e) {
      alert('Error sending reply: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type === 'application/pdf') {
        const file = items[i].getAsFile();
        if (file) {
          setSelectedFile(file);
          setFilePreviewUrl(URL.createObjectURL(file));
          e.preventDefault();
        }
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  return (
    <div className="bg-white rounded-2xl flex h-[700px] overflow-hidden border border-gray-200 shadow-sm relative z-10">
      {/* Left Pane - Contacts */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-[#f9f9fa]">
        <div className="p-5 font-semibold border-b border-gray-200 bg-white/80 backdrop-blur-md z-10">
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-gray-100 hide-scrollbar">
            {['All', 'Lead', 'Customer', 'Spam'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-gray-900 text-lg tracking-tight">Conversations</span>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <svg className="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
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
                      ? 'bg-blue-50/50 border-blue-500' 
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
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
      <div className="w-2/3 flex flex-col bg-white relative">

        {activeNumber ? (
          <>
            <div className="p-4 font-semibold border-b border-gray-200 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                  <div className="text-gray-900 text-lg">{getProfileName(activeNumber) || `+${activeNumber}`}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select 
                    value={contactsData[activeNumber] || 'Lead'}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <option value="Lead" className="bg-white">Lead</option>
                    <option value="Customer" className="bg-white">Customer</option>
                    <option value="Spam" className="bg-white">Spam</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                <button 
                  onClick={handleDeleteChat}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Delete Entire Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar">
              {activeMessages.map((msg, idx) => {
                const isInbound = msg.direction === 'inbound';
                
                let docFilename = 'Document';
                let docCaption = msg.content;
                if (msg.type === 'document' && msg.content && msg.content.startsWith('[FILENAME]')) {
                  const match = msg.content.match(/^\[FILENAME\](.*?)\[\/FILENAME\]([\s\S]*)$/);
                  if (match) {
                    docFilename = match[1] || 'Document';
                    docCaption = match[2]?.trim() || '';
                  }
                }

                return (
                  <div key={idx} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'} group`}>
                    <div className="flex items-end gap-2 max-w-[75%]">
                      {!isInbound && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all bg-gray-50 rounded-full mb-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      )}
                      
                      <div className={`relative px-4 py-2.5 shadow-sm ${
                        isInbound 
                          ? 'bg-[#f0f0f0] text-gray-900 rounded-2xl rounded-bl-sm' 
                          : 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                      }`}>
                        {msg.media_id ? (
                          msg.type === 'document' ? (
                            <a 
                              href={`${backendUrl}/api/whatsapp/media/${msg.media_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-black/5 rounded-xl mb-2 mt-1 hover:bg-black/10 transition-colors"
                            >
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isInbound ? 'text-gray-900' : 'text-white'}`}>{docFilename}</p>
                                <p className={`text-xs truncate ${isInbound ? 'text-gray-500' : 'text-blue-200'}`}>Click to open</p>
                              </div>
                            </a>
                          ) : (
                            <img 
                              src={`${backendUrl}/api/whatsapp/media/${msg.media_id}`} 
                              alt="Media" 
                              className="max-w-[240px] max-h-[240px] rounded-xl object-contain mb-2 mt-1 bg-black/5" 
                            />
                          )
                        ) : null}
                        {msg.type === 'document' ? (
                          docCaption && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{docCaption}</p>
                        ) : (
                          msg.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <div className={`flex justify-end items-center mt-1 gap-1.5 ${isInbound ? 'text-gray-500' : 'text-blue-200'}`}>
                          <span className="text-[10px] font-medium tracking-wide">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {!isInbound && (
                            <span className="text-[11px]">
                              {msg.status === 'read' ? (
                                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 13l4 4L24 7" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"/></svg>
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
                        <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all bg-gray-50 rounded-full mb-1">
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="p-5 bg-white z-10 border-t border-gray-100 flex flex-col gap-3">
              {filePreviewUrl && (
                <div className="relative inline-block w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <button 
                    onClick={clearFile}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 z-10 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  {selectedFile?.type?.includes('pdf') || selectedFile?.type?.includes('document') ? (
                     <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 flex-col">
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        <span className="text-[10px] truncate w-20 text-center px-1 font-medium">{selectedFile.name}</span>
                     </div>
                  ) : (
                    <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex gap-3 items-end">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0 mb-0.5"
                  title="Attach File"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onPaste={handlePaste}
                    placeholder={selectedFile ? "Add a caption..." : "Type your message or paste an image..."} 
                    className="w-full bg-gray-100 border border-transparent rounded-full pl-5 pr-5 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    disabled={sending}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={sending || (!replyText.trim() && !selectedFile)}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 py-3 font-medium disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm active:scale-95 flex-shrink-0"
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
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 relative z-10 bg-gray-50">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-50 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <p className="text-lg text-gray-500 font-medium">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
