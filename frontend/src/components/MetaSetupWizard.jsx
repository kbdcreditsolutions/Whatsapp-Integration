import React from 'react';

const MetaSetupWizard = () => {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden m-4 p-8 border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Meta WhatsApp API Setup Guide</h2>
      </div>

      <p className="text-gray-600 mb-8">
        Follow these steps to connect your own Meta WhatsApp Business account to the platform and avoid third-party API fees.
      </p>

      <div className="space-y-8">
        {/* Step 1 */}
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">1</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a Meta Developer App</h3>
            <p className="text-gray-600 mb-2">
              Go to the <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">Meta App Dashboard</a> and click <strong>Create App</strong>.
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-2 space-y-1 text-sm">
              <li>Select <strong>Other</strong> for your app use case.</li>
              <li>Select <strong>Business</strong> as the app type.</li>
              <li>Name your app and connect it to your Business Manager account.</li>
            </ul>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">2</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Add the WhatsApp Product</h3>
            <p className="text-gray-600 text-sm mb-3">
              On the "Add products to your app" page, scroll down to <strong>WhatsApp</strong> and click <strong>Set Up</strong>.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Important Setup Information:</p>
              <p className="text-sm text-gray-600">Meta will provide you with a temporary test phone number immediately. To use a real number, you will need to complete Business Verification.</p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">3</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Get Your API Credentials</h3>
            <p className="text-gray-600 text-sm mb-3">
              Navigate to <strong>WhatsApp &gt; API Setup</strong> in the left sidebar. You need two pieces of information:
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <span className="font-semibold text-gray-700">Phone Number ID</span>
                  <p className="text-xs text-gray-500">Found directly under the Send and Receive messages section.</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                <div>
                  <span className="font-semibold text-gray-700">Permanent Access Token</span>
                  <p className="text-xs text-gray-500">Do not use the Temporary Token. Go to Business Settings &gt; System Users to generate a permanent token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaSetupWizard;
