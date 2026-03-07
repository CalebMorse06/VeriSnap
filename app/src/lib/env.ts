type EnvKey =
  | "PINATA_JWT"
  | "GEMINI_API_KEY"
  | "XRPL_SERVER"
  | "XRPL_APP_WALLET_ADDRESS"
  | "XRPL_APP_WALLET_SEED";

export function requireEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export function getRuntimeConfig() {
  return {
    pinataConfigured: Boolean(process.env.PINATA_JWT),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    xrplConfigured: Boolean(process.env.XRPL_APP_WALLET_ADDRESS && process.env.XRPL_APP_WALLET_SEED),
    xrplServer: process.env.XRPL_SERVER || "wss://s.altnet.rippletest.net:51233",
  };
}
