import { Hono } from 'hono'
import type { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

// Simple password authentication
auth.post('/login', async (c) => {
  try {
    const { password } = await c.req.json()
    const adminPassword = c.env.ADMIN_PASSWORD || 'demo123'
    
    if (password === adminPassword) {
      return c.json({ 
        success: true,
        message: 'ログインに成功しました'
      })
    } else {
      return c.json({ 
        success: false,
        message: 'パスワードが正しくありません'
      }, 401)
    }
  } catch (error) {
    return c.json({ 
      success: false,
      message: 'エラーが発生しました'
    }, 500)
  }
})

// Verify authentication (for protected routes)
auth.get('/verify', async (c) => {
  // In production, implement proper session/token management
  // For now, just return ok
  return c.json({ authenticated: true })
})

export default auth
