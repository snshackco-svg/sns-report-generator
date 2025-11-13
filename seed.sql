-- Sample clients for testing
INSERT OR IGNORE INTO clients (id, name, industry, memo) VALUES 
  (1, 'サンプル株式会社', 'EC・小売', 'Instagram運用メインクライアント'),
  (2, 'テスト企業', 'IT・SaaS', 'Twitter/Instagram運用');

-- Sample KPI settings (monthly)
INSERT OR IGNORE INTO kpi_settings (client_id, kpi_type, period, metric_name, metric_label, target_value) VALUES 
  (1, 'monthly', '2025-01', 'views', '再生数', 100000),
  (1, 'monthly', '2025-01', 'reach', 'リーチ', 80000),
  (1, 'monthly', '2025-01', 'engagement_rate', 'エンゲージメント率', 0.05),
  (1, 'monthly', '2025-01', 'saves', '保存数', 1200),
  (1, 'monthly', '2025-01', 'outbound_clicks', '外部クリック', 500);

-- Sample KPI settings (weekly)
INSERT OR IGNORE INTO kpi_settings (client_id, kpi_type, period, metric_name, metric_label, target_value) VALUES 
  (1, 'weekly', '2025-W01', 'views', '再生数', 25000),
  (1, 'weekly', '2025-W01', 'reach', 'リーチ', 20000),
  (1, 'weekly', '2025-W01', 'engagement_rate', 'エンゲージメント率', 0.05);

-- Sample custom KPI
INSERT OR IGNORE INTO kpi_settings (client_id, kpi_type, period, metric_name, metric_label, formula) VALUES 
  (1, 'custom', 'all', 'line_ctr', 'LINE CTR', 'outbound_clicks / impressions');

-- Sample column mapping template
INSERT OR IGNORE INTO column_mappings (client_id, mapping_name, mapping_config, is_default) VALUES 
  (1, 'Metricool標準', '{"date":"Date","title":"Post Title","link":"Post Link","views":"Views","likes":"Likes","comments":"Comments","shares":"Shares","saves":"Saves","reach":"Reach","impressions":"Impressions"}', 1);
