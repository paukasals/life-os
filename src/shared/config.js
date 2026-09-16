import 'dotenv/config';

// User Profile: Pau
export const userProfile = {
  name: 'Pau',
  location: 'Miami, FL',
  birthPlace: 'Barcelona',
  timezone: process.env.TIMEZONE || 'Europe/Madrid',

  // Businesses
  businesses: [
    {
      name: 'Lobsteria',
      description: 'Lobster rolls, oysters, ceviche from 1976 Airstream',
      type: 'Food Truck',
    },
    {
      name: 'The Crepes & Waffles Bar',
      description: 'Crepes and waffles concept',
      type: 'Food Service',
    },
  ],

  // Health Profile
  health: {
    mealFrequency: 2, // times per day
    dietType: 'High Protein',
    supplements: [
      'Omega-3',
      'Vitamin D3 + K2',
      'Multivitamin',
      'Creatine',
      'Whey Protein',
    ],
    training: {
      hiit: 3, // times per week
      zone2Cardio: 'weekly',
      sports: ['Water Polo (Saturday)'],
    },
    goals: ['Energy', 'Performance', 'Recovery'],
  },
};

export const config = {
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  timezone: process.env.TIMEZONE || 'Europe/Madrid',
  businessName: process.env.BUSINESS_NAME || 'Lobsteria & The Crepes & Waffles Bar',
  userProfile,

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },

  whatsapp: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: process.env.WHATSAPP_TO,
  },

  marketing: {
    googleAdsKey: process.env.GOOGLE_ADS_API_KEY,
    metaToken: process.env.META_ACCESS_TOKEN,
    autopilot: process.env.MARKETING_AUTOPILOT || 'dry-run',
    gbp: {
      clientId: process.env.GBP_CLIENT_ID,
      clientSecret: process.env.GBP_CLIENT_SECRET,
      refreshToken: process.env.GBP_REFRESH_TOKEN,
      accountId: process.env.GBP_ACCOUNT_ID,
      locationId: process.env.GBP_LOCATION_ID,
    },
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      accessToken: process.env.TIKTOK_ACCESS_TOKEN,
      refreshToken: process.env.TIKTOK_REFRESH_TOKEN,
    },
    metaAds: {
      accessToken: process.env.META_ACCESS_TOKEN,
      adAccountId: process.env.META_AD_ACCOUNT_ID,
    },
    googleAds: {
      developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
      loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      clientId: process.env.GOOGLE_ADS_CLIENT_ID,
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    },
    maxCac: process.env.AD_MAX_CAC ? Number(process.env.AD_MAX_CAC) : null,
  },

  finance: {
    stripeKey: process.env.STRIPE_SECRET_KEY,
    bankApiKey: process.env.BANK_API_KEY,
  },

  reviews: {
    googlePlacesKey: process.env.GOOGLE_PLACES_API_KEY,
    trustpilotKey: process.env.TRUSTPILOT_API_KEY,
  },

  health: {
    ouraKey: process.env.OURA_API_KEY,
    appleHealthPath: process.env.APPLE_HEALTH_EXPORT_PATH,
  },

  calendar: {
    googleKey: process.env.GOOGLE_CALENDAR_API_KEY,
    calendarId: process.env.GOOGLE_CALENDAR_ID,
  },
};
