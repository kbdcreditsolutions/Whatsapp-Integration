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

  // Fetch initial conversations
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

    fetchMessages();

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

  if (!supabase) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center text-red-500">
        Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.
      </div>
    );
  }

  const contacts = Object.keys(conversations);
  const activeMessages = activeNumber ? conversations[activeNumber] : [];

  return (
    <div className="bg-white shadow rounded-lg flex h-[600px] border border-gray-200 overflow-hidden">
      {/* Left Pane - Contacts */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 bg-gray-100 font-semibold border-b border-gray-200">
          Conversations
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
            <div className="p-4 bg-gray-100 font-semibold border-b border-gray-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              {getProfileName(activeNumber) || `+${activeNumber}`}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeMessages.map((msg, idx) => {
                const isInbound = msg.direction === 'inbound';
                return (
                  <div key={idx} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[75%] rounded-lg p-3 shadow-sm ${isInbound ? 'bg-white rounded-tl-none' : 'bg-[#d9fdd3] rounded-tr-none'}`}>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
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
