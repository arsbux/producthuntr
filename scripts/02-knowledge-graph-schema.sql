-- =====================================================
-- KNOWLEDGE GRAPH SCHEMA
-- =====================================================
-- Models relationships between entities as a graph
-- Supports queries like "who founded what", "who invested in whom"

-- =====================================================
-- GRAPH NODES (Entity Types)
-- =====================================================

-- Investors/VCs
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- 'vc_firm', 'angel', 'accelerator', 'corporate'
  website TEXT,
  description TEXT,
  
  -- Metadata
  total_investments INTEGER DEFAULT 0,
  notable_investments TEXT[],
  focus_areas TEXT[],
  
  social_links JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding Rounds
CREATE TABLE IF NOT EXISTS funding_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES canonical_companies(id) ON DELETE CASCADE,
  
  round_type TEXT NOT NULL, -- 'pre_seed', 'seed', 'series_a', etc
  amount_usd BIGINT,
  currency TEXT DEFAULT 'USD',
  announced_date DATE,
  
  lead_investor_id UUID REFERENCES investors(id),
  valuation_usd BIGINT,
  
  source TEXT NOT NULL,
  source_url TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles/Press Mentions
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  published_date TIMESTAMPTZ,
  source TEXT NOT NULL, -- 'techcrunch', 'venturebeat', etc
  author TEXT,
  
  content_snippet TEXT,
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repositories (GitHub, GitLab, etc)
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL,
  full_name TEXT UNIQUE NOT NULL, -- 'owner/repo'
  url TEXT NOT NULL,
  description TEXT,
  
  platform TEXT DEFAULT 'github',
  language TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  
  owner_type TEXT, -- 'company', 'person'
  owner_id UUID, -- references canonical_companies or canonical_people
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Releases/Launches
CREATE TABLE IF NOT EXISTS product_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES canonical_companies(id) ON DELETE CASCADE,
  
  product_name TEXT NOT NULL,
  version TEXT,
  release_date DATE NOT NULL,
  release_type TEXT, -- 'major', 'minor', 'patch', 'launch'
  
  description TEXT,
  url TEXT,
  
  source TEXT NOT NULL,
  impact_score DECIMAL(3,2) DEFAULT 0.5,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES canonical_companies(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  remote_ok BOOLEAN DEFAULT false,
  
  posted_date DATE,
  url TEXT,
  source TEXT NOT NULL,
  
  is_growth_role BOOLEAN DEFAULT false, -- BD, marketing, sales
  seniority_level TEXT, -- 'entry', 'mid', 'senior', 'lead', 'executive'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GRAPH EDGES (Relationships)
-- =====================================================

-- Generic relationship table for flexibility
CREATE TABLE IF NOT EXISTS entity_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Source and target can be any entity type
  source_type TEXT NOT NULL, -- 'company', 'person', 'investor', 'article', etc
  source_id UUID NOT NULL,
  
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  
  relationship_type TEXT NOT NULL, -- 'FOUNDED_BY', 'INVESTED_IN', 'HIRED', etc
  
  -- Relationship metadata
  started_at DATE,
  ended_at DATE,
  is_current BOOLEAN DEFAULT true,
  
  confidence DECIMAL(3,2) DEFAULT 0.5,
  source TEXT NOT NULL, -- where this relationship was discovered
  source_url TEXT,
  
  metadata JSONB DEFAULT '{}', -- flexible additional data
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(source_type, source_id, target_type, target_id, relationship_type)
);

-- Specific relationship tables for common patterns (optional, for performance)

-- Company-Person relationships
CREATE TABLE IF NOT EXISTS company_person_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES canonical_companies(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES canonical_people(id) ON DELETE CASCADE,
  
  relationship_type TEXT NOT NULL, -- 'founder', 'ceo', 'cto', 'employee', 'advisor'
  title TEXT,
  
  started_at DATE,
  ended_at DATE,
  is_current BOOLEAN DEFAULT true,
  
  source TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company-Investor relationships
CREATE TABLE IF NOT EXISTS company_investor_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES canonical_companies(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  
  funding_round_id UUID REFERENCES funding_rounds(id),
  investment_date DATE,
  is_lead BOOLEAN DEFAULT false,
  
  source TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR GRAPH QUERIES
-- =====================================================

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_type ON entity_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_current ON entity_relationships(is_current) WHERE is_current = true;

-- Specific relationship indexes
CREATE INDEX IF NOT EXISTS idx_company_person_company ON company_person_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_person_person ON company_person_relationships(person_id);
CREATE INDEX IF NOT EXISTS idx_company_person_current ON company_person_relationships(is_current) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_company_investor_company ON company_investor_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_investor_investor ON company_investor_relationships(investor_id);

-- Node indexes
CREATE INDEX IF NOT EXISTS idx_funding_rounds_company ON funding_rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_date ON funding_rounds(announced_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_repositories_owner ON repositories(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_product_releases_company ON product_releases(company_id);
CREATE INDEX IF NOT EXISTS idx_product_releases_date ON product_releases(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_growth ON job_postings(is_growth_role) WHERE is_growth_role = true;

-- =====================================================
-- GRAPH QUERY HELPER FUNCTIONS
-- =====================================================

-- Get all relationships for an entity
CREATE OR REPLACE FUNCTION get_entity_relationships(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_direction TEXT DEFAULT 'both' -- 'outgoing', 'incoming', 'both'
)
RETURNS TABLE (
  relationship_id UUID,
  relationship_type TEXT,
  other_entity_type TEXT,
  other_entity_id UUID,
  direction TEXT,
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.relationship_type,
    CASE 
      WHEN er.source_type = p_entity_type AND er.source_id = p_entity_id 
      THEN er.target_type 
      ELSE er.source_type 
    END,
    CASE 
      WHEN er.source_type = p_entity_type AND er.source_id = p_entity_id 
      THEN er.target_id 
      ELSE er.source_id 
    END,
    CASE 
      WHEN er.source_type = p_entity_type AND er.source_id = p_entity_id 
      THEN 'outgoing' 
      ELSE 'incoming' 
    END::TEXT,
    er.confidence
  FROM entity_relationships er
  WHERE 
    (p_direction IN ('outgoing', 'both') AND er.source_type = p_entity_type AND er.source_id = p_entity_id)
    OR
    (p_direction IN ('incoming', 'both') AND er.target_type = p_entity_type AND er.target_id = p_entity_id);
END;
$$ LANGUAGE plpgsql;

-- Get company founders
CREATE OR REPLACE FUNCTION get_company_founders(p_company_id UUID)
RETURNS TABLE (
  person_id UUID,
  person_name TEXT,
  title TEXT,
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.person_id,
    p.canonical_name,
    cpr.title,
    cpr.confidence
  FROM company_person_relationships cpr
  JOIN canonical_people p ON p.id = cpr.person_id
  WHERE cpr.company_id = p_company_id
    AND cpr.relationship_type = 'founder'
    AND cpr.is_current = true
  ORDER BY cpr.confidence DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE entity_relationships IS 'Generic graph edges between any entity types';
COMMENT ON TABLE company_person_relationships IS 'Optimized company-person relationships';
COMMENT ON TABLE funding_rounds IS 'Company funding events';
COMMENT ON TABLE investors IS 'VCs, angels, and other investors';
