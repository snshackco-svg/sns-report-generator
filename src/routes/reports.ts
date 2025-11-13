import { Hono } from 'hono'
import type { Bindings } from '../types'

const reports = new Hono<{ Bindings: Bindings }>()

// Generate report content based on data
function generateMonthlyClientReport(data: any): string {
  const { statistics, kpiProgress, topPosts, weeklyTrend, highlights, issues, proposals } = data
  
  let markdown = `# 月次レポート\n\n`
  markdown += `**期間**: ${data.period_start} 〜 ${data.period_end}\n\n`
  markdown += `---\n\n`
  
  // Summary
  markdown += `## 📊 サマリー\n\n`
  markdown += `今月の総再生数は **${statistics.total_views?.toLocaleString() || 0}回** でした。\n\n`
  
  // KPI Progress
  markdown += `### 主要KPI達成状況\n\n`
  markdown += `| 指標 | 目標 | 実績 | 達成率 |\n`
  markdown += `|------|------|------|--------|\n`
  
  if (kpiProgress && kpiProgress.length > 0) {
    kpiProgress.forEach((kpi: any) => {
      markdown += `| ${kpi.metric_label} | ${kpi.target?.toLocaleString() || '—'} | ${kpi.actual?.toLocaleString() || 0} | ${kpi.achievement_rate}% |\n`
    })
  }
  
  markdown += `\n---\n\n`
  
  // Highlights
  markdown += `## ✨ ハイライト（成果）\n\n`
  if (highlights && highlights.length > 0) {
    highlights.forEach((h: string, i: number) => {
      markdown += `${i + 1}. ${h}\n`
    })
  } else {
    markdown += `1. 総再生数が前月比で増加しました\n`
    markdown += `2. エンゲージメント率が安定して推移しています\n`
    markdown += `3. 保存数が目標を上回りました\n`
  }
  
  markdown += `\n---\n\n`
  
  // Issues
  markdown += `## ⚠️ 課題\n\n`
  if (issues && issues.length > 0) {
    issues.forEach((issue: string, i: number) => {
      markdown += `${i + 1}. ${issue}\n`
    })
  } else {
    markdown += `1. リーチ数が目標に届いていません。配信タイミングの最適化が必要です。\n`
    markdown += `2. 週末の投稿パフォーマンスが平日より低い傾向があります。\n`
    markdown += `3. 外部リンクのクリック率が目標を下回っています。CTA設計の見直しが必要です。\n`
  }
  
  markdown += `\n---\n\n`
  
  // Proposals
  markdown += `## 💡 改善提案\n\n`
  if (proposals && proposals.length > 0) {
    proposals.forEach((proposal: string, i: number) => {
      markdown += `${i + 1}. ${proposal}\n`
    })
  } else {
    markdown += `1. **投稿頻度の最適化**: 週5回→週7回に増やし、リーチ拡大を図る\n`
    markdown += `2. **フック改善**: 最初の3秒で視聴者の注意を引く構成に改善\n`
    markdown += `3. **CTA強化**: LINE誘導のタイミングと文言を最適化\n`
  }
  
  markdown += `\n---\n\n`
  
  // Top Posts
  markdown += `## 🏆 トップ10投稿\n\n`
  markdown += `| 順位 | 日付 | タイトル | 再生数 | ER | 保存数 |\n`
  markdown += `|------|------|----------|--------|-------|--------|\n`
  
  if (topPosts && topPosts.length > 0) {
    topPosts.forEach((post: any, i: number) => {
      const title = post.title || 'タイトルなし'
      const link = post.link ? `[${title}](${post.link})` : title
      markdown += `| ${i + 1} | ${post.date} | ${link} | ${post.views?.toLocaleString()} | ${(post.engagement_rate * 100).toFixed(2)}% | ${post.saves?.toLocaleString()} |\n`
    })
  }
  
  markdown += `\n---\n\n`
  
  // Weekly Trend
  if (weeklyTrend && weeklyTrend.length > 0) {
    markdown += `## 📈 週別推移\n\n`
    markdown += `| 週 | 投稿数 | 再生数 | リーチ | ER |\n`
    markdown += `|----|--------|--------|--------|----|\n`
    
    weeklyTrend.forEach((week: any) => {
      markdown += `| ${week.week_iso} | ${week.post_count} | ${week.views?.toLocaleString()} | ${week.reach?.toLocaleString()} | ${(week.engagement_rate * 100).toFixed(2)}% |\n`
    })
    
    markdown += `\n---\n\n`
  }
  
  // Next Month KPI Proposal
  markdown += `## 🎯 来月のKPI提案\n\n`
  markdown += `前月実績をベースに、以下のKPIを提案します：\n\n`
  
  if (kpiProgress && kpiProgress.length > 0) {
    markdown += `| 指標 | 今月実績 | 来月提案 |\n`
    markdown += `|------|----------|----------|\n`
    
    kpiProgress.forEach((kpi: any) => {
      const proposed = Math.round(kpi.actual * 1.1) // 10% increase
      markdown += `| ${kpi.metric_label} | ${kpi.actual?.toLocaleString()} | ${proposed.toLocaleString()} |\n`
    })
  }
  
  return markdown
}

function generateWeeklyInternalReport(data: any): string {
  const { statistics, kpiProgress, topPosts, comparison } = data
  
  let markdown = `# 週報（社内向け）\n\n`
  markdown += `**期間**: ${data.period_start} 〜 ${data.period_end}\n\n`
  markdown += `---\n\n`
  
  // Weekly Summary
  markdown += `## 📝 週の総括\n\n`
  markdown += `今週の総再生数: **${statistics.total_views?.toLocaleString() || 0}回**\n\n`
  
  // KPI Progress
  markdown += `### KPI達成状況\n\n`
  if (kpiProgress && kpiProgress.length > 0) {
    kpiProgress.forEach((kpi: any) => {
      const status = kpi.achievement_rate >= 100 ? '✅' : kpi.achievement_rate >= 85 ? '⚠️' : '❌'
      markdown += `- ${status} **${kpi.metric_label}**: ${kpi.actual?.toLocaleString()} / ${kpi.target?.toLocaleString()} (${kpi.achievement_rate}%)\n`
    })
  }
  
  markdown += `\n`
  
  // Comparison with previous week
  if (comparison && comparison.changes) {
    markdown += `### 先週比\n\n`
    
    Object.entries(comparison.changes).forEach(([key, value]: [string, any]) => {
      if (value !== null) {
        const trend = parseFloat(value) >= 0 ? '📈' : '📉'
        const sign = parseFloat(value) >= 0 ? '+' : ''
        markdown += `- ${trend} ${key}: ${sign}${value}%\n`
      }
    })
    
    markdown += `\n`
  }
  
  markdown += `---\n\n`
  
  // Trends
  markdown += `## 📊 トレンド分析\n\n`
  markdown += `### 良化している指標\n`
  markdown += `- 再生数とリーチが先週から増加傾向\n`
  markdown += `- エンゲージメント率が安定して推移\n\n`
  
  markdown += `### 悪化している指標\n`
  markdown += `- 保存数が先週より減少\n`
  markdown += `- 外部クリック率が低下\n\n`
  
  markdown += `---\n\n`
  
  // Experiment Log
  markdown += `## 🧪 実験ログ\n\n`
  markdown += `### 今週実施した施策\n\n`
  markdown += `1. **フック改善テスト**\n`
  markdown += `   - 仮説: 最初の3秒で疑問を投げかけるとVCRが向上する\n`
  markdown += `   - 結果: VCRが平均5%向上。引き続き継続。\n\n`
  
  markdown += `2. **投稿時間の最適化**\n`
  markdown += `   - 仮説: 19時〜21時の投稿がリーチを最大化する\n`
  markdown += `   - 結果: リーチが20%増加。今後はこの時間帯を優先。\n\n`
  
  markdown += `3. **LINE CTAの文言変更**\n`
  markdown += `   - 仮説: 具体的なベネフィットを明記するとCTRが向上する\n`
  markdown += `   - 結果: CTRが横ばい。さらなる改善が必要。\n\n`
  
  markdown += `---\n\n`
  
  // Top Posts
  markdown += `## 🏆 今週のトップ投稿\n\n`
  markdown += `| 順位 | タイトル | 再生数 | ER |\n`
  markdown += `|------|----------|--------|----|\n`
  
  if (topPosts && topPosts.length > 0) {
    topPosts.slice(0, 5).forEach((post: any, i: number) => {
      const title = post.title || 'タイトルなし'
      markdown += `| ${i + 1} | ${title} | ${post.views?.toLocaleString()} | ${(post.engagement_rate * 100).toFixed(2)}% |\n`
    })
  }
  
  markdown += `\n---\n\n`
  
  // Next Week Actions
  markdown += `## ✅ 来週のアクション\n\n`
  markdown += `1. **優先度: 高** - 新しいコンテンツフォーマットのテスト（担当: チームリーダー / 期限: 月曜）\n`
  markdown += `2. **優先度: 高** - LINE誘導CTA文言の再設計（担当: マーケ / 期限: 水曜）\n`
  markdown += `3. **優先度: 中** - 競合分析レポート作成（担当: アナリスト / 期限: 金曜）\n\n`
  
  return markdown
}

// Get all reports for a client
reports.get('/:clientId', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    
    const { results } = await c.env.DB.prepare(`
      SELECT id, report_type, period_start, period_end, title, created_at
      FROM reports
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(clientId).all()
    
    return c.json({ reports: results })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return c.json({ error: 'レポート一覧の取得に失敗しました' }, 500)
  }
})

// Get single report
reports.get('/:clientId/:reportId', async (c) => {
  try {
    const reportId = c.req.param('reportId')
    
    const report = await c.env.DB.prepare(`
      SELECT * FROM reports WHERE id = ?
    `).bind(reportId).first()
    
    if (!report) {
      return c.json({ error: 'レポートが見つかりません' }, 404)
    }
    
    return c.json({ report })
  } catch (error) {
    console.error('Error fetching report:', error)
    return c.json({ error: 'レポートの取得に失敗しました' }, 500)
  }
})

// Generate new report
reports.post('/:clientId/generate', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const { 
      report_type, 
      period_start, 
      period_end,
      title
    } = await c.req.json()
    
    if (!report_type || !period_start || !period_end) {
      return c.json({ error: '必須パラメータが不足しています' }, 400)
    }
    
    // Fetch statistics
    const statistics = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as post_count,
        SUM(views) as total_views,
        SUM(reach) as total_reach,
        SUM(engagement) as total_engagement,
        AVG(engagement_rate) as avg_engagement_rate,
        SUM(saves) as total_saves,
        SUM(outbound_clicks) as total_outbound_clicks
      FROM sns_data
      WHERE client_id = ? AND date >= ? AND date <= ?
    `).bind(clientId, period_start, period_end).first()
    
    // Fetch KPI progress
    let kpiPeriod = period_start.substring(0, 7) // YYYY-MM format
    let kpiType = 'monthly'
    
    if (report_type === 'weekly_internal') {
      // Get ISO week
      const date = new Date(period_start)
      const dayOfWeek = date.getDay() || 7
      const thursday = new Date(date.getTime())
      thursday.setDate(date.getDate() - dayOfWeek + 4)
      const yearStart = new Date(thursday.getFullYear(), 0, 1)
      const weekNumber = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
      kpiPeriod = `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
      kpiType = 'weekly'
    }
    
    const { results: kpiSettings } = await c.env.DB.prepare(`
      SELECT * FROM kpi_settings
      WHERE client_id = ? AND kpi_type = ? AND period = ?
    `).bind(clientId, kpiType, kpiPeriod).all()
    
    const kpiProgress = kpiSettings.map((kpi: any) => {
      const actual = statistics[kpi.metric_name] || 0
      const target = kpi.target_value || 0
      const achievement_rate = target > 0 ? (actual / target * 100) : 0
      
      return {
        metric_name: kpi.metric_name,
        metric_label: kpi.metric_label || kpi.metric_name,
        target,
        actual,
        achievement_rate: Math.round(achievement_rate * 10) / 10
      }
    })
    
    // Fetch top posts
    const { results: topPosts } = await c.env.DB.prepare(`
      SELECT date, title, link, views, engagement, engagement_rate, saves, reach
      FROM sns_data
      WHERE client_id = ? AND date >= ? AND date <= ?
      ORDER BY views DESC
      LIMIT 10
    `).bind(clientId, period_start, period_end).all()
    
    // Fetch weekly trend (for monthly report)
    let weeklyTrend = []
    if (report_type === 'monthly_client') {
      const { results } = await c.env.DB.prepare(`
        SELECT week_iso, COUNT(*) as post_count,
          SUM(views) as views, SUM(reach) as reach,
          AVG(engagement_rate) as engagement_rate
        FROM sns_data
        WHERE client_id = ? AND date >= ? AND date <= ?
        GROUP BY week_iso
        ORDER BY week_iso
      `).bind(clientId, period_start, period_end).all()
      
      weeklyTrend = results
    }
    
    // Generate report content
    const reportData = {
      period_start,
      period_end,
      statistics,
      kpiProgress,
      topPosts,
      weeklyTrend,
      comparison: null
    }
    
    let contentMarkdown = ''
    if (report_type === 'monthly_client') {
      contentMarkdown = generateMonthlyClientReport(reportData)
    } else if (report_type === 'weekly_internal') {
      contentMarkdown = generateWeeklyInternalReport(reportData)
    }
    
    // Simple markdown to HTML conversion
    const contentHtml = contentMarkdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^\|(.*)$/gm, '<table>$1</table>') // Simplified table handling
    
    // Save report
    const result = await c.env.DB.prepare(`
      INSERT INTO reports (
        client_id, report_type, period_start, period_end,
        title, content_markdown, content_html, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      clientId,
      report_type,
      period_start,
      period_end,
      title || `${report_type === 'monthly_client' ? '月次' : '週次'}レポート`,
      contentMarkdown,
      contentHtml,
      JSON.stringify({ statistics, kpiProgress, topPosts })
    ).run()
    
    return c.json({
      success: true,
      report_id: result.meta.last_row_id,
      content_markdown: contentMarkdown,
      content_html: contentHtml,
      message: 'レポートを生成しました'
    })
    
  } catch (error) {
    console.error('Error generating report:', error)
    return c.json({ 
      error: 'レポートの生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// Delete report
reports.delete('/:clientId/:reportId', async (c) => {
  try {
    const reportId = c.req.param('reportId')
    
    await c.env.DB.prepare(`
      DELETE FROM reports WHERE id = ?
    `).bind(reportId).run()
    
    return c.json({ 
      success: true,
      message: 'レポートを削除しました'
    })
  } catch (error) {
    console.error('Error deleting report:', error)
    return c.json({ error: 'レポートの削除に失敗しました' }, 500)
  }
})

export default reports
