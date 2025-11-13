// Environment bindings
export type Bindings = {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

// Client
export interface Client {
  id: number;
  name: string;
  industry: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

// Upload History
export interface Upload {
  id: number;
  client_id: number;
  filename: string;
  original_data: string; // JSON
  column_mapping: string; // JSON
  row_count: number;
  uploaded_at: string;
}

// SNS Data (normalized)
export interface SNSData {
  id: number;
  client_id: number;
  upload_id: number;
  date: string; // YYYY-MM-DD
  title: string | null;
  link: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  watch_time_sec: number;
  avg_view_duration_sec: number;
  vcr: number;
  profile_views: number;
  follows: number;
  outbound_clicks: number;
  engagement: number;
  engagement_rate: number;
  week_iso: string | null; // 2025-W46
  created_at: string;
}

// KPI Settings
export interface KPISetting {
  id: number;
  client_id: number;
  kpi_type: 'monthly' | 'weekly' | 'custom';
  period: string; // '2025-11' or '2025-W46'
  metric_name: string;
  metric_label: string | null;
  target_value: number | null;
  formula: string | null;
  created_at: string;
  updated_at: string;
}

// Report
export interface Report {
  id: number;
  client_id: number;
  report_type: 'monthly_client' | 'weekly_internal';
  period_start: string;
  period_end: string;
  title: string;
  content_markdown: string | null;
  content_html: string | null;
  metadata: string | null; // JSON
  created_at: string;
}

// Data Log
export interface DataLog {
  id: number;
  upload_id: number;
  log_type: 'error' | 'warning' | 'info';
  message: string;
  row_data: string | null; // JSON
  created_at: string;
}

// Column Mapping
export interface ColumnMapping {
  id: number;
  client_id: number;
  mapping_name: string;
  mapping_config: string; // JSON
  is_default: number;
  created_at: string;
}

// Column Mapping Config
export interface ColumnMappingConfig {
  date?: string;
  title?: string;
  link?: string;
  views?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  saves?: string;
  reach?: string;
  impressions?: string;
  watch_time_sec?: string;
  avg_view_duration_sec?: string;
  vcr?: string;
  profile_views?: string;
  follows?: string;
  outbound_clicks?: string;
}

// Statistics
export interface Statistics {
  total_views: number;
  total_reach: number;
  total_engagement: number;
  total_saves: number;
  total_outbound_clicks: number;
  avg_engagement_rate: number;
  post_count: number;
}

// KPI Progress
export interface KPIProgress {
  metric_name: string;
  metric_label: string;
  target: number;
  actual: number;
  achievement_rate: number; // percentage
  previous_period?: number;
  change_rate?: number; // percentage
}

// Top Post
export interface TopPost {
  title: string;
  link: string;
  date: string;
  views: number;
  engagement: number;
  engagement_rate: number;
  saves: number;
  reach: number;
}
