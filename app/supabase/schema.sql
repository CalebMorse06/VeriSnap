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
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  escrow_sequence integer,
  escrow_tx_hash text,
  escrow_owner text,
  proof_cid text,
  settlement_tx text,
  verification_passed boolean,
  verification_confidence integer,
  verification_reasoning text
);

create index if not exists challenges_status_idx on challenges(status);
create index if not exists challenges_creator_id_idx on challenges(creator_id);
create index if not exists challenges_created_at_idx on challenges(created_at desc);
