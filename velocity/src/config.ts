export const config = {
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS || 500), // 0.5s
  ACCOUNTS: (process.env.ACCOUNTS || 'A,B,C').split(','),
  RPC_URL: process.env.RPC_URL || 'https://api.devnet.solana.com',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  SEND_ENABLED: (process.env.SEND_ENABLED || 'false') === 'true',
  AUTO_SWITCH: (process.env.AUTO_SWITCH || 'false') === 'true',
  PAYER_PRIVATE_KEY_BASE58: process.env.PAYER_PRIVATE_KEY_BASE58 || '',
  HYPE_THRESHOLD: Number(process.env.HYPE_THRESHOLD || 0.8),
  PAPER_TO_LIVE_WINRATE: Number(process.env.PAPER_TO_LIVE_WINRATE || 0.8),
  PAPER_TO_LIVE_MIN_TRADES: Number(process.env.PAPER_TO_LIVE_MIN_TRADES || 50),
  JUPITER_API_URL: process.env.JUPITER_API_URL || 'https://quote-api.jup.ag',
  // Volume Velocity Manager defaults
  VVM_WINDOW_MS: Number(process.env.VVM_WINDOW_MS || 5 * 60 * 1000),
  VVM_THRESHOLD_VOLUME: Number(process.env.VVM_THRESHOLD_VOLUME || 5000),
  VVM_THRESHOLD_BUYERS: Number(process.env.VVM_THRESHOLD_BUYERS || 20),
  PORT: Number(process.env.PORT || 8080),
};
