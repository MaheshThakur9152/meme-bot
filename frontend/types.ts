
export interface Trade {
  id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING';
  profit?: number;
}

export interface TweetSignal {
  id: string;
  user: string;
  handle: string;
  content: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impact: number;
  timestamp: string;
}

export interface PerformanceData {
  time: string;
  value: number;
}

export interface Stats {
  winRate: number;
  totalTrades: number;
  activeBots: number;
  dailyProfit: number;
}
