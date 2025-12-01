# FactSet API Integration Guide

## Overview

Portfolio Manager Pro now integrates with **FactSet**, one of the world's leading providers of institutional-grade financial data and analytics. FactSet provides the same data used by professional investors, hedge funds, and financial institutions.

## Features Powered by FactSet

### 📊 Real-Time Market Data
- **Live Stock Prices**: Real-time and delayed stock prices
- **Market Statistics**: Volume, market cap, P/E ratios
- **52-Week Highs/Lows**: Historical price ranges
- **Intraday Data**: Minute-by-minute price updates

### 📈 Historical Price Data
- **Time Series Data**: Daily, weekly, monthly historical prices
- **Adjusted Prices**: Corporate action adjusted data
- **Volume Data**: Historical trading volumes
- **Custom Date Ranges**: Flexible date queries

### 📰 News & Research
- **Real-Time News**: Breaking financial news
- **Company-Specific News**: Filtered by symbol
- **Sentiment Analysis**: AI-powered sentiment scoring
- **Multiple Sources**: Aggregated from top financial publishers

### 🏢 Company Fundamentals
- **Company Profiles**: Business descriptions, sectors, industries
- **Financial Statements**: Balance sheets, income statements
- **Key Metrics**: Earnings, revenue, margins
- **Corporate Actions**: Dividends, splits, mergers

## Getting Started with FactSet API

### 1. Create a FactSet Account

1. Visit [FactSet Developer Portal](https://developer.factset.com/)
2. Click "Sign Up" to create an account
3. Complete the registration process
4. Wait for account approval (typically 1-2 business days)

### 2. Generate API Credentials

1. Log in to the [FactSet Developer Portal](https://developer.factset.com/)
2. Navigate to **API Keys** section
3. Click **"Create New API Key"**
4. Give your key a descriptive name (e.g., "Portfolio Manager Pro")
5. Copy your **Username** and **API Key** (keep these secure!)

### 3. Configure the Application

#### Option A: Using Environment Variables (Recommended)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   FACTSET_USERNAME=your_factset_username
   FACTSET_API_KEY=your_factset_api_key
   ```

3. **Important**: Never commit the `.env` file to version control!

#### Option B: Direct Configuration

Edit `src/services/marketData.ts` and replace the placeholder values:

```typescript
const FACTSET_USERNAME = 'your_actual_username';
const FACTSET_API_KEY = 'your_actual_api_key';
```

### 4. Install Additional Dependencies (if needed)

```bash
npm install dotenv
```

Add to `vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      'process.env.FACTSET_USERNAME': JSON.stringify(env.FACTSET_USERNAME),
      'process.env.FACTSET_API_KEY': JSON.stringify(env.FACTSET_API_KEY),
    },
  }
})
```

### 5. Restart the Development Server

```bash
npm run dev
```

## API Endpoints Used

### Price Data
- **Endpoint**: `/content/factset-prices/v1/prices`
- **Purpose**: Real-time and historical stock prices
- **Rate Limit**: Varies by subscription tier

### Company Profile
- **Endpoint**: `/content/factset-entity/v1/entity-profile`
- **Purpose**: Company fundamentals and profile data
- **Rate Limit**: Varies by subscription tier

### News Articles
- **Endpoint**: `/content/news/v1/list-articles`
- **Purpose**: Financial news and sentiment analysis
- **Rate Limit**: Varies by subscription tier

## Subscription Tiers

FactSet offers different API subscription tiers:

### Free Tier (Developer)
- ✅ 500 API calls per day
- ✅ Access to core endpoints
- ✅ 15-minute delayed data
- ✅ Perfect for development and testing

### Professional Tier
- ✅ 10,000+ API calls per day
- ✅ Real-time data
- ✅ Advanced endpoints
- ✅ Priority support
- 💰 Contact FactSet for pricing

### Enterprise Tier
- ✅ Unlimited API calls
- ✅ Full dataset access
- ✅ Custom integrations
- ✅ Dedicated support
- 💰 Custom pricing

## Fallback Mode

The application includes intelligent fallback logic:

1. **Primary**: Tries FactSet API with your credentials
2. **Fallback**: If FactSet is unavailable or not configured, uses mock data
3. **Caching**: Responses are cached for 60 seconds to reduce API calls

This ensures the app works even without FactSet credentials (using realistic mock data), but provides real institutional-grade data when configured.

## API Rate Limiting

To avoid hitting rate limits:

- **Caching**: All data is cached for 60 seconds
- **Batch Requests**: Multiple symbols fetched efficiently
- **Smart Polling**: Only updates visible data
- **Error Handling**: Graceful degradation to mock data

## Troubleshooting

### "401 Unauthorized" Error
- Check your username and API key are correct
- Ensure credentials are in the correct format
- Verify your FactSet account is active

### "429 Too Many Requests" Error
- You've hit your rate limit
- Wait for the limit to reset (usually hourly)
- Consider upgrading your subscription tier

### "Invalid Symbol" Error
- FactSet uses specific symbol formats
- Try adding exchange suffix (e.g., "AAPL-US" for Apple)
- Check FactSet documentation for correct symbols

### Mock Data Still Showing
- Verify `.env` file is in the root directory
- Check environment variables are loaded correctly
- Restart the development server
- Look for console warnings about API errors

## Security Best Practices

1. **Never commit credentials**: Always use `.env` files
2. **Rotate keys regularly**: Generate new API keys periodically
3. **Use environment-specific keys**: Different keys for dev/prod
4. **Monitor usage**: Check FactSet portal for API usage
5. **Implement rate limiting**: Prevent accidental overuse

## Support & Resources

- **FactSet Developer Portal**: https://developer.factset.com/
- **API Documentation**: https://developer.factset.com/api-catalog
- **Support**: developer.support@factset.com
- **Community Forum**: https://community.factset.com/

## Cost Considerations

- **Free Tier**: $0/month (perfect for personal use)
- **Professional**: Starting at $200/month
- **Enterprise**: Custom pricing (typically $500+/month)

For most individual investors, the free tier is sufficient for this application.

## Alternatives

If FactSet doesn't meet your needs, the application can easily be configured to use:

- **Alpha Vantage** (free tier available)
- **IEX Cloud** (generous free tier)
- **Polygon.io** (good pricing)
- **Yahoo Finance API** (free but unofficial)
- **Finnhub** (free tier available)

The mock data fallback ensures the app always works, regardless of which API you use!

---

**Ready to get started?** 

1. Sign up at https://developer.factset.com/
2. Generate your API credentials
3. Configure your `.env` file
4. Restart the app
5. Enjoy institutional-grade financial data! 🚀
