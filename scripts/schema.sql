CREATE SCHEMA IF NOT EXISTS genie4ai;
REVOKE ALL ON SCHEMA genie4ai FROM PUBLIC;
CREATE TABLE IF NOT EXISTS genie4ai.users (
 id uuid PRIMARY KEY, email text UNIQUE NOT NULL CHECK (email = lower(email)), password_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS genie4ai.sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES genie4ai.users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS genie4ai.subscriptions (
 id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES genie4ai.users(id), customer_id text NOT NULL,
 product_id text NOT NULL, status text NOT NULL, cancel_at_end boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS genie4ai.billing_periods (
 payment_id text PRIMARY KEY, subscription_id text NOT NULL REFERENCES genie4ai.subscriptions(id),
 user_id uuid NOT NULL REFERENCES genie4ai.users(id), product_id text NOT NULL,
 plan text NOT NULL CHECK (plan IN ('creator','pro')), interval text NOT NULL CHECK (interval IN ('month','year')),
 period_start timestamptz NOT NULL, period_end timestamptz NOT NULL,
 allowance_cents integer NOT NULL CHECK (allowance_cents IN (10000,20000)),
 revoked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (period_end > period_start), UNIQUE(subscription_id,period_start)
);
CREATE TABLE IF NOT EXISTS genie4ai.credit_windows (
 id uuid PRIMARY KEY, payment_id text NOT NULL REFERENCES genie4ai.billing_periods(payment_id),
 month_index integer NOT NULL CHECK (month_index BETWEEN 0 AND 11), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 allowance_cents integer NOT NULL CHECK (allowance_cents > 0), used_cents integer NOT NULL DEFAULT 0 CHECK (used_cents >= 0 AND used_cents <= allowance_cents),
 UNIQUE(payment_id,month_index)
);
CREATE TABLE IF NOT EXISTS genie4ai.jobs (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES genie4ai.users(id), window_id uuid NOT NULL REFERENCES genie4ai.credit_windows(id),
 request_hash text NOT NULL, provider_id text, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','failed','uncertain')),
 result jsonb, refunded boolean NOT NULL DEFAULT false, next_check_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_owner_idx ON genie4ai.jobs(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS genie4ai.webhook_events (id text PRIMARY KEY, event_type text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS genie4ai.rate_limits (key text PRIMARY KEY, count integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS genie4ai.checkout_intents (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES genie4ai.users(id), product_id text NOT NULL,
 session_id text UNIQUE, checkout_url text, expires_at timestamptz NOT NULL DEFAULT now() + interval '15 minutes', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS genie4ai.support_requests (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES genie4ai.users(id),category text NOT NULL,message text NOT NULL,
 status text NOT NULL DEFAULT 'open',created_at timestamptz NOT NULL DEFAULT now()
);
