import { NextRequest, NextResponse } from "next/server";
import { getClient, dropsToXrp } from "@/lib/xrpl";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !address.startsWith("r")) {
    return NextResponse.json({ success: false, error: "Invalid address" }, { status: 400 });
  }

  try {
    const xrplClient = await getClient();

    // Fetch balance
    const infoResp = await xrplClient.request({
      command: "account_info",
      account: address,
    });
    const balanceXrp = String(dropsToXrp(infoResp.result.account_data.Balance));

    // Fetch recent transactions
    const txResp = await xrplClient.request({
      command: "account_tx",
      account: address,
      limit: 20,
    });

    const transactions = (txResp.result.transactions || []).map((entry: any) => {
      const tx = entry.tx_json || entry.tx || {};
      const meta = entry.meta || {};
      const delivered = meta.delivered_amount;
      const amountDrops = typeof delivered === "string" ? delivered : tx.Amount;
      const amountXrp = amountDrops ? String(dropsToXrp(String(amountDrops))) : null;

      // Decode memo if present
      let memoText: string | null = null;
      if (tx.Memos && tx.Memos.length > 0) {
        try {
          const hex = tx.Memos[0].Memo?.MemoData;
          if (hex) memoText = Buffer.from(hex, "hex").toString("utf8");
        } catch { /* ignore */ }
      }

      return {
        hash: tx.hash || entry.hash,
        type: tx.TransactionType,
        from: tx.Account,
        to: tx.Destination,
        amount: amountXrp,
        memo: memoText,
        date: tx.date, // XRPL epoch seconds
        success: meta.TransactionResult === "tesSUCCESS",
      };
    });

    return NextResponse.json({
      success: true,
      address,
      balance: balanceXrp,
      transactions,
    });
  } catch (error: any) {
    // Account not found is normal for unfunded wallets
    if (error?.data?.error === "actNotFound") {
      return NextResponse.json({
        success: true,
        address,
        balance: "0",
        transactions: [],
      });
    }
    console.error("[Wallet/Live] Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
