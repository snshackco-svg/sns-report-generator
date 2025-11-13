import { Hono } from 'hono'
import type { Bindings, Client } from '../types'

const clients = new Hono<{ Bindings: Bindings }>()

// Get all clients
clients.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT c.*, 
        (SELECT MAX(uploaded_at) FROM uploads WHERE client_id = c.id) as last_upload
      FROM clients c
      ORDER BY c.updated_at DESC
    `).all()
    
    return c.json({ clients: results })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return c.json({ error: 'クライアント一覧の取得に失敗しました' }, 500)
  }
})

// Get single client
clients.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const client = await c.env.DB.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(id).first()
    
    if (!client) {
      return c.json({ error: 'クライアントが見つかりません' }, 404)
    }
    
    return c.json({ client })
  } catch (error) {
    console.error('Error fetching client:', error)
    return c.json({ error: 'クライアント情報の取得に失敗しました' }, 500)
  }
})

// Create new client
clients.post('/', async (c) => {
  try {
    const { name, industry, memo } = await c.req.json()
    
    if (!name) {
      return c.json({ error: 'クライアント名は必須です' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO clients (name, industry, memo)
      VALUES (?, ?, ?)
    `).bind(name, industry || null, memo || null).run()
    
    return c.json({ 
      success: true,
      client_id: result.meta.last_row_id,
      message: 'クライアントを作成しました'
    })
  } catch (error) {
    console.error('Error creating client:', error)
    return c.json({ error: 'クライアントの作成に失敗しました' }, 500)
  }
})

// Update client
clients.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { name, industry, memo } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE clients 
      SET name = ?, industry = ?, memo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, industry || null, memo || null, id).run()
    
    return c.json({ 
      success: true,
      message: 'クライアント情報を更新しました'
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return c.json({ error: 'クライアント情報の更新に失敗しました' }, 500)
  }
})

// Delete client
clients.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM clients WHERE id = ?
    `).bind(id).run()
    
    return c.json({ 
      success: true,
      message: 'クライアントを削除しました'
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return c.json({ error: 'クライアントの削除に失敗しました' }, 500)
  }
})

export default clients
