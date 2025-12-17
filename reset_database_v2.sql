-- DANGEROUS SCRIPT: RESTORES DATABASE TO CLEAN STATE
-- Matches APP V9 Types exactly.

-- 1. CLEANUP (Drop Order Matters due to FKs)
DROP TABLE IF EXISTS property_marketing_logs CASCADE;
DROP TABLE IF EXISTS marketing_logs CASCADE; -- Handle legacy table name just in case
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS buyer_searches CASCADE;
DROP TABLE IF EXISTS closing_logs CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS buyer_clients CASCADE;
DROP TABLE IF EXISTS seller_clients CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- 2. CREATE TABLES (With JSONB for flexibility)

-- User Roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mother', 'child')),
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User Settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    annual_billing NUMERIC DEFAULT 120000,
    monthly_need NUMERIC DEFAULT 1500,
    average_ticket NUMERIC DEFAULT 4000,
    commission_split NUMERIC DEFAULT 45,
    commercial_weeks NUMERIC DEFAULT 40,
    exchange_rate NUMERIC DEFAULT 1000,
    manual_ratio NUMERIC,
    is_manual_ratio BOOLEAN DEFAULT FALSE,
    is_manual_ticket BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL,
    contact_id TEXT,
    contact_name TEXT,
    notes TEXT,
    reference_id TEXT,
    system_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller Clients
CREATE TABLE seller_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_by_email TEXT,
    profile_type TEXT DEFAULT 'particular',
    owners JSONB DEFAULT '[]', -- List of {name, phone, etc}
    contact JSONB DEFAULT '{}', -- {email, phone, address...}
    notes TEXT,
    tags JSONB DEFAULT '[]',
    ai_profile_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer Clients
CREATE TABLE buyer_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_by_email TEXT,
    name TEXT NOT NULL,
    dni TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES seller_clients(id),
    created_by_email TEXT,
    custom_id TEXT,
    status TEXT DEFAULT 'suspendida',
    type TEXT DEFAULT 'departamento',
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    credit_eligible BOOLEAN DEFAULT FALSE,
    
    -- JSONB Columns for complex nested data from App.tsx
    address JSONB DEFAULT '{}',
    surface JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    amenities JSONB DEFAULT '[]',
    hvac TEXT DEFAULT 'gas',
    legal JSONB DEFAULT '{}',
    expenses JSONB DEFAULT '{}',
    logistics JSONB DEFAULT '{}',
    files JSONB DEFAULT '{}', -- {photos:[], documents:[]}
    ai_analysis TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer Searches
CREATE TABLE buyer_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    buyer_client_id UUID REFERENCES buyer_clients(id) ON DELETE CASCADE,
    agent_name TEXT,
    status TEXT DEFAULT 'activo',
    search_profile JSONB DEFAULT '{}', -- Large config object
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visits
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    buyer_client_id UUID REFERENCES buyer_clients(id) ON DELETE SET NULL,
    agent_name TEXT,
    source TEXT,
    date TEXT, -- YYYY-MM-DD
    time TEXT,
    duration TEXT,
    meeting_point TEXT,
    security_check BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pendiente',
    signed_confirmation BOOLEAN DEFAULT FALSE,
    signed_confirmation_file TEXT,
    feedback TEXT,
    next_steps TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Closing Logs
CREATE TABLE closing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    property_id UUID, -- Optional link
    manual_property TEXT,
    buyer_client_id UUID, -- Optional link
    manual_buyer TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    agent_name TEXT,
    sale_price NUMERIC,
    currency TEXT,
    commission_percent NUMERIC,
    sides NUMERIC,
    is_shared BOOLEAN,
    total_billing NUMERIC,
    agent_honorarium NUMERIC,
    operation_type TEXT DEFAULT 'venta',
    sub_split_percent NUMERIC DEFAULT 100,
    exchange_rate_snapshot NUMERIC,
    referral_sides_applied NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Marketing Logs
CREATE TABLE property_marketing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT NOW(),
    period_type TEXT DEFAULT '14_days',
    marketplace JSONB DEFAULT '{}',
    social JSONB DEFAULT '{}',
    ads JSONB DEFAULT '{}'
);

-- 3. ENABLE RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_marketing_logs ENABLE ROW LEVEL SECURITY;

-- 4. APPLY SIMPLIFIED POLICIES (No Recursion)
-- Target User: gabriel.v.g06@gmail.com

CREATE POLICY "Access_user_roles" ON user_roles FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_user_settings" ON user_settings FOR ALL USING (auth.uid() = user_id); -- Strict for settings? Or allow mom? Let's allow mom to be safe.
-- CREATE POLICY "Access_user_settings_mom" ON user_settings FOR ALL USING (auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'); -- Optional

CREATE POLICY "Access_activities" ON activities FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_seller_clients" ON seller_clients FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_buyer_clients" ON buyer_clients FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_properties" ON properties FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_buyer_searches" ON buyer_searches FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_visits" ON visits FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_closing_logs" ON closing_logs FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
CREATE POLICY "Access_property_marketing_logs" ON property_marketing_logs FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');
