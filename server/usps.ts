interface USPSRateRequest {
  originZip: string;
  destinationZip: string;
  weight: number; // in ounces
  length?: number;
  width?: number;
  height?: number;
}

interface USPSRate {
  mailClass: string;
  mailClassName: string;
  price: number;
  deliveryDays: number | null;
  deliveryDate: string | null;
}

interface USPSRateResponse {
  rates: USPSRate[];
  error?: string;
}

const USPS_API_BASE = 'https://apis.usps.com';

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.USPS_CLIENT_ID;
  const clientSecret = process.env.USPS_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('USPS API credentials not configured');
    return null;
  }
  
  try {
    const response = await fetch(`${USPS_API_BASE}/oauth2/v3/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to get USPS access token:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting USPS access token:', error);
    return null;
  }
}

export async function getShippingRates(request: USPSRateRequest): Promise<USPSRateResponse> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return getFallbackRates(request.weight);
  }
  
  try {
    const pricingRequest = {
      originZIPCode: request.originZip,
      destinationZIPCode: request.destinationZip,
      weight: request.weight / 16, // Convert ounces to pounds
      length: request.length || 12,
      width: request.width || 12,
      height: request.height || 6,
      mailClass: 'ALL',
      processingCategory: 'MACHINABLE',
      rateIndicator: 'DR',
      destinationEntryFacilityType: 'NONE',
      priceType: 'RETAIL',
    };
    
    const response = await fetch(`${USPS_API_BASE}/prices/v3/base-rates/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pricingRequest),
    });
    
    if (!response.ok) {
      console.error('USPS rate request failed:', response.status);
      return getFallbackRates(request.weight);
    }
    
    const data = await response.json();
    
    const rates: USPSRate[] = [];
    
    if (data.rates && Array.isArray(data.rates)) {
      for (const rate of data.rates) {
        rates.push({
          mailClass: rate.mailClass || rate.rateClass || 'UNKNOWN',
          mailClassName: formatMailClassName(rate.mailClass || rate.description),
          price: Math.round(rate.price || rate.totalPrice || 0),
          deliveryDays: rate.commitment?.deliveryDays || null,
          deliveryDate: rate.commitment?.deliveryDate || null,
        });
      }
    }
    
    if (rates.length === 0) {
      return getFallbackRates(request.weight);
    }
    
    rates.sort((a, b) => a.price - b.price);
    
    return { rates: rates.slice(0, 5) };
  } catch (error) {
    console.error('Error fetching USPS rates:', error);
    return getFallbackRates(request.weight);
  }
}

function formatMailClassName(mailClass: string): string {
  const names: Record<string, string> = {
    'PRIORITY_MAIL_EXPRESS': 'Priority Mail Express',
    'PRIORITY_MAIL': 'Priority Mail',
    'USPS_GROUND_ADVANTAGE': 'USPS Ground Advantage',
    'GROUND_ADVANTAGE': 'USPS Ground Advantage',
    'PARCEL_SELECT': 'Parcel Select',
    'FIRST_CLASS_MAIL': 'First-Class Mail',
    'MEDIA_MAIL': 'Media Mail',
    'LIBRARY_MAIL': 'Library Mail',
  };
  return names[mailClass] || mailClass?.replace(/_/g, ' ') || 'Standard Shipping';
}

function getFallbackRates(weightOunces: number): USPSRateResponse {
  const weightLbs = weightOunces / 16;
  
  const baseRate = 8;
  const perLbRate = 1;
  const groundPrice = Math.round(baseRate + weightLbs * perLbRate);
  const priorityPrice = Math.round(groundPrice * 1.5);
  const expressPrice = Math.round(groundPrice * 2.5);
  
  return {
    rates: [
      {
        mailClass: 'USPS_GROUND_ADVANTAGE',
        mailClassName: 'USPS Ground Advantage',
        price: groundPrice,
        deliveryDays: 5,
        deliveryDate: null,
      },
      {
        mailClass: 'PRIORITY_MAIL',
        mailClassName: 'Priority Mail',
        price: priorityPrice,
        deliveryDays: 3,
        deliveryDate: null,
      },
      {
        mailClass: 'PRIORITY_MAIL_EXPRESS',
        mailClassName: 'Priority Mail Express',
        price: expressPrice,
        deliveryDays: 1,
        deliveryDate: null,
      },
    ],
  };
}

export function calculatePackageWeight(items: Array<{ quantity: number }>): number {
  const baseWeightPerItem = 32;
  const packagingWeight = 16;
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return (totalItems * baseWeightPerItem) + packagingWeight;
}
