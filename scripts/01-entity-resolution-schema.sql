-- =====================================================
-- ENTITY RESOLUTION & CANONICALIZATION SCHEMA
-- =====================================================
-- This creates the foundation for deduplication and 
-- canonical entity management across all data sources

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy matching

-- =====================================================
-- CANONICAL ENTITIES
-- =====================================================

-- Canonical Companies Table
CREATE TABLE IF NOT EXISTS canonical_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Canonical identifiers
  canonical_name TEXT NOT NULL,
  domain TEXT UNIQUE, -- primary domain (e.g., "acme.com")
  
  -- Core data
  description TEXT,
  website TEXT,
  logo_url TEXT,
  industry TEXT,
  location TEXT,
  founded_year INTEGER,
  employee_count TEXT,
  
  -- Metadata
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Social & external IDs
  social_links JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '{}', -- {yc_id, crunchbase_id, etc}
  
  -- Tags & classification
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canonical People Table
CREATE TABLE IF NOT EXISTS canonical_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Canonical identifiers
  canonical_name TEXT NOT NULL,
  email TEXT UNIQUE, -- primary email if known
  
  -- Core data
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  current_company_id UUID REFERENCES canonical_companies(id),
  
  -- Metadata
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Social & external IDs
  social_links JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '{}',
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENTITY ALIASES & SOURCE REFERENCES
-- =====================================================

-- Company Aliases (all variations seen across sources)
CREATE TABLE IF NOT EXISTS company_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_company_id UUID NOT NULL REFERENCES canonical_companies(id) ON DELETE CASCADE,
  
  alias_name TEXT NOT NULL,
  alias_type TEXT NOT NULL, -- 'name_variation', 'domain', 'social_handle', 'legal_name'
  source TEXT NOT NULL, -- 'producthunt', 'hackernews', 'yc', 'github', etc
  source_id TEXT, -- original ID in source system
  
  confidence DECIMAL(3,2) DEFAULT 0.5,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(canonical_company_id, alias_name, source)
);

-- Person Aliases
CREATE TABLE IF NOT EXISTS person_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_person_id UUID NOT NULL REFERENCES canonical_people(id) ON DELETE CASCADE,
  
  alias_name TEXT NOT NULL,
  alias_type TEXT NOT NULL, -- 'name_variation', 'username', 'email'
  source TEXT NOT NULL,
  source_id TEXT,
  
  confidence DECIMAL(3,2) DEFAULT 0.5,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(canonical_person_id, alias_name, source)
);

-- =====================================================
-- INDEXES FOR FAST LOOKUPS & FUZZY MATCHING
-- =====================================================

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_canonical_companies_domain ON canonical_companies(domain);
CREATE INDEX IF NOT EXISTS idx_canonical_companies_name_trgm ON canonical_companies USING gin(canonical_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_canonical_companies_updated ON canonical_companies(last_updated_at DESC);

-- People indexes
CREATE INDEX IF NOT EXISTS idx_canonical_people_email ON canonical_people(email);
CREATE INDEX IF NOT EXISTS idx_canonical_people_name_trgm ON canonical_people USING gin(canonical_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_canonical_people_company ON canonical_people(current_company_id);

-- Alias indexes
CREATE INDEX IF NOT EXISTS idx_company_aliases_name ON company_aliases(alias_name);
CREATE INDEX IF NOT EXISTS idx_company_aliases_canonical ON company_aliases(canonical_company_id);
CREATE INDEX IF NOT EXISTS idx_company_aliases_source ON company_aliases(source, source_id);
CREATE INDEX IF NOT EXISTS idx_person_aliases_name ON person_aliases(alias_name);
CREATE INDEX IF NOT EXISTS idx_person_aliases_canonical ON person_aliases(canonical_person_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_canonical_companies_updated_at
  BEFORE UPDATE ON canonical_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canonical_people_updated_at
  BEFORE UPDATE ON canonical_people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Normalize company name for matching
CREATE OR REPLACE FUNCTION normalize_company_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', ' ', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Extract domain from URL
CREATE OR REPLACE FUNCTION extract_domain(url TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(url, '^https?://(www\.)?', '', 'i'),
      '/.*$', ''
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON TABLE canonical_companies IS 'Deduplicated, canonical company entities';
COMMENT ON TABLE canonical_people IS 'Deduplicated, canonical person entities';
COMMENT ON TABLE company_aliases IS 'All name variations and source references for companies';
COMMENT ON TABLE person_aliases IS 'All name variations and source references for people';
