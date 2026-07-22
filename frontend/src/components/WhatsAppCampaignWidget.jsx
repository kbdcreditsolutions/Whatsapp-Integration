import React, { useState } from 'react';
import axios from 'axios';

const WhatsAppCampaignWidget = ({ backendUrl = "http://localhost:3001" }) => {
  const [provider, setProvider] = useState('interakt'); // Default provider
  const [isSandbox, setIsSandbox] = useState(true); // Sandbox toggle for Meta
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [templateName, setTemplateName] = useState('order_update');
  const [bodyVariables, setBodyVariables] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const bodyValuesArray = bodyVariables.split(',').map(v => v.trim()).filter(v => v !== '');

      const response = await axios.post(`${backendUrl}/api/whatsapp/message`, {
        provider: provider,
        isSandbox: isSandbox, // NEW: Tell backend to use test keys
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        templateName: templateName,
        languageCode: 'en',
        bodyValues: bodyValuesArray
      });

      if (response.data.success) {
        setStatus({ type: 'success', message: `Message successfully sent to ${response.data.provider} queue!` });
        setPhoneNumber('');
        setBodyVariables('');
      } else {
        setStatus({ type: 'error', message: 'Failed to send message.' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error?.message || error.response?.data?.error || 'Failed to trigger campaign.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.102.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.821.001 6.936 3.115 6.936 6.939-.001 3.821-3.116 6.941-6.936 6.941z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">WhatsApp Campaign</h2>
        </div>
      </div>

      {status.message && (
        <div className={`mb-4 p-3 rounded text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        
        {/* Provider Toggle */}
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">API Provider</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setProvider('interakt')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${provider === 'interakt' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Interakt
              </button>
              <button
                type="button"
                onClick={() => setProvider('meta')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${provider === 'meta' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Meta API
              </button>
            </div>
          </div>

          {/* Sandbox Toggle (Only for Meta) */}
          {provider === 'meta' && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
              <div>
                <span className="text-sm font-medium text-gray-700 block">Sandbox Test Mode</span>
                <span className="text-xs text-gray-500">Use pre-configured test keys. Number MUST be verified in Meta Dashboard.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSandbox(!isSandbox)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSandbox ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSandbox ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input 
              type="text" 
              value={countryCode} 
              onChange={(e) => setCountryCode(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              type="text" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 9876543210"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
          <select 
            value={templateName} 
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="order_update">Order Update (Transactional)</option>
            <option value="abandoned_cart">Abandoned Cart (Promotional)</option>
            <option value="hello_world">Hello World (Meta Test Template)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Variables (Comma separated)</label>
          <input 
            type="text" 
            value={bodyVariables} 
            onChange={(e) => setBodyVariables(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. John, Order #123"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty if testing hello_world.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? 'Sending...' : `Send via ${provider === 'interakt' ? 'Interakt' : 'Meta API'}`}
        </button>
      </form>
    </div>
  );
};

export default WhatsAppCampaignWidget;
