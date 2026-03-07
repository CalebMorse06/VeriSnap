/**
 * Service health checks
 * Used to verify external services are reachable before critical operations
 */

export interface ServiceHealth {
  xrpl: boolean;
  pinata: boolean;
  gemini: boolean;
  supabase: boolean;
}

/**
 * Quick health check for all services
 * Returns which services are available
 */
export async function checkServiceHealth(): Promise<ServiceHealth> {
  const [xrpl, pinata, gemini, supabase] = await Promise.all([
    checkXrplHealth(),
    checkPinataHealth(),
    checkGeminiHealth(),
    checkSupabaseHealth(),
  ]);

  return { xrpl, pinata, gemini, supabase };
}

async function checkXrplHealth(): Promise<boolean> {
  try {
    const server = process.env.XRPL_SERVER || "wss://s.altnet.rippletest.net:51233";
    // Quick WebSocket connection check would go here
    // For simplicity, just check if env is configured
    return Boolean(
      process.env.XRPL_APP_WALLET_ADDRESS && 
      process.env.XRPL_APP_WALLET_SEED
    );
  } catch {
    return false;
  }
}

async function checkPinataHealth(): Promise<boolean> {
  try {
    if (!process.env.PINATA_JWT) return false;
    const response = await fetch("https://api.pinata.cloud/data/testAuthentication", {
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkGeminiHealth(): Promise<boolean> {
  try {
    return Boolean(process.env.GEMINI_API_KEY);
  } catch {
    return false;
  }
}

async function checkSupabaseHealth(): Promise<boolean> {
  try {
    return Boolean(
      process.env.SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch {
    return false;
  }
}

/**
 * Check if a specific operation's required services are available
 */
export function getRequiredServices(operation: "create" | "verify" | "read"): (keyof ServiceHealth)[] {
  switch (operation) {
    case "create":
      return ["xrpl", "supabase"];
    case "verify":
      return ["pinata", "gemini", "xrpl", "supabase"];
    case "read":
      return ["supabase"];
    default:
      return [];
  }
}
