import crypto from 'crypto';

export interface AngelCredentials {
  apiKey: string;
  clientCode: string;
  mpin: string;
  totpSecret: string;
}

export interface AngelRawTrade {
  exchange?: string;
  producttype?: string;
  tradingsymbol: string;
  instrumenttype?: string;
  symboltoken?: string;
  transactiontype: 'BUY' | 'SELL';
  fillprice: string | number;
  fillsize?: string | number;
  fillquantity?: string | number;
  orderid?: string;
  filltime?: string;
  tradevalue?: string | number;
}

export interface MappedTrade {
  id: string;
  symbol: string;
  assetClass: 'Equities' | 'Options' | 'Futures' | 'Crypto' | 'Forex' | 'Commodities';
  direction: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED';
  entryDate: string;
  entryTime?: string;
  exitDate?: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  fees: number;
  pnl: number;
  pnlPercent: number;
  rMultiple?: number;
  strategy: string;
  emotion: 'Disciplined';
  followedRules: boolean;
  notes: string;
  lessons: string;
  marketSession?: 'Morning / Open' | 'Mid-Day' | 'Power Hour' | 'After Hours';
  createdAt: number;
  updatedAt: number;
}

/**
 * Decodes a base32 string into a Buffer.
 */
function base32ToBuffer(base32: string): Buffer {
  const clean = base32.replace(/[\s=-]/g, '').toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Standard RFC 6238 TOTP generator using Node.js crypto
 */
export function generateTOTP(secret: string): string {
  try {
    const key = base32ToBuffer(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epoch / timeStep);

    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buf);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0x0f;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch (error) {
    throw new Error('Failed to generate TOTP from secret. Please verify your Base32 TOTP key.');
  }
}

/**
 * Authenticate with Angel One SmartAPI and return jwtToken
 */
export async function authenticateAngelOne(creds: AngelCredentials): Promise<{ jwtToken: string; feedToken?: string }> {
  const totp = generateTOTP(creds.totpSecret);
  const primaryUrl = 'https://apiconnect.angelone.in/rest/auth/partner/v1/loginByPassword';
  const fallbackUrl = 'https://apiconnect.angelbroking.com/rest/auth/partner/v1/loginByPassword';

  const payload = {
    clientcode: creds.clientCode.trim().toUpperCase(),
    password: creds.mpin.trim(),
    totp: totp.trim(),
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '106.193.147.98',
    'X-MACAddress': '00:1A:2B:3C:4D:5E',
    'X-PrivateKey': creds.apiKey.trim(),
  };

  let response;
  let jsonResult;

  try {
    response = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    jsonResult = await response.json();
  } catch (err) {
    // try fallback
    try {
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      jsonResult = await response.json();
    } catch (fallbackErr) {
      throw new Error(`Connection to Angel One SmartAPI server failed: ${(err as Error).message}`);
    }
  }

  if (!jsonResult || !jsonResult.status || !jsonResult.data?.jwtToken) {
    const errorMsg = jsonResult?.message || jsonResult?.errorcode || 'Authentication failed. Please verify API Key, Client ID, MPIN, and TOTP Secret.';
    throw new Error(`Angel One Auth Error: ${errorMsg}`);
  }

  return {
    jwtToken: jsonResult.data.jwtToken,
    feedToken: jsonResult.data.feedToken,
  };
}

/**
 * Fetch raw Trade Book from Angel One SmartAPI
 */
export async function fetchAngelTradeBook(jwtToken: string, apiKey: string): Promise<AngelRawTrade[]> {
  const primaryUrl = 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook';
  const fallbackUrl = 'https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getTradeBook';

  const authHeader = jwtToken.startsWith('Bearer ') ? jwtToken : `Bearer ${jwtToken}`;

  const headers = {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '106.193.147.98',
    'X-MACAddress': '00:1A:2B:3C:4D:5E',
    'X-PrivateKey': apiKey.trim(),
  };

  let response;
  let result;

  try {
    response = await fetch(primaryUrl, { method: 'GET', headers });
    result = await response.json();
  } catch (err) {
    response = await fetch(fallbackUrl, { method: 'GET', headers });
    result = await response.json();
  }

  if (!result || !result.status) {
    // If no trades found, Angel One sometimes returns message like "No data found" or null data
    if (result?.errorcode === 'AB1004' || result?.message?.toLowerCase().includes('no data') || result?.message?.toLowerCase().includes('no trades')) {
      return [];
    }
    throw new Error(result?.message || 'Could not fetch trade book from Angel One.');
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

/**
 * Determine asset class from symbol and exchange
 */
function determineAssetClass(symbol: string, exchange?: string): 'Equities' | 'Options' | 'Futures' | 'Commodities' {
  const upper = symbol.toUpperCase();
  const ex = (exchange || '').toUpperCase();

  if (ex === 'MCX') return 'Commodities';
  if (upper.endsWith('CE') || upper.endsWith('PE') || upper.includes(' CE') || upper.includes(' PE')) {
    return 'Options';
  }
  if (upper.includes('FUT') || ex === 'NFO' || ex === 'CDS') {
    return 'Futures';
  }
  return 'Equities';
}

/**
 * Map raw Angel One fills/trades into TradeTrack Journal Trade records.
 * Pairs BUY and SELL orders of the same symbol into complete round-trip trades.
 */
export function mapAngelTradesToJournal(rawTrades: AngelRawTrade[]): MappedTrade[] {
  if (!rawTrades || rawTrades.length === 0) return [];

  const todayStr = new Date().toISOString().split('T')[0];

  // Group fills by trading symbol
  const symbolGroups: Record<string, AngelRawTrade[]> = {};
  for (const fill of rawTrades) {
    const sym = (fill.tradingsymbol || 'UNKNOWN').trim().toUpperCase();
    if (!symbolGroups[sym]) {
      symbolGroups[sym] = [];
    }
    symbolGroups[sym].push(fill);
  }

  const mappedList: MappedTrade[] = [];

  for (const [symbol, fills] of Object.entries(symbolGroups)) {
    // Separate Buy and Sell executions
    const buyFills = fills.filter(f => f.transactiontype === 'BUY');
    const sellFills = fills.filter(f => f.transactiontype === 'SELL');

    const totalBuyQty = buyFills.reduce((sum, f) => sum + Number(f.fillquantity || f.fillsize || 0), 0);
    const totalSellQty = sellFills.reduce((sum, f) => sum + Number(f.fillquantity || f.fillsize || 0), 0);

    const totalBuyVal = buyFills.reduce((sum, f) => sum + (Number(f.fillprice || 0) * Number(f.fillquantity || f.fillsize || 0)), 0);
    const totalSellVal = sellFills.reduce((sum, f) => sum + (Number(f.fillprice || 0) * Number(f.fillquantity || f.fillsize || 0)), 0);

    const avgBuyPrice = totalBuyQty > 0 ? totalBuyVal / totalBuyQty : 0;
    const avgSellPrice = totalSellQty > 0 ? totalSellVal / totalSellQty : 0;

    const assetClass = determineAssetClass(symbol, fills[0]?.exchange);

    // Sort all fills by filltime if available to know first entry
    const sortedFills = [...fills].sort((a, b) => {
      const timeA = a.filltime || '00:00:00';
      const timeB = b.filltime || '00:00:00';
      return timeA.localeCompare(timeB);
    });

    const firstFill = sortedFills[0];
    const lastFill = sortedFills[sortedFills.length - 1];

    const isLong = firstFill?.transactiontype === 'BUY';
    const direction: 'LONG' | 'SHORT' = isLong ? 'LONG' : 'SHORT';

    // Round-trip matched quantity
    const matchedQty = Math.min(totalBuyQty, totalSellQty);

    // If both buy and sell exist -> CLOSED trade
    if (matchedQty > 0) {
      const entryPrice = isLong ? avgBuyPrice : avgSellPrice;
      const exitPrice = isLong ? avgSellPrice : avgBuyPrice;

      // Approximate brokerage & STT for Indian market (₹20 per executed order + ~0.05% turnover)
      const estimatedOrdersCount = fills.length;
      const turnover = (entryPrice + exitPrice) * matchedQty;
      const estimatedFees = Math.round((estimatedOrdersCount * 20) + (turnover * 0.0005));

      const rawPnl = isLong 
        ? (exitPrice - entryPrice) * matchedQty 
        : (entryPrice - exitPrice) * matchedQty;
      const netPnl = Math.round((rawPnl - estimatedFees) * 100) / 100;
      const costBasis = entryPrice * matchedQty;
      const pnlPercent = costBasis > 0 ? Math.round(((netPnl / costBasis) * 100) * 100) / 100 : 0;

      // Format time
      const entryTime = (firstFill?.filltime || '09:30:00').substring(0, 5);
      const exitTime = (lastFill?.filltime || '15:15:00').substring(0, 5);

      mappedList.push({
        id: `angel-${firstFill.orderid || Date.now()}-${symbol.replace(/[^a-zA-Z0-9]/g, '')}`,
        symbol,
        assetClass,
        direction,
        status: 'CLOSED',
        entryDate: todayStr,
        entryTime,
        exitDate: todayStr,
        exitTime,
        entryPrice: Math.round(entryPrice * 100) / 100,
        exitPrice: Math.round(exitPrice * 100) / 100,
        quantity: matchedQty,
        fees: estimatedFees,
        pnl: netPnl,
        pnlPercent,
        rMultiple: netPnl > 0 ? 1.5 : -1.0,
        strategy: 'Angel One SmartAPI Auto-Sync',
        emotion: 'Disciplined',
        followedRules: true,
        notes: `Auto-synced from Angel One TradeBook. Executed fills: ${fills.length}. Total Turnover: ₹${Math.round(turnover).toLocaleString('en-IN')}.`,
        lessons: 'Broker synced trade entry.',
        marketSession: 'Morning / Open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // If there is unmatched open quantity remaining
    const remainingQty = Math.abs(totalBuyQty - totalSellQty);
    if (remainingQty > 0 && matchedQty === 0) {
      const openDirection: 'LONG' | 'SHORT' = totalBuyQty > totalSellQty ? 'LONG' : 'SHORT';
      const openPrice = openDirection === 'LONG' ? avgBuyPrice : avgSellPrice;
      const entryTime = (firstFill?.filltime || '09:30:00').substring(0, 5);

      mappedList.push({
        id: `angel-open-${firstFill.orderid || Date.now()}-${symbol.replace(/[^a-zA-Z0-9]/g, '')}`,
        symbol,
        assetClass,
        direction: openDirection,
        status: 'OPEN',
        entryDate: todayStr,
        entryTime,
        entryPrice: Math.round(openPrice * 100) / 100,
        quantity: remainingQty,
        fees: 20,
        pnl: 0,
        pnlPercent: 0,
        strategy: 'Angel One SmartAPI Auto-Sync',
        emotion: 'Disciplined',
        followedRules: true,
        notes: `Active position synced from Angel One TradeBook. Order ID: ${firstFill.orderid || 'N/A'}.`,
        lessons: '',
        marketSession: 'Mid-Day',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  return mappedList;
}

/**
 * Generate realistic simulated Angel One trades for testing / offline market hours
 */
export function getSimulatedAngelTrades(): MappedTrade[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = Date.now();

  return [
    {
      id: `angel-sim-${now}-1`,
      symbol: 'NIFTY 24850 CE',
      assetClass: 'Options',
      direction: 'LONG',
      status: 'CLOSED',
      entryDate: todayStr,
      entryTime: '09:42',
      exitDate: todayStr,
      exitTime: '10:55',
      entryPrice: 135.50,
      exitPrice: 182.00,
      quantity: 150, // 3 lots
      fees: 85,
      pnl: 6890,
      pnlPercent: 33.89,
      rMultiple: 2.25,
      strategy: 'Angel One SmartAPI Auto-Sync',
      emotion: 'Disciplined',
      followedRules: true,
      notes: 'Auto-synced from Angel One TradeBook. Executed on NSE F&O.',
      lessons: 'Clean 15m breakout entry confirmed by SmartAPI fill.',
      marketSession: 'Morning / Open',
      createdAt: now - 3600000,
      updatedAt: now,
    },
    {
      id: `angel-sim-${now}-2`,
      symbol: 'BANKNIFTY 52100 PE',
      assetClass: 'Options',
      direction: 'LONG',
      status: 'CLOSED',
      entryDate: todayStr,
      entryTime: '11:15',
      exitDate: todayStr,
      exitTime: '11:48',
      entryPrice: 245.00,
      exitPrice: 218.00,
      quantity: 60, // 2 lots
      fees: 65,
      pnl: -1685,
      pnlPercent: -11.46,
      rMultiple: -1.0,
      strategy: 'Angel One SmartAPI Auto-Sync',
      emotion: 'Disciplined',
      followedRules: true,
      notes: 'Auto-synced from Angel One TradeBook. Stop loss hit cleanly.',
      lessons: 'Exited on SL strictly as planned.',
      marketSession: 'Mid-Day',
      createdAt: now - 1800000,
      updatedAt: now,
    },
    {
      id: `angel-sim-${now}-3`,
      symbol: 'RELIANCE',
      assetClass: 'Equities',
      direction: 'LONG',
      status: 'CLOSED',
      entryDate: todayStr,
      entryTime: '13:10',
      exitDate: todayStr,
      exitTime: '14:40',
      entryPrice: 2860.00,
      exitPrice: 2898.50,
      quantity: 100,
      fees: 110,
      pnl: 3740,
      pnlPercent: 1.31,
      rMultiple: 1.92,
      strategy: 'Angel One SmartAPI Auto-Sync',
      emotion: 'Disciplined',
      followedRules: true,
      notes: 'Auto-synced from Angel One TradeBook. VWAP bounce on NSE cash.',
      lessons: 'Good patience holding through mid-day consolidation.',
      marketSession: 'Power Hour',
      createdAt: now - 900000,
      updatedAt: now,
    },
  ];
}
