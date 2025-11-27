-- =====================================================
-- SIGNAL ENRICHMENT & TIMELINE SCHEMA
-- =====================================================
-- Time-series tracking of all signals per entity
-- Enables timeline views and trend analysis

-- =====================================================
-- SIGNAL EVENTS (Time-series)
-- =====================================================

CREATE TABLE IF NOT EXISTS signal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Entity reference
  entity_type TEXT NOT NULL, -- 'company', 'person'
  entity_id UUID NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'funding', 'launch', 'hire', 'press', 'release', etc
  event_date DATE NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  
  -- Signal scoring
  impact_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  confidence DECIMAL(3,2) DEFAULT 0.5,
  
  -- Source tracking
  source TEXT NOT NULL, -- 'producthunt', 'hackernews', 'yc', etc
  source_id TEXT,
  source_url TEXT,
  
  -- Enrichment data
  metadata JSONB DEFAULT '{}', -- flexible storage for source-specific data
  
  -- Deduplication
  content_hash TEXT, -- hash of key fields to detect duplicates
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, event_type, event_date, source, source_id)
);

-- =====================================================
-- ENTITY METRICS (Aggregated time-series)
-- =====================================================

-- Daily/weekly/monthly rollups for fast queries
CREATE TABLE IF NOT EXISTS entity_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  metric_date DATE NOT NULL,
  period_type TEXT NOT NULL, -- 'day', 'week', 'month'
  
  -- Aggregated metrics
  total_signals INTEGER DEFAULT 0,
  high_impact_signals INTEGER DEFAULT 0,
  avg_impact_score DECIMAL(3,2),
  
  -- Signal type breakdown
  signal_type_counts JSONB DEFAULT '{}', -- {funding: 2, hiring: 5, ...}
  
  -- Velocity metrics
  signal_velocity DECIMAL(5,2), -- signals per day
  momentum_score DECIMAL(3,2), -- trending up/down
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, metric_date, period_type)
);

-- =====================================================
-- ENTITY SCORES (Current state)
-- =====================================================

CREATE TABLE IF NOT EXISTS entity_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Overall impact score (0-100)
  impact_score INTEGER DEFAULT 0,
  
  -- Score breakdown
  score_components JSONB DEFAULT '{}', -- {recency: 20, velocity: 15, source_weight: 30, ...}
  
  -- Trend indicators
  trend_7d TEXT, -- 'up', 'down', 'stable'
  trend_30d TEXT,
  velocity_7d DECIMAL(5,2),
  velocity_30d DECIMAL(5,2),
  
  -- Signal summary
  total_signals INTEGER DEFAULT 0,
  recent_signals_7d INTEGER DEFAULT 0,
  recent_signals_30d INTEGER DEFAULT 0,
  
  -- Last activity
  last_signal_date DATE,
  last_high_impact_date DATE,
  
  -- Recommended action
  recommended_action TEXT,
  action_priority TEXT, -- 'high', 'medium', 'low'
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id)
);

-- =====================================================
-- SIGNAL EVIDENCE (Explainability)
-- =====================================================

-- Links between scores and the evidence that supports them
CREATE TABLE IF NOT EXISTS signal_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  signal_event_id UUID REFERENCES signal_events(id) ON DELETE CASCADE,
  
  evidence_type TEXT NOT NULL, -- 'funding', 'hiring_spike', 'press_mention', etc
  weight DECIMAL(3,2) DEFAULT 0.5, -- contribution to overall score
  
  summary TEXT NOT NULL, -- one-line explanation
  details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR TIMELINE QUERIES
-- =====================================================

-- Signal events
CREATE INDEX IF NOT EXISTS idx_signal_events_entity ON signal_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signal_events_date ON signal_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_signal_events_type ON signal_events(event_type);
CREATE INDEX IF NOT EXISTS idx_signal_events_impact ON signal_events(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_signal_events_source ON signal_events(source);
CREATE INDEX IF NOT EXISTS idx_signal_events_hash ON signal_events(content_hash);

-- Entity metrics
CREATE INDEX IF NOT EXISTS idx_entity_metrics_entity ON entity_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_metrics_date ON entity_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_entity_metrics_period ON entity_metrics(period_type);

-- Entity scores
CREATE INDEX IF NOT EXISTS idx_entity_scores_entity ON entity_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_scores_impact ON entity_scores(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_entity_scores_priority ON entity_scores(action_priority);

-- Signal evidence
CREATE INDEX IF NOT EXISTS idx_signal_evidence_entity ON signal_evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signal_evidence_event ON signal_evidence(signal_event_id);

-- =====================================================
-- TIMELINE QUERY FUNCTIONS
-- =====================================================

-- Get entity timeline
CREATE OR REPLACE FUNCTION get_entity_timeline(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  event_date DATE,
  title TEXT,
  description TEXT,
  impact_score DECIMAL,
  source TEXT,
  url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.id,
    se.event_type,
    se.event_date,
    se.title,
    se.description,
    se.impact_score,
    se.source,
    se.source_url
  FROM signal_events se
  WHERE se.entity_type = p_entity_type
    AND se.entity_id = p_entity_id
    AND (p_start_date IS NULL OR se.event_date >= p_start_date)
    AND se.event_date <= p_end_date
  ORDER BY se.event_date DESC, se.impact_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Calculate entity impact score
CREATE OR REPLACE FUNCTION calculate_entity_impact_score(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_recent_signals INTEGER;
  v_high_impact_signals INTEGER;
  v_velocity DECIMAL;
  v_recency_days INTEGER;
BEGIN
  -- Count recent signals (last 30 days)
  SELECT COUNT(*) INTO v_recent_signals
  FROM signal_events
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND event_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Count high impact signals (last 90 days)
  SELECT COUNT(*) INTO v_high_impact_signals
  FROM signal_events
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND event_date >= CURRENT_DATE - INTERVAL '90 days'
    AND impact_score >= 0.7;
  
  -- Calculate velocity (signals per week, last 30 days)
  v_velocity := v_recent_signals / 4.0;
  
  -- Get days since last signal
  SELECT CURRENT_DATE - MAX(event_date) INTO v_recency_days
  FROM signal_events
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id;
  
  -- Score calculation (0-100)
  v_score := LEAST(100, 
    (v_recent_signals * 5) + -- 5 points per recent signal
    (v_high_impact_signals * 10) + -- 10 points per high impact
    (LEAST(20, v_velocity * 5)) + -- up to 20 points for velocity
    (CASE 
      WHEN v_recency_days <= 7 THEN 20
      WHEN v_recency_days <= 14 THEN 15
      WHEN v_recency_days <= 30 THEN 10
      ELSE 0
    END) -- recency bonus
  );
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Refresh entity scores (call periodically)
CREATE OR REPLACE FUNCTION refresh_entity_scores()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_entity RECORD;
BEGIN
  -- Update scores for all companies with recent activity
  FOR v_entity IN 
    SELECT DISTINCT entity_type, entity_id
    FROM signal_events
    WHERE event_date >= CURRENT_DATE - INTERVAL '90 days'
  LOOP
    INSERT INTO entity_scores (entity_type, entity_id, impact_score, calculated_at)
    VALUES (
      v_entity.entity_type,
      v_entity.entity_id,
      calculate_entity_impact_score(v_entity.entity_type, v_entity.entity_id),
      NOW()
    )
    ON CONFLICT (entity_type, entity_id) 
    DO UPDATE SET
      impact_score = calculate_entity_impact_score(v_entity.entity_type, v_entity.entity_id),
      calculated_at = NOW();
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE signal_events IS 'Time-series of all signals per entity';
COMMENT ON TABLE entity_metrics IS 'Aggregated metrics for trend analysis';
COMMENT ON TABLE entity_scores IS 'Current impact scores and recommendations';
COMMENT ON TABLE signal_evidence IS 'Evidence links for score explainability';
