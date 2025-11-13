import { Hono } from 'hono'
import type { Bindings, ColumnMappingConfig } from '../types'

const uploads = new Hono<{ Bindings: Bindings }>()

// Parse CSV text to array of objects
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines
    
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }
  
  return rows
}

// Parse date string to YYYY-MM-DD format (Asia/Tokyo)
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  
  try {
    // Try common formats
    const formats = [
      /^(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
    ]
    
    for (const format of formats) {
      const match = dateStr.match(format)
      if (match) {
        let year, month, day
        if (format === formats[1]) {
          // Assume MM/DD/YYYY
          month = match[1].padStart(2, '0')
          day = match[2].padStart(2, '0')
          year = match[3]
        } else {
          year = match[1]
          month = match[2].padStart(2, '0')
          day = match[3].padStart(2, '0')
        }
        return `${year}-${month}-${day}`
      }
    }
    
    // Try ISO date parsing
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch (error) {
    console.error('Date parse error:', error)
  }
  
  return null
}

// Get ISO week string (YYYY-Www format)
function getISOWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00+09:00') // Asia/Tokyo
  const dayOfWeek = date.getDay() || 7 // Monday = 1, Sunday = 7
  const thursday = new Date(date.getTime())
  thursday.setDate(date.getDate() - dayOfWeek + 4) // Get Thursday of this week
  
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const weekNumber = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

// Safe number conversion
function toNumber(value: any): number {
  const num = parseFloat(String(value).replace(/,/g, ''))
  return isNaN(num) || num < 0 ? 0 : num
}

// Upload and process CSV
uploads.post('/:clientId', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const { csvText, filename, columnMapping } = await c.req.json<{
      csvText: string
      filename: string
      columnMapping: ColumnMappingConfig
    }>()
    
    if (!csvText || !columnMapping) {
      return c.json({ error: 'CSVデータとカラムマッピングが必要です' }, 400)
    }
    
    // Parse CSV
    const rawRows = parseCSV(csvText)
    if (rawRows.length === 0) {
      return c.json({ error: 'CSVデータが空です' }, 400)
    }
    
    // Create upload record
    const uploadResult = await c.env.DB.prepare(`
      INSERT INTO uploads (client_id, filename, original_data, column_mapping, row_count)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      clientId,
      filename,
      JSON.stringify(rawRows.slice(0, 10)), // Store first 10 rows as sample
      JSON.stringify(columnMapping),
      rawRows.length
    ).run()
    
    const uploadId = uploadResult.meta.last_row_id
    
    // Process and normalize data
    const normalizedRows: any[] = []
    const logs: Array<{ type: string; message: string; row?: any }> = []
    
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i]
      
      // Parse date
      const dateStr = columnMapping.date ? row[columnMapping.date] : null
      const date = parseDate(dateStr)
      
      if (!date) {
        logs.push({
          type: 'error',
          message: `行 ${i + 2}: 日付のパースに失敗しました: ${dateStr}`,
          row
        })
        continue
      }
      
      // Extract values using column mapping
      const views = toNumber(columnMapping.views ? row[columnMapping.views] : 0)
      const likes = toNumber(columnMapping.likes ? row[columnMapping.likes] : 0)
      const comments = toNumber(columnMapping.comments ? row[columnMapping.comments] : 0)
      const shares = toNumber(columnMapping.shares ? row[columnMapping.shares] : 0)
      const saves = toNumber(columnMapping.saves ? row[columnMapping.saves] : 0)
      const reach = toNumber(columnMapping.reach ? row[columnMapping.reach] : 0)
      const impressions = toNumber(columnMapping.impressions ? row[columnMapping.impressions] : 0)
      
      // Calculate engagement
      const engagement = likes + comments + shares + saves
      const engagementRate = reach > 0 ? engagement / reach : 0
      
      // Get ISO week
      const weekIso = getISOWeek(date)
      
      normalizedRows.push({
        client_id: clientId,
        upload_id: uploadId,
        date,
        title: columnMapping.title ? row[columnMapping.title] : null,
        link: columnMapping.link ? row[columnMapping.link] : null,
        views,
        likes,
        comments,
        shares,
        saves,
        reach,
        impressions,
        watch_time_sec: toNumber(columnMapping.watch_time_sec ? row[columnMapping.watch_time_sec] : 0),
        avg_view_duration_sec: toNumber(columnMapping.avg_view_duration_sec ? row[columnMapping.avg_view_duration_sec] : 0),
        vcr: toNumber(columnMapping.vcr ? row[columnMapping.vcr] : 0),
        profile_views: toNumber(columnMapping.profile_views ? row[columnMapping.profile_views] : 0),
        follows: toNumber(columnMapping.follows ? row[columnMapping.follows] : 0),
        outbound_clicks: toNumber(columnMapping.outbound_clicks ? row[columnMapping.outbound_clicks] : 0),
        engagement,
        engagement_rate: engagementRate,
        week_iso: weekIso
      })
    }
    
    // Insert normalized data
    if (normalizedRows.length > 0) {
      const stmt = c.env.DB.prepare(`
        INSERT INTO sns_data (
          client_id, upload_id, date, title, link,
          views, likes, comments, shares, saves, reach, impressions,
          watch_time_sec, avg_view_duration_sec, vcr,
          profile_views, follows, outbound_clicks,
          engagement, engagement_rate, week_iso
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      // Batch insert
      const batch: D1PreparedStatement[] = []
      for (const row of normalizedRows) {
        batch.push(
          stmt.bind(
            row.client_id, row.upload_id, row.date, row.title, row.link,
            row.views, row.likes, row.comments, row.shares, row.saves, row.reach, row.impressions,
            row.watch_time_sec, row.avg_view_duration_sec, row.vcr,
            row.profile_views, row.follows, row.outbound_clicks,
            row.engagement, row.engagement_rate, row.week_iso
          )
        )
      }
      
      await c.env.DB.batch(batch)
    }
    
    // Save logs
    if (logs.length > 0) {
      const logBatch: D1PreparedStatement[] = []
      const logStmt = c.env.DB.prepare(`
        INSERT INTO data_logs (upload_id, log_type, message, row_data)
        VALUES (?, ?, ?, ?)
      `)
      
      for (const log of logs) {
        logBatch.push(
          logStmt.bind(
            uploadId,
            log.type,
            log.message,
            log.row ? JSON.stringify(log.row) : null
          )
        )
      }
      
      await c.env.DB.batch(logBatch)
    }
    
    return c.json({
      success: true,
      upload_id: uploadId,
      processed_rows: normalizedRows.length,
      total_rows: rawRows.length,
      errors: logs.filter(l => l.type === 'error').length,
      warnings: logs.filter(l => l.type === 'warning').length,
      logs
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ 
      error: 'CSVのアップロードに失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// Get upload history for a client
uploads.get('/:clientId/history', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    
    const { results } = await c.env.DB.prepare(`
      SELECT id, filename, row_count, uploaded_at
      FROM uploads
      WHERE client_id = ?
      ORDER BY uploaded_at DESC
      LIMIT 50
    `).bind(clientId).all()
    
    return c.json({ uploads: results })
  } catch (error) {
    console.error('Error fetching upload history:', error)
    return c.json({ error: 'アップロード履歴の取得に失敗しました' }, 500)
  }
})

// Get column mapping templates for a client
uploads.get('/:clientId/mappings', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM column_mappings
      WHERE client_id = ?
      ORDER BY is_default DESC, created_at DESC
    `).bind(clientId).all()
    
    return c.json({ mappings: results })
  } catch (error) {
    console.error('Error fetching mappings:', error)
    return c.json({ error: 'マッピングテンプレートの取得に失敗しました' }, 500)
  }
})

// Save column mapping template
uploads.post('/:clientId/mappings', async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const { name, mapping, isDefault } = await c.req.json()
    
    // If setting as default, unset other defaults first
    if (isDefault) {
      await c.env.DB.prepare(`
        UPDATE column_mappings SET is_default = 0 WHERE client_id = ?
      `).bind(clientId).run()
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO column_mappings (client_id, mapping_name, mapping_config, is_default)
      VALUES (?, ?, ?, ?)
    `).bind(clientId, name, JSON.stringify(mapping), isDefault ? 1 : 0).run()
    
    return c.json({
      success: true,
      mapping_id: result.meta.last_row_id
    })
  } catch (error) {
    console.error('Error saving mapping:', error)
    return c.json({ error: 'マッピングテンプレートの保存に失敗しました' }, 500)
  }
})

export default uploads
