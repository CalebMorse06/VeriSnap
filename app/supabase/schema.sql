-- VeriSnap core schema (MVP production)

create table if not exists challenges (
  id text primary key,
  creator_id text not null,
  title text not null,
  description text not null,
  objective text not null,
  location_name text not null,
  location_lat double precision not null default 0,
  location_lng double precision not null default 0,
  stake_amount_drops bigint not null,
  duration_minutes integer not null,
  status text not null,
  visibility text not null default 'private', -- private | friends | public
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  resolved_at timestamptz,
  escrow_sequence integer,
  escrow_tx_hash text,
  escrow_owner text,
  proof_cid text,
  proof_revealed boolean not null default false,
  settlement_tx text,
  verification_passed boolean,
  verification_confidence integer,
  verification_reasoning text,
  challenge_mode text default 'self',        -- self | versus
  opponent_address text,                      -- target friend wallet (versus)
  acceptor_address text                       -- who accepted the challenge
);

create index if not exists challenges_status_idx on challenges(status);
create index if not exists challenges_creator_id_idx on challenges(creator_id);
create index if not exists challenges_created_at_idx on challenges(created_at desc);
create index if not exists challenges_public_feed_idx on challenges(visibility, status, resolved_at desc) 
  where visibility = 'public' and status in ('VERIFIED', 'FAILED');

-- Dispute system
create table if not exists disputes (
  id text primary key,
  challenge_id text not null references challenges(id),
  reason text not null,
  proof_cid text not null,
  ai_reverify_passed boolean,
  ai_reverify_confidence integer,
  ai_reverify_reasoning text,
  ai_reverify_scene_description text,
  vote_deadline timestamptz not null,
  votes_pass integer not null default 0,
  votes_fail integer not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists dispute_votes (
  id text primary key,
  dispute_id text not null references disputes(id),
  voter_address text not null,
  vote text not null,
  created_at timestamptz not null default now(),
  unique(dispute_id, voter_address)
);

-- Resolution columns (added for dispute resolution feature)
-- ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_outcome text;
-- ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_reasoning text;
-- ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
-- ALTER TABLE disputes ADD COLUMN IF NOT EXISTS settlement_tx text;

create index if not exists disputes_status_idx on disputes(status);
create index if not exists disputes_challenge_id_idx on disputes(challenge_id);

-- Migration for existing tables (run if upgrading)
-- ALTER TABLE challenges ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private';
-- ALTER TABLE challenges ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
-- ALTER TABLE challenges ADD COLUMN IF NOT EXISTS proof_revealed boolean NOT NULL DEFAULT false;
-- ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenge_mode text DEFAULT 'self';
-- ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_address text;
-- ALTER TABLE challenges ADD COLUMN IF NOT EXISTS acceptor_address text;
