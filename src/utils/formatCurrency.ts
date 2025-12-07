export const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  if (amount === undefined || amount === null) return '';
  
  // 1. Sanitize the code
  const code = currencyCode ? currencyCode.toUpperCase() : 'USD';

  // 2. SMART MAPPING: Map currencies to the locales that render them best.
  // This ensures 'NGN' shows '₦', 'EUR' shows '€' with commas, etc.
  const localeMap: Record<string, string> = {
    'USD': 'en-US', // $1,000.00
    'ZAR': 'en-ZA', // R 1 000,00
    'EUR': 'de-DE', // 1.000,00 € (European Standard)
    'GBP': 'en-GB', // £1,000.00
    'NGN': 'en-NG', // ₦1,000.00
    'KES': 'en-KE', // KSh 1,000.00
    'GHS': 'en-GH', // GH₵1,000.00
    'RRW': 'rw-RW', // RF 1,000
    'UGX': 'en-UG', // USh 1,000
    'TZS': 'en-TZ', // TSh 1,000
    'ZMW': 'en-ZM', // K1,000.00
    'BWP': 'en-BW', // P1,000.00
    'NAD': 'en-NA', // N$1,000.00
    'LSL': 'en-LS', // L 1,000.00
    'SZL': 'en-SZ', // E 1,000.00
    // Add more mappings here if needed, otherwise fallback to US formatting
  };

  // Select the specific locale for the currency, or default to US English
  const locale = localeMap[code] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error(`Currency Error (${code}):`, error);
    // Ultimate Fallback if the browser doesn't support the locale
    return `${code} ${amount.toFixed(2)}`; 
  }
};