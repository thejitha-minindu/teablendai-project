-- TeaBlendAI OLAP Data Warehouse Schema (DuckDB)
-- Kimball Dimensional Model (Star Schema & Data Marts)


-- DIMENSION TABLES

-- Date Dimension
CREATE TABLE IF NOT EXISTS dim_date (
    date_key INTEGER PRIMARY KEY,
    full_date DATE NOT NULL,
    day_of_month INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    day_name VARCHAR NOT NULL,
    month_num INTEGER NOT NULL,
    month_name VARCHAR NOT NULL,
    month_year VARCHAR NOT NULL,
    quarter INTEGER NOT NULL,
    year_num INTEGER NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    tea_season VARCHAR NOT NULL
);

-- Tea Grade Dimension
CREATE TABLE IF NOT EXISTS dim_tea_grade (
    grade_key INTEGER PRIMARY KEY,
    grade_name VARCHAR NOT NULL,
    elevation_category VARCHAR NOT NULL,
    particle_size VARCHAR NOT NULL,
    standard_code VARCHAR
);

-- User Dimension
CREATE TABLE IF NOT EXISTS dim_user (
    user_key INTEGER PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    user_role VARCHAR NOT NULL,
    company_name VARCHAR,
    estate_name VARCHAR,
    region VARCHAR,
    created_at TIMESTAMP
);

-- Tea Blend Dimension
CREATE TABLE IF NOT EXISTS dim_tea_blend (
    blend_key INTEGER PRIMARY KEY,
    blend_name VARCHAR NOT NULL,
    target_market VARCHAR,
    description VARCHAR
);

-- 2. FACT TABLES

-- Fact: Auction Transactions
CREATE TABLE IF NOT EXISTS fact_auction_transactions (
    transaction_id VARCHAR PRIMARY KEY,
    auction_id VARCHAR NOT NULL,
    custom_auction_id VARCHAR,
    auction_name VARCHAR,
    date_key INTEGER NOT NULL,
    grade_key INTEGER NOT NULL,
    seller_key INTEGER NOT NULL,
    buyer_key INTEGER,
    status VARCHAR NOT NULL,
    origin VARCHAR,
    quantity_kg DOUBLE NOT NULL,
    base_price_lkr DOUBLE NOT NULL,
    sold_price_lkr DOUBLE,
    total_revenue_lkr DOUBLE,
    profit_margin_pct DOUBLE,
    duration_minutes DOUBLE NOT NULL,
    total_bids_count INTEGER DEFAULT 0,
    highest_bid_lkr DOUBLE,
    start_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Auction Bids
CREATE TABLE IF NOT EXISTS fact_bids (
    bid_id VARCHAR PRIMARY KEY,
    auction_id VARCHAR NOT NULL,
    buyer_id VARCHAR NOT NULL,
    date_key INTEGER NOT NULL,
    bid_amount_lkr DOUBLE NOT NULL,
    bid_time TIMESTAMP NOT NULL,
    bid_sequence INTEGER DEFAULT 1,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Blend Sales
CREATE TABLE IF NOT EXISTS fact_blend_sales (
    sale_id VARCHAR PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    blend_key INTEGER NOT NULL,
    date_key INTEGER NOT NULL,
    quantity_kg DOUBLE NOT NULL,
    price_per_kg_lkr DOUBLE NOT NULL,
    total_revenue_lkr DOUBLE NOT NULL,
    sale_date DATE NOT NULL,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact: Tea Purchases
CREATE TABLE IF NOT EXISTS fact_tea_purchases (
    purchase_id VARCHAR PRIMARY KEY,
    source_type VARCHAR NOT NULL,
    grade_key INTEGER NOT NULL,
    date_key INTEGER NOT NULL,
    quantity_kg DOUBLE NOT NULL,
    price_per_kg_lkr DOUBLE NOT NULL,
    total_cost_lkr DOUBLE NOT NULL,
    purchase_date DATE NOT NULL,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AGGREGATED DATA MARTS

-- Daily Overview Mart
CREATE TABLE IF NOT EXISTS mart_daily_overview (
    date_key INTEGER PRIMARY KEY,
    full_date DATE NOT NULL,
    year_num INTEGER NOT NULL,
    month_num INTEGER NOT NULL,
    month_year VARCHAR NOT NULL,
    total_participated_volume_kg DOUBLE DEFAULT 0,
    total_sold_volume_kg DOUBLE DEFAULT 0,
    total_revenue_lkr DOUBLE DEFAULT 0,
    avg_price_per_kg_lkr DOUBLE DEFAULT 0,
    avg_profit_margin_pct DOUBLE DEFAULT 0,
    active_auctions_count INTEGER DEFAULT 0,
    completed_auctions_count INTEGER DEFAULT 0,
    total_bids_placed INTEGER DEFAULT 0,
    last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Grade Trends Mart
CREATE TABLE IF NOT EXISTS mart_grade_monthly_trends (
    year_num INTEGER NOT NULL,
    month_num INTEGER NOT NULL,
    month_year VARCHAR NOT NULL,
    grade_name VARCHAR NOT NULL,
    elevation_category VARCHAR NOT NULL,
    total_volume_kg DOUBLE DEFAULT 0,
    total_revenue_lkr DOUBLE DEFAULT 0,
    avg_sold_price_lkr DOUBLE DEFAULT 0,
    auction_count INTEGER DEFAULT 0,
    PRIMARY KEY (year_num, month_num, grade_name)
);

-- Top Performing Blends Mart
CREATE TABLE IF NOT EXISTS mart_top_blends (
    blend_name VARCHAR PRIMARY KEY,
    total_sales_kg DOUBLE DEFAULT 0,
    total_revenue_lkr DOUBLE DEFAULT 0,
    avg_profit_pct DOUBLE DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-Time Auction Telemetry Mart
CREATE TABLE IF NOT EXISTS mart_realtime_auction_telemetry (
    window_id INTEGER PRIMARY KEY DEFAULT 1,
    window_start_time TIMESTAMP,
    window_end_time TIMESTAMP,
    bids_per_minute DOUBLE DEFAULT 0.0,
    active_live_auctions INTEGER DEFAULT 0,
    live_price_appreciation_pct DOUBLE DEFAULT 0.0,
    total_live_bid_volume_lkr DOUBLE DEFAULT 0.0,
    last_event_timestamp TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline Audit Log
CREATE TABLE IF NOT EXISTS pipeline_execution_log (
    run_id VARCHAR PRIMARY KEY,
    pipeline_name VARCHAR NOT NULL,
    execution_mode VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    records_extracted INTEGER DEFAULT 0,
    records_loaded INTEGER DEFAULT 0,
    duration_ms DOUBLE DEFAULT 0,
    quality_checks_passed INTEGER DEFAULT 0,
    quality_checks_failed INTEGER DEFAULT 0,
    error_message VARCHAR,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
