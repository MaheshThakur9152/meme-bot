
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  LayoutDashboard, 
  History, 
  Settings, 
  Bell, 
  Search,
  Zap,
  Cpu
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Trade, TweetSignal, PerformanceData, Stats } from './types';
import { getMarketSentimentAnalysis } from './services/geminiService';

// Note: 'TweetSignal' type is reused for short signals in this prototype; rename as needed for clarity.

// Mock Data Generators
const generateMockPerformance = (): PerformanceData[] => {
  const data = [];
  let baseValue = 10000;
  for (let i = 0; i < 30; i++) {
    baseValue += Math.random() * 1000 - 450;
    data.push({
      time: `Oct ${i + 1}`,
      value: parseFloat(baseValue.toFixed(2))
    });
  }
  return data;
};

const mockSignals: TweetSignal[] = [
  { id: '1', user: 'CryptoWhale', handle: '@whale_alert', content: 'Massive BTC inflow to exchanges. Potential volatility ahead.', sentiment: 'BEARISH', impact: 0.8, timestamp: '2m ago' },
  { id: '2', user: 'WhalePing', handle: '@whale_ping', content: 'Large SOL buys on Raydium.', sentiment: 'BULLISH', impact: 0.95, timestamp: '5m ago' },
  { id: '3', user: 'DexWatcher', handle: '@dex_watch', content: 'New pair RAY-XYZ created, initial liquidity added.', sentiment: 'NEUTRAL', impact: 0.7, timestamp: '15m ago' },
  { id: '4', user: 'MarketWatcher', handle: '@mkt_watch', content: 'New pool detected; monitoring volume velocity.', sentiment: 'NEUTRAL', impact: 0.6, timestamp: '22m ago' },
];

const mockTrades: Trade[] = [
  { id: 'tx_1', asset: 'BTC/USDT', type: 'BUY', price: 62450.25, amount: 0.05, timestamp: '14:20:05', status: 'COMPLETED', profit: 125.40 },
  { id: 'tx_2', asset: 'ETH/USDT', type: 'SELL', price: 2450.80, amount: 1.2, timestamp: '13:45:12', status: 'COMPLETED', profit: -42.10 },
  { id: 'tx_3', asset: 'SOL/USDT', type: 'BUY', price: 145.20, amount: 15.0, timestamp: '12:10:45', status: 'COMPLETED', profit: 210.80 },
  { id: 'tx_4', asset: 'DOGE/USDT', type: 'BUY', price: 0.12, amount: 5000, timestamp: '11:55:01', status: 'COMPLETED', profit: 88.00 },
];

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
    {icon}
    <span className="font-medium">{label}</span>
  </div>
);

const StatCard: React.FC<{ label: string; value: string; trend?: number; icon: React.ReactNode }> = ({ label, value, trend, icon }) => (
  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-800 rounded-lg text-blue-400">
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`flex items-center text-sm font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold mt-1 text-white">{value}</h3>
    </div>
  </div>
);

const App: React.FC = () => {
  const [performanceData] = useState(generateMockPerformance());
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [aiAnalysis, setAiAnalysis] = useState<string>("Initializing AI Market Sentiment analysis...");

  useEffect(() => {
    const fetchAnalysis = async () => {
      const result = await getMarketSentimentAnalysis(mockSignals);
      setAiAnalysis(result?.summary || JSON.stringify(result));
    };
    fetchAnalysis();
  }, []);

  const stats: Stats = useMemo(() => ({
    winRate: 78.5,
    totalTrades: 1248,
    activeBots: 4,
    dailyProfit: 452.12
  }), []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-2">
          <div className="w-10 h-10 crypto-gradient rounded-xl flex items-center justify-center">
            <Zap className="text-white fill-current" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            SENTIX
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} />
          <SidebarItem icon={<Twitter size={20} />} label="Signals" active={activeTab === 'Signals'} />
          <SidebarItem icon={<History size={20} />} label="History" active={activeTab === 'History'} />
          <SidebarItem icon={<Cpu size={20} />} label="Bots" active={activeTab === 'Bots'} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'Settings'} />
        </nav>

        <div className="p-6">
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-2">Portfolio Balance</p>
            <h4 className="text-lg font-bold text-white">$42,950.40</h4>
            <button className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors">
              Add Funds
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search markets, signals, assets..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell size={20} className="text-slate-400 cursor-pointer hover:text-white" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">Alex Rivera</p>
                <p className="text-xs text-slate-500">Pro Trader</p>
              </div>
              <img src="https://picsum.photos/seed/trader/40/40" className="w-10 h-10 rounded-full border border-slate-700" alt="avatar" />
            </div>
          </div>
        </header>

        {/* Dashboard View */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Top Row: Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Overall Win Rate" value={`${stats.winRate}%`} trend={2.4} icon={<Activity size={24} />} />
            <StatCard label="Daily Profit" value={`+$${stats.dailyProfit}`} trend={5.8} icon={<TrendingUp size={24} />} />
            <StatCard label="Total Trades" value={stats.totalTrades.toLocaleString()} icon={<History size={24} />} />
            <StatCard label="Active Bots" value={stats.activeBots.toString()} icon={<Cpu size={24} />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Performance Chart */}
            <div className="xl:col-span-2 glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white">Profit Performance</h3>
                  <p className="text-slate-400 text-sm">30-day growth and trading efficiency</p>
                </div>
                <div className="flex gap-2">
                  {['1D', '1W', '1M', '1Y'].map(range => (
                    <button key={range} className={`px-3 py-1 rounded-md text-xs font-semibold ${range === '1M' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Twitter AI Insight Panel */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                <Zap className="text-blue-400" />
                <h3 className="text-xl font-bold text-white">AI Market Context</h3>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">AI Analysis</p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{aiAnalysis}"
                  </p>
                </div>

                <div className="space-y-3 mt-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Signals</h4>
                  {mockSignals.map(sig => (
                    <div key={sig.id} className="p-3 border border-slate-800 rounded-xl hover:bg-slate-900/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-slate-200">{sig.user}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sig.sentiment === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {sig.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{sig.content}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
                        <span>{sig.handle}</span>
                        <span>{sig.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table: Trade Logs */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Recent Executions</h3>
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">View All Transactions</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Asset</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                    <th className="px-6 py-4 font-semibold">Profit/Loss</th>
                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {mockTrades.map(trade => (
                    <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{trade.asset}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">${trade.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-300">{trade.amount}</td>
                      <td className="px-6 py-4 text-slate-500">{trade.timestamp}</td>
                      <td className={`px-6 py-4 font-semibold ${trade.profit! >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.profit! >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                          <span className="text-[10px] font-bold text-slate-300 uppercase">Completed</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
