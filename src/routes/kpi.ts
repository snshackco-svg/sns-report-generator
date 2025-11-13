import { Hono } from 'hono'
import type { Bindings } from '../types'

const kpi = new Hono<{ Bindings: Bindings }>()

// Get KPI settings for a client
kpi.get('/:clientId', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const kpiType = c.req.query('type') // 'monthly', 'weekly', 'custom'
    const period = c.req.query('period') // Optional period filter
    
    let query = `
      SELECT * FROM kpi_settings
      WHERE client_id = ?
    `
    const params: any[] = [clientId]
    
    if (kpiType) {
      query += ` AND kpi_type = ?`
      params.push(kpiType)
    }
    
    if (period) {
      query += ` AND period = ?`
      params.push(period)
    }
    
    query += ` ORDER BY period DESC, metric_name`
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ kpis: results })
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return c.json({ error: 'KPI設定の取得に失敗しました' }, 500)
  }
})

// Create or update KPI setting
kpi.post('/:clientId', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const { kpi_type, period, metric_name, metric_label, target_value, formula } = await c.req.json()
    
    if (!kpi_type || !period || !metric_name) {
      return c.json({ error: '必須項目が不足しています' }, 400)
    }
    
    // Check if KPI already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM kpi_settings
      WHERE client_id = ? AND kpi_type = ? AND period = ? AND metric_name = ?
    `).bind(clientId, kpi_type, period, metric_name).first()
    
    if (existing) {
      // Update existing
      await c.env.DB.prepare(`
        UPDATE kpi_settings
        SET metric_label = ?, target_value = ?, formula = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(metric_label, target_value, formula, existing.id).run()
      
      return c.json({ 
        success: true,
        kpi_id: existing.id,
        message: 'KPI設定を更新しました'
      })
    } else {
      // Create new
      const result = await c.env.DB.prepare(`
        INSERT INTO kpi_settings (client_id, kpi_type, period, metric_name, metric_label, target_value, formula)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(clientId, kpi_type, period, metric_name, metric_label, target_value, formula).run()
      
      return c.json({ 
        success: true,
        kpi_id: result.meta.last_row_id,
        message: 'KPI設定を作成しました'
      })
    }
  } catch (error) {
    console.error('Error saving KPI:', error)
    return c.json({ error: 'KPI設定の保存に失敗しました' }, 500)
  }
})

// Batch create/update KPIs
kpi.post('/:clientId/batch', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const { kpis } = await c.req.json<{ kpis: any[] }>()
    
    if (!Array.isArray(kpis) || kpis.length === 0) {
      return c.json({ error: 'KPIデータが不正です' }, 400)
    }
    
    const batch: D1PreparedStatement[] = []
    
    for (const kpiData of kpis) {
      const { kpi_type, period, metric_name, metric_label, target_value, formula } = kpiData
      
      // Check if exists
      const existing = await c.env.DB.prepare(`
        SELECT id FROM kpi_settings
        WHERE client_id = ? AND kpi_type = ? AND period = ? AND metric_name = ?
      `).bind(clientId, kpi_type, period, metric_name).first()
      
      if (existing) {
        batch.push(
          c.env.DB.prepare(`
            UPDATE kpi_settings
            SET metric_label = ?, target_value = ?, formula = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(metric_label, target_value, formula, existing.id)
        )
      } else {
        batch.push(
          c.env.DB.prepare(`
            INSERT INTO kpi_settings (client_id, kpi_type, period, metric_name, metric_label, target_value, formula)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(clientId, kpi_type, period, metric_name, metric_label, target_value, formula)
        )
      }
    }
    
    await c.env.DB.batch(batch)
    
    return c.json({ 
      success: true,
      count: kpis.length,
      message: `${kpis.length}件のKPI設定を保存しました`
    })
  } catch (error) {
    console.error('Error batch saving KPIs:', error)
    return c.json({ error: 'KPI設定の一括保存に失敗しました' }, 500)
  }
})

// Delete KPI setting
kpi.delete('/:clientId/:kpiId', async (c) => {
  try {
    const kpiId = c.req.param('kpiId')
    
    await c.env.DB.prepare(`
      DELETE FROM kpi_settings WHERE id = ?
    `).bind(kpiId).run()
    
    return c.json({ 
      success: true,
      message: 'KPI設定を削除しました'
    })
  } catch (error) {
    console.error('Error deleting KPI:', error)
    return c.json({ error: 'KPI設定の削除に失敗しました' }, 500)
  }
})

// Calculate KPI progress
kpi.get('/:clientId/progress', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const period = c.req.query('period') // Required
    const kpiType = c.req.query('type') || 'monthly'
    
    if (!period) {
      return c.json({ error: '期間の指定が必要です' }, 400)
    }
    
    // Get KPI settings
    const { results: kpiSettings } = await c.env.DB.prepare(`
      SELECT * FROM kpi_settings
      WHERE client_id = ? AND kpi_type = ? AND period = ?
    `).bind(clientId, kpiType, period).all()
    
    if (kpiSettings.length === 0) {
      return c.json({ progress: [] })
    }
    
    // Get actual data based on period type
    let statsQuery = ''
    let statsParams: any[] = [clientId]
    
    if (kpiType === 'monthly') {
      statsQuery = `
        SELECT 
          SUM(views) as views,
          SUM(reach) as reach,
          SUM(engagement) as engagement,
          AVG(engagement_rate) as engagement_rate,
          SUM(saves) as saves,
          SUM(outbound_clicks) as outbound_clicks,
          SUM(impressions) as impressions,
          COUNT(*) as post_count
        FROM sns_data
        WHERE client_id = ? AND strftime('%Y-%m', date) = ?
      `
      statsParams.push(period)
    } else if (kpiType === 'weekly') {
      statsQuery = `
        SELECT 
          SUM(views) as views,
          SUM(reach) as reach,
          SUM(engagement) as engagement,
          AVG(engagement_rate) as engagement_rate,
          SUM(saves) as saves,
          SUM(outbound_clicks) as outbound_clicks,
          SUM(impressions) as impressions,
          COUNT(*) as post_count
        FROM sns_data
        WHERE client_id = ? AND week_iso = ?
      `
      statsParams.push(period)
    }
    
    const actualData = await c.env.DB.prepare(statsQuery).bind(...statsParams).first()
    
    // Calculate progress for each KPI
    const progress = kpiSettings.map((kpiSetting: any) => {
      const metricName = kpiSetting.metric_name
      const target = kpiSetting.target_value
      
      let actual = 0
      
      // Handle custom KPIs with formulas
      if (kpiSetting.formula) {
        try {
          // Simple formula evaluation (security note: in production use a proper parser)
          const formula = kpiSetting.formula
            .replace(/views/g, String(actualData.views || 0))
            .replace(/reach/g, String(actualData.reach || 0))
            .replace(/engagement/g, String(actualData.engagement || 0))
            .replace(/saves/g, String(actualData.saves || 0))
            .replace(/outbound_clicks/g, String(actualData.outbound_clicks || 0))
            .replace(/impressions/g, String(actualData.impressions || 0))
          
          actual = eval(formula) // Note: Use a safe evaluator in production
        } catch (error) {
          console.error('Formula evaluation error:', error)
          actual = 0
        }
      } else {
        // Standard metrics
        actual = actualData[metricName] || 0
      }
      
      const achievementRate = target > 0 ? (actual / target * 100) : 0
      
      return {
        metric_name: metricName,
        metric_label: kpiSetting.metric_label || metricName,
        target,
        actual,
        achievement_rate: Math.round(achievementRate * 10) / 10,
        formula: kpiSetting.formula
      }
    })
    
    return c.json({ progress })
  } catch (error) {
    console.error('Error calculating KPI progress:', error)
    return c.json({ error: 'KPI進捗の計算に失敗しました' }, 500)
  }
})

export default kpi
