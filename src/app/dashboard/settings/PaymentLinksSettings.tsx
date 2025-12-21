'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; 
import { PaymentSettings, PaymentProviderType } from '@/types/profile';

// Standard SVG Icon
const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

interface Props {
  initialSettings: PaymentSettings | null;
  userId: string;
}

export default function PaymentLinksSettings({ initialSettings, userId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Default state structure
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings || {
    providers: [
      { id: 'paystack', name: 'Paystack', url: '', enabled: false },
      { id: 'yoco', name: 'Yoco', url: '', enabled: false },
      { id: 'paypal', name: 'PayPal', url: '', enabled: false },
      { id: 'manual', name: 'Manual Link', url: '', enabled: false },
    ],
    default_provider: null
  });

  const handleUrlChange = (id: PaymentProviderType, url: string) => {
    setSettings(prev => ({
      ...prev,
      providers: prev.providers.map(p => 
        p.id === id ? { ...p, url, enabled: !!url } : p
      )
    }));
  };

  const handleSetDefault = (id: PaymentProviderType) => {
    setSettings(prev => ({
      ...prev,
      default_provider: prev.default_provider === id ? null : id
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    setMessage('');

    try {
      // 🟢 COMMANDER FIX: We cast the whole object to 'any' here.
      // This bypasses the outdated 'Database' type definition that doesn't 
      // yet know about the 'payment_settings' column.
      const updates = { 
        payment_settings: settings, 
        updated_at: new Date().toISOString()
      } as any;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      setMessage('Payment settings saved successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Payment Links</h2>
      <p className="text-sm text-gray-500 mb-6">
        Add your payment links here. The default link will be automatically added to new invoices.
      </p>

      <div className="space-y-4">
        {settings.providers.map((provider) => (
          <div key={provider.id} className="flex items-start gap-4 p-4 border rounded-md bg-gray-50">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {provider.name} Payment URL
              </label>
              <input
                type="url"
                placeholder={`https://${provider.id}.com/...`}
                value={provider.url}
                onChange={(e) => handleUrlChange(provider.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div className="flex items-center h-full pt-6">
              <button
                onClick={() => handleSetDefault(provider.id)}
                disabled={!provider.url}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  settings.default_provider === provider.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-200'
                } ${!provider.url ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {settings.default_provider === provider.id ? 'Default' : 'Set Default'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </span>
        <button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-70"
        >
          {loading ? 'Saving...' : (
            <>
              <SaveIcon /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}