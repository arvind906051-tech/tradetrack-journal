import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// --- TOTP Generation Helper (RFC 6238 / RFC 4226) ---
function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[\s=-]/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret: string): string {
  if (!secret) return '';
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const counter = Math.floor(epoch / timeStep);

  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));

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
}

// Helper: Format Angel One raw trading symbol to readable clean name
function cleanTradingSymbol(symbol: string): { cleanSymbol: string; assetClass: string } {
  let cleanSymbol = symbol.trim();
  let assetClass = 'Equities';

  if (cleanSymbol.endsWith('-EQ')) {
    cleanSymbol = cleanSymbol.replace('-EQ', '');
    assetClass = 'Equities';
  } else if (/CE$|PE$/i.test(cleanSymbol)) {
    assetClass = 'Options';
    // Format Option: e.g. NIFTY24OCT24800CE -> NIFTY 24800 CE
    const match = cleanSymbol.match(/^([A-Z]+)\d{2}[A-Z]{3}(\d+)(CE|PE)$/i);
    if (match) {
      cleanSymbol = `${match[1]} ${match[2]} ${match[3].toUpperCase()}`;
    }
  } else if (/FUT$/i.test(cleanSymbol)) {
    assetClass = 'Futures';
    const match = cleanSymbol.match(/^([A-Z]+)\d{2}[A-Z]{3}FUT$/i);
    if (match) {
      cleanSymbol = `${match[1]} FUT`;
    }
  } else if (cleanSymbol.includes('MCX') || /GOLD|SILVER|CRUDEOIL|NATURALGAS/i.test(cleanSymbol)) {
    assetClass = 'Commodities';
  }

  return { cleanSymbol, assetClass };
}

// --- Angel One SmartAPI Client Implementation ---
const ANGEL_API_BASE = 'https://apiconnect.angelone.in';

interface AngelTradeItem {
  exchange: string;
  producttype: string;
  tradingsymbol: string;
  symboltoken: string;
  instrumenttype?: string;
  transactiontype: 'BUY' | 'SELL';
  fillprice: string | number;
  fillsize: string | number;
  filltime: string;
  tradeid: string;
  orderid: string;
}

// 1. API: Check configuration status (environment vs configured)
app.get('/api/angel/status', (_req: Request, res: Response) => {
  const hasEnvConfig = Boolean(
    process.env.ANGEL_API_KEY &&
    process.env.ANGEL_CLIENT_ID &&
    process.env.ANGEL_MPIN &&
    process.env.ANGEL_TOTP_KEY
  );

  res.json({
    hasEnvConfig,
    configuredClientId: process.env.ANGEL_CLIENT_ID ? `${process.env.ANGEL_CLIENT_ID.substring(0, 2)}***` : null
  });
});

// 2. API: Sync trades from Angel One SmartAPI
app.post('/api/angel/sync', async (req: Request, res: Response) => {
  try {
    const { 
      apiKey = process.env.ANGEL_API_KEY,
      clientId = process.env.ANGEL_CLIENT_ID,
      mpin = process.env.ANGEL_MPIN,
      totpSecret = process.env.ANGEL_TOTP_KEY,
      isDemoMode = false
    } = req.body || {};

    // If demo mode requested, return realistic simulated Angel One synced trades
    if (isDemoMode) {
      const today = new Date().toISOString().split('T')[0];
      const demoTrades = [
        {
          id: 'angel-sync-' + Date.now() + '-1',
          symbol: 'NIFTY 24850 CE',
          assetClass: 'Options',
          direction: 'LONG',
          status: 'CLOSED',
          entryDate: today,
          entryTime: '09:32',
          exitDate: today,
          exitTime: '10:45',
          entryPrice: 135.50,
          exitPrice: 182.00,
          quantity: 150,
          fees: 60,
          pnl: 6915,
          pnlPercent: 34.02,
          rMultiple: 2.5,
          strategy: 'Angel One SmartAPI Sync',
          emotion: 'Disciplined',
          followedRules: true,
          notes: 'Auto-synced from Angel One TradeBook. Product: INTRADAY MIS.',
          lessons: 'Execution filled cleanly on Angel One SmartAPI.',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'angel-sync-' + Date.now() + '-2',
          symbol: 'TCS',
          assetClass: 'Equities',
          direction: 'LONG',
          status: 'CLOSED',
          entryDate: today,
          entryTime: '11:10',
          exitDate: today,
          exitTime: '14:20',
          entryPrice: 3880.00,
          exitPrice: 3925.00,
          quantity: 50,
          fees: 85,
          pnl: 2165,
          pnlPercent: 1.16,
          rMultiple: 1.8,
          strategy: 'Angel One SmartAPI Sync',
          emotion: 'Disciplined',
          followedRules: true,
          notes: 'Auto-synced from Angel One TradeBook. Order ID: 241019002931.',
          lessons: 'Swing intraday fill mapped.',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      return res.json({
        success: true,
        count: demoTrades.length,
        trades: demoTrades,
        rawTradesCount: 4,
        source: 'Angel One SmartAPI (Demo / Test Simulation)',
        message: 'Successfully synced simulated tradebook from Angel One SmartAPI'
      });
    }

    // Validation
    if (!apiKey || !clientId || !mpin || !totpSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing Angel One credentials. Please provide API Key, Client ID, MPIN, and TOTP Secret (or set them in .env).'
      });
    }

    // Step A: Generate TOTP
    let totpCode = '';
    try {
      totpCode = generateTOTP(totpSecret.trim());
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: `Failed to compute TOTP from secret: ${err.message}. Please check your TOTP Secret key.`
      });
    }

    // Step B: Authenticate with Angel One loginByPassword
    const commonHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '106.193.147.98',
      'X-MACAddress': 'fe80::216:3eff:fe10:1234',
      'X-PrivateKey': apiKey.trim()
    };

    const loginResponse = await fetch(`${ANGEL_API_BASE}/rest/auth/partner/v1/loginByPassword`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        clientcode: clientId.trim().toUpperCase(),
        password: mpin.trim(),
        totp: totpCode
      })
    });

    const loginText = await loginResponse.text();
    let loginData: any = {};
    try {
      loginData = loginText ? JSON.parse(loginText) : {};
    } catch {
      return res.status(loginResponse.status || 401).json({
        success: false,
        message: `Angel One Gateway responded with HTTP ${loginResponse.status}: ${loginText.slice(0, 150) || 'Invalid response from broker'}`,
      });
    }

    if (!loginResponse.ok || !loginData.status || !loginData.data?.jwtToken) {
      const errorMsg = loginData?.message || loginData?.errorcode || `Authentication failed (HTTP ${loginResponse.status})`;
      return res.status(401).json({
        success: false,
        message: `Angel One Login Error: ${errorMsg}`,
        details: loginData
      });
    }

    const jwtToken = loginData.data.jwtToken;

    // Step C: Fetch TradeBook
    const authHeaders = {
      ...commonHeaders,
      'Authorization': `Bearer ${jwtToken}`
    };

    const tradeBookResponse = await fetch(`${ANGEL_API_BASE}/rest/secure/angelbroking/order/v1/getTradeBook`, {
      method: 'GET',
      headers: authHeaders
    });

    const tradeBookText = await tradeBookResponse.text();
    let tradeBookData: any = {};
    try {
      tradeBookData = tradeBookText ? JSON.parse(tradeBookText) : {};
    } catch {
      return res.status(tradeBookResponse.status || 400).json({
        success: false,
        message: `Angel One TradeBook error (HTTP ${tradeBookResponse.status}): ${tradeBookText.slice(0, 150)}`
      });
    }

    if (!tradeBookResponse.ok || !tradeBookData.status) {
      return res.status(400).json({
        success: false,
        message: `Failed to fetch TradeBook: ${tradeBookData?.message || 'Unknown broker error'}`,
        details: tradeBookData
      });
    }

    const rawTrades: AngelTradeItem[] = tradeBookData.data || [];

    if (!Array.isArray(rawTrades) || rawTrades.length === 0) {
      return res.json({
        success: true,
        count: 0,
        trades: [],
        rawTradesCount: 0,
        message: 'Login successful. No trades found executed in your Angel One account today.'
      });
    }

    // Step D: Map raw trade executions into TradeTrack Trade objects
    // Group transactions by trading symbol
    const grouped: Record<string, {
      symbol: string;
      rawSymbol: string;
      assetClass: string;
      buys: { price: number; qty: number; time: string }[];
      sells: { price: number; qty: number; time: string }[];
    }> = {};

    rawTrades.forEach(item => {
      const { cleanSymbol, assetClass } = cleanTradingSymbol(item.tradingsymbol);
      if (!grouped[cleanSymbol]) {
        grouped[cleanSymbol] = {
          symbol: cleanSymbol,
          rawSymbol: item.tradingsymbol,
          assetClass,
          buys: [],
          sells: []
        };
      }

      const price = Number(item.fillprice) || 0;
      const qty = Number(item.fillsize) || 0;
      const time = item.filltime ? item.filltime.substring(0, 5) : '09:30';

      if (item.transactiontype === 'BUY') {
        grouped[cleanSymbol].buys.push({ price, qty, time });
      } else {
        grouped[cleanSymbol].sells.push({ price, qty, time });
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const mappedTrades: any[] = [];

    Object.values(grouped).forEach((group, idx) => {
      const totalBuyQty = group.buys.reduce((sum, b) => sum + b.qty, 0);
      const totalSellQty = group.sells.reduce((sum, s) => sum + s.qty, 0);

      const weightedBuyPrice = totalBuyQty > 0
        ? group.buys.reduce((sum, b) => sum + b.price * b.qty, 0) / totalBuyQty
        : 0;

      const weightedSellPrice = totalSellQty > 0
        ? group.sells.reduce((sum, s) => sum + s.price * s.qty, 0) / totalSellQty
        : 0;

      // Determine trade structure
      if (totalBuyQty > 0 && totalSellQty > 0) {
        // Closed or partially closed trade
        const executedQty = Math.min(totalBuyQty, totalSellQty);
        const rawPnl = (weightedSellPrice - weightedBuyPrice) * executedQty;
        const estFees = Math.min(80, Math.max(30, Number((executedQty * 0.05).toFixed(2))));
        const netPnl = Number((rawPnl - estFees).toFixed(2));
        const cost = weightedBuyPrice * executedQty;
        const pnlPercent = cost > 0 ? Number(((netPnl / cost) * 100).toFixed(2)) : 0;

        mappedTrades.push({
          id: `angel-${Date.now()}-${idx}`,
          symbol: group.symbol,
          assetClass: group.assetClass,
          direction: 'LONG',
          status: totalBuyQty === totalSellQty ? 'CLOSED' : 'OPEN',
          entryDate: todayStr,
          entryTime: group.buys[0]?.time || '09:30',
          exitDate: todayStr,
          exitTime: group.sells[group.sells.length - 1]?.time || '15:15',
          entryPrice: Number(weightedBuyPrice.toFixed(2)),
          exitPrice: Number(weightedSellPrice.toFixed(2)),
          quantity: executedQty,
          fees: estFees,
          pnl: netPnl,
          pnlPercent,
          rMultiple: netPnl > 0 ? 2.0 : -1.0,
          strategy: 'Angel One SmartAPI Sync',
          emotion: 'Disciplined',
          followedRules: true,
          notes: `Auto-synced from Angel One TradeBook. Raw: ${group.rawSymbol}. Total Buy Qty: ${totalBuyQty}, Total Sell Qty: ${totalSellQty}`,
          lessons: 'Synced via SmartAPI REST client.',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else if (totalBuyQty > 0 && totalSellQty === 0) {
        // Open Long Position
        mappedTrades.push({
          id: `angel-${Date.now()}-${idx}`,
          symbol: group.symbol,
          assetClass: group.assetClass,
          direction: 'LONG',
          status: 'OPEN',
          entryDate: todayStr,
          entryTime: group.buys[0]?.time || '09:30',
          entryPrice: Number(weightedBuyPrice.toFixed(2)),
          quantity: totalBuyQty,
          fees: 40,
          pnl: 0,
          pnlPercent: 0,
          strategy: 'Angel One SmartAPI Sync',
          emotion: 'Disciplined',
          followedRules: true,
          notes: `Open position from Angel One. Current holding: ${totalBuyQty} units.`,
          lessons: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else if (totalSellQty > 0 && totalBuyQty === 0) {
        // Open Short Position (Intraday sell)
        mappedTrades.push({
          id: `angel-${Date.now()}-${idx}`,
          symbol: group.symbol,
          assetClass: group.assetClass,
          direction: 'SHORT',
          status: 'OPEN',
          entryDate: todayStr,
          entryTime: group.sells[0]?.time || '09:30',
          entryPrice: Number(weightedSellPrice.toFixed(2)),
          quantity: totalSellQty,
          fees: 40,
          pnl: 0,
          pnlPercent: 0,
          strategy: 'Angel One SmartAPI Sync',
          emotion: 'Disciplined',
          followedRules: true,
          notes: `Open Short position from Angel One: ${totalSellQty} units.`,
          lessons: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    });

    return res.json({
      success: true,
      count: mappedTrades.length,
      trades: mappedTrades,
      rawTradesCount: rawTrades.length,
      message: `Successfully synced ${mappedTrades.length} trades (${rawTrades.length} order fills) from Angel One SmartAPI.`
    });

  } catch (error: any) {
    console.error('Angel One sync error:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error during Angel One sync: ${error.message || 'Unknown error'}`
    });
  }
});

// --- Frontend mounting (Vite in dev, dist in prod) ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TradeTrack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
