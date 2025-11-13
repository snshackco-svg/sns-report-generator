import { Hono } from 'hono'
import type { Bindings } from '../types'

const stats = new Hono<{ Bindings: Bindings }>()

// Get monthly statistics
stats.get('/:clientId/monthly', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const month = c.req.query('month') // Format: 2025-01
    
    let query = `
      SELECT 
        COUNT(*) as post_count,
        SUM(views) as total_views,
        SUM(reach) as total_reach,
        SUM(impressions) as total_impressions,
        SUM(engagement) as total_engagement,
        SUM(saves) as total_saves,
        SUM(outbound_clicks) as total_outbound_clicks,
        AVG(engagement_rate) as avg_engagement_rate,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares
      FROM sns_data
      WHERE client_id = ?
    `
    
    const params: any[] = [clientId]
    
    if (month) {
      query += ` AND strftime('%Y-%m', date) = ?`
      params.push(month)
    }
    
    const result = await c.env.DB.prepare(query).bind(...params).first()
    
    return c.json({ statistics: result })
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
    return c.json({ error: '月次統計の取得に失敗しました' }, 500)
  }
})

// Get weekly statistics
stats.get('/:clientId/weekly', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const weekIso = c.req.query('week') // Format: 2025-W46
    
    let query = `
      SELECT 
        COUNT(*) as post_count,
        SUM(views) as total_views,
        SUM(reach) as total_reach,
        SUM(impressions) as total_impressions,
        SUM(engagement) as total_engagement,
        SUM(saves) as total_saves,
        SUM(outbound_clicks) as total_outbound_clicks,
        AVG(engagement_rate) as avg_engagement_rate,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares
      FROM sns_data
      WHERE client_id = ?
    `
    
    const params: any[] = [clientId]
    
    if (weekIso) {
      query += ` AND week_iso = ?`
      params.push(weekIso)
    }
    
    const result = await c.env.DB.prepare(query).bind(...params).first()
    
    return c.json({ statistics: result })
  } catch (error) {
    console.error('Error fetching weekly stats:', error)
    return c.json({ error: '週次統計の取得に失敗しました' }, 500)
  }
})

// Get statistics for a date range
stats.get('/:clientId/range', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const startDate = c.req.query('start')
    const endDate = c.req.query('end')
    
    if (!startDate || !endDate) {
      return c.json({ error: '期間の指定が必要です' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as post_count,
        SUM(views) as total_views,
        SUM(reach) as total_reach,
        SUM(impressions) as total_impressions,
        SUM(engagement) as total_engagement,
        SUM(saves) as total_saves,
        SUM(outbound_clicks) as total_outbound_clicks,
        AVG(engagement_rate) as avg_engagement_rate,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares
      FROM sns_data
      WHERE client_id = ?
        AND date >= ?
        AND date <= ?
    `).bind(clientId, startDate, endDate).first()
    
    return c.json({ statistics: result })
  } catch (error) {
    console.error('Error fetching range stats:', error)
    return c.json({ error: '期間統計の取得に失敗しました' }, 500)
  }
})

// Get daily trend data
stats.get('/:clientId/daily-trend', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const startDate = c.req.query('start')
    const endDate = c.req.query('end')
    const limit = parseInt(c.req.query('limit') || '30')
    
    let query = `
      SELECT 
        date,
        SUM(views) as views,
        SUM(reach) as reach,
        SUM(engagement) as engagement,
        AVG(engagement_rate) as engagement_rate,
        SUM(saves) as saves,
        COUNT(*) as post_count
      FROM sns_data
      WHERE client_id = ?
    `
    
    const params: any[] = [clientId]
    
    if (startDate && endDate) {
      query += ` AND date >= ? AND date <= ?`
      params.push(startDate, endDate)
    }
    
    query += ` GROUP BY date ORDER BY date DESC LIMIT ?`
    params.push(limit)
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ trend: results.reverse() })
  } catch (error) {
    console.error('Error fetching daily trend:', error)
    return c.json({ error: '日次トレンドの取得に失敗しました' }, 500)
  }
})

// Get weekly trend data
stats.get('/:clientId/weekly-trend', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const limit = parseInt(c.req.query('limit') || '12')
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        week_iso,
        SUM(views) as views,
        SUM(reach) as reach,
        SUM(engagement) as engagement,
        AVG(engagement_rate) as engagement_rate,
        SUM(saves) as saves,
        COUNT(*) as post_count
      FROM sns_data
      WHERE client_id = ?
      GROUP BY week_iso
      ORDER BY week_iso DESC
      LIMIT ?
    `).bind(clientId, limit).all()
    
    return c.json({ trend: results.reverse() })
  } catch (error) {
    console.error('Error fetching weekly trend:', error)
    return c.json({ error: '週次トレンドの取得に失敗しました' }, 500)
  }
})

// Get top posts by a specific metric
stats.get('/:clientId/top-posts', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const metric = c.req.query('metric') || 'views'
    const limit = parseInt(c.req.query('limit') || '10')
    const startDate = c.req.query('start')
    const endDate = c.req.query('end')
    
    // Validate metric
    const validMetrics = ['views', 'engagement', 'engagement_rate', 'saves', 'reach', 'likes', 'comments', 'shares', 'outbound_clicks']
    if (!validMetrics.includes(metric)) {
      return c.json({ error: '無効な指標です' }, 400)
    }
    
    let query = `
      SELECT 
        date, title, link,
        views, reach, engagement, engagement_rate,
        saves, likes, comments, shares, outbound_clicks
      FROM sns_data
      WHERE client_id = ?
    `
    
    const params: any[] = [clientId]
    
    if (startDate && endDate) {
      query += ` AND date >= ? AND date <= ?`
      params.push(startDate, endDate)
    }
    
    query += ` ORDER BY ${metric} DESC LIMIT ?`
    params.push(limit)
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ posts: results })
  } catch (error) {
    console.error('Error fetching top posts:', error)
    return c.json({ error: 'トップ投稿の取得に失敗しました' }, 500)
  }
})

// Get comparison with previous period
stats.get('/:clientId/comparison', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const currentStart = c.req.query('current_start')
    const currentEnd = c.req.query('current_end')
    const previousStart = c.req.query('previous_start')
    const previousEnd = c.req.query('previous_end')
    
    if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
      return c.json({ error: '比較期間の指定が必要です' }, 400)
    }
    
    // Current period stats
    const current = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as post_count,
        SUM(views) as total_views,
        SUM(reach) as total_reach,
        SUM(engagement) as total_engagement,
        AVG(engagement_rate) as avg_engagement_rate,
        SUM(saves) as total_saves
      FROM sns_data
      WHERE client_id = ? AND date >= ? AND date <= ?
    `).bind(clientId, currentStart, currentEnd).first()
    
    // Previous period stats
    const previous = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as post_count,
        SUM(views) as total_views,
        SUM(reach) as total_reach,
        SUM(engagement) as total_engagement,
        AVG(engagement_rate) as avg_engagement_rate,
        SUM(saves) as total_saves
      FROM sns_data
      WHERE client_id = ? AND date >= ? AND date <= ?
    `).bind(clientId, previousStart, previousEnd).first()
    
    // Calculate change rates
    const comparison = {
      current,
      previous,
      changes: {
        views: current.total_views && previous.total_views 
          ? ((current.total_views - previous.total_views) / previous.total_views * 100).toFixed(2)
          : null,
        reach: current.total_reach && previous.total_reach
          ? ((current.total_reach - previous.total_reach) / previous.total_reach * 100).toFixed(2)
          : null,
        engagement: current.total_engagement && previous.total_engagement
          ? ((current.total_engagement - previous.total_engagement) / previous.total_engagement * 100).toFixed(2)
          : null,
        engagement_rate: current.avg_engagement_rate && previous.avg_engagement_rate
          ? ((current.avg_engagement_rate - previous.avg_engagement_rate) / previous.avg_engagement_rate * 100).toFixed(2)
          : null,
        saves: current.total_saves && previous.total_saves
          ? ((current.total_saves - previous.total_saves) / previous.total_saves * 100).toFixed(2)
          : null
      }
    }
    
    return c.json({ comparison })
  } catch (error) {
    console.error('Error fetching comparison:', error)
    return c.json({ error: '比較データの取得に失敗しました' }, 500)
  }
})

export default stats
