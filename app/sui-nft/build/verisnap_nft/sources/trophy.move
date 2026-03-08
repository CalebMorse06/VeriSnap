/// VeriSnap NFT — Proof-of-completion trophy minted on SUI.
/// Each completed challenge mints an immutable on-chain record
/// with the verification data, proof CID, and challenge metadata.
module verisnap_nft::trophy {
    use std::string::String;
    use sui::event;

    /// The NFT object — owned by the app wallet, transferable to the winner later.
    public struct Trophy has key, store {
        id: UID,
        challenge_id: String,
        title: String,
        proof_cid: String,
        confidence: u64,
        verified_at: u64,
        winner: address,
    }

    /// Emitted on mint for indexing.
    public struct TrophyMinted has copy, drop {
        trophy_id: ID,
        challenge_id: String,
        winner: address,
    }

    /// Mint a new trophy NFT. Called by the VeriSnap app wallet after verification passes.
    public entry fun mint(
        challenge_id: String,
        title: String,
        proof_cid: String,
        confidence: u64,
        verified_at: u64,
        winner: address,
        ctx: &mut TxContext,
    ) {
        let trophy = Trophy {
            id: object::new(ctx),
            challenge_id,
            title,
            proof_cid,
            confidence,
            verified_at,
            winner,
        };

        event::emit(TrophyMinted {
            trophy_id: object::id(&trophy),
            challenge_id: trophy.challenge_id,
            winner,
        });

        // Transfer to winner's address (or app wallet if winner has no SUI wallet)
        transfer::public_transfer(trophy, winner);
    }
}
