// SNS Report Generator - Frontend Application

// State management
const state = {
  isAuthenticated: false,
  currentView: 'login',
  currentClient: null,
  clients: [],
  uploads: [],
  stats: null,
  kpis: [],
  reports: []
}

// API helper
const api = {
  async post(url, data) {
    const response = await axios.post(url, data)
    return response.data
  },
  async get(url) {
    const response = await axios.get(url)
    return response.data
  },
  async delete(url) {
    const response = await axios.delete(url)
    return response.data
  }
}

// Initialize app
async function init() {
  render()
}

// Router
function navigateTo(view, clientId = null) {
  state.currentView = view
  if (clientId) {
    state.currentClient = state.clients.find(c => c.id === clientId)
  }
  render()
}

// Main render function
function render() {
  const app = document.getElementById('app')
  
  if (!state.isAuthenticated) {
    app.innerHTML = renderLogin()
    attachLoginHandlers()
    return
  }
  
  switch (state.currentView) {
    case 'clients':
      app.innerHTML = renderClients()
      attachClientHandlers()
      break
    case 'dashboard':
      app.innerHTML = renderDashboard()
      attachDashboardHandlers()
      break
    case 'upload':
      app.innerHTML = renderUpload()
      attachUploadHandlers()
      break
    case 'kpi':
      app.innerHTML = renderKPI()
      attachKPIHandlers()
      break
    case 'reports':
      app.innerHTML = renderReports()
      attachReportHandlers()
      break
    default:
      app.innerHTML = renderClients()
  }
}

// Login View
function renderLogin() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
          <i class="fas fa-chart-line text-6xl text-blue-600 mb-4"></i>
          <h1 class="text-3xl font-bold text-gray-800">SNSレポート生成システム</h1>
          <p class="text-gray-600 mt-2">パスワードを入力してください</p>
        </div>
        
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>パスワード
            </label>
            <input 
              type="password" 
              id="password" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを入力"
              required
            />
          </div>
          
          <button 
            type="submit"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>ログイン
          </button>
        </form>
        
        <div id="loginError" class="hidden mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
        </div>
      </div>
    </div>
  `
}

function attachLoginHandlers() {
  const form = document.getElementById('loginForm')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const password = document.getElementById('password').value
    
    try {
      const result = await api.post('/api/auth/login', { password })
      if (result.success) {
        state.isAuthenticated = true
        await loadClients()
        navigateTo('clients')
      } else {
        showError('loginError', result.message)
      }
    } catch (error) {
      showError('loginError', 'ログインに失敗しました')
    }
  })
}

// Clients View
function renderClients() {
  return `
    <div class="min-h-screen bg-gray-50">
      ${renderHeader()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-users mr-3"></i>クライアント一覧
          </h2>
          <button 
            onclick="showNewClientModal()"
            class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <i class="fas fa-plus mr-2"></i>新規クライアント
          </button>
        </div>
        
        <div id="clientsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${state.clients.length === 0 ? 
            '<div class="col-span-full text-center py-12 text-gray-500">クライアントがありません。新規作成してください。</div>' :
            state.clients.map(client => `
              <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="text-xl font-bold text-gray-800">${client.name}</h3>
                    <p class="text-sm text-gray-600">${client.industry || '業種未設定'}</p>
                  </div>
                  <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    ID: ${client.id}
                  </span>
                </div>
                
                ${client.memo ? `<p class="text-sm text-gray-600 mb-4">${client.memo}</p>` : ''}
                
                <div class="text-xs text-gray-500 mb-4">
                  <i class="fas fa-clock mr-1"></i>
                  最終更新: ${new Date(client.updated_at).toLocaleDateString('ja-JP')}
                </div>
                
                <div class="grid grid-cols-3 gap-2">
                  <button 
                    onclick="navigateTo('upload', ${client.id})"
                    class="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    <i class="fas fa-upload"></i><br/>CSV取込
                  </button>
                  <button 
                    onclick="navigateTo('dashboard', ${client.id})"
                    class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <i class="fas fa-chart-bar"></i><br/>ダッシュボード
                  </button>
                  <button 
                    onclick="navigateTo('reports', ${client.id})"
                    class="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <i class="fas fa-file-alt"></i><br/>レポート
                  </button>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>
    
    <!-- New Client Modal -->
    <div id="newClientModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md">
        <h3 class="text-2xl font-bold mb-4">新規クライアント作成</h3>
        <form id="newClientForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">クライアント名 *</label>
            <input type="text" id="clientName" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">業種</label>
            <input type="text" id="clientIndustry" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">メモ</label>
            <textarea id="clientMemo" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
          </div>
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">作成</button>
            <button type="button" onclick="hideNewClientModal()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400">キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  `
}

function attachClientHandlers() {
  const form = document.getElementById('newClientForm')
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await createClient()
    })
  }
}

// CSV Upload View
function renderUpload() {
  if (!state.currentClient) return '<div>クライアントが選択されていません</div>'
  
  return `
    <div class="min-h-screen bg-gray-50">
      ${renderHeader()}
      
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h2 class="text-2xl font-bold mb-6">
            <i class="fas fa-upload mr-2"></i>CSVアップロード - ${state.currentClient.name}
          </h2>
          
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-700 mb-4">
              CSVファイルをドロップ または クリックして選択
            </label>
            <div 
              id="dropZone"
              class="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
              <p class="text-gray-600">CSVファイルをここにドロップ</p>
              <p class="text-sm text-gray-500 mt-2">または、クリックしてファイルを選択</p>
              <input type="file" id="csvFile" accept=".csv" class="hidden" />
            </div>
          </div>
          
          <div id="columnMapping" class="hidden">
            <h3 class="text-xl font-bold mb-4">カラムマッピング</h3>
            <p class="text-sm text-gray-600 mb-4">CSVの列と対応する項目を選択してください（任意項目は未選択でも可）</p>
            
            <div id="mappingFields" class="space-y-3">
            </div>
            
            <div class="mt-6 flex gap-4">
              <button 
                id="processBtn"
                class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                <i class="fas fa-check mr-2"></i>データを取り込む
              </button>
              <button 
                onclick="navigateTo('clients')"
                class="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
          
          <div id="uploadResult" class="hidden mt-6"></div>
        </div>
      </div>
    </div>
  `
}

function attachUploadHandlers() {
  const dropZone = document.getElementById('dropZone')
  const fileInput = document.getElementById('csvFile')
  
  dropZone.addEventListener('click', () => fileInput.click())
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropZone.classList.add('border-blue-500', 'bg-blue-50')
  })
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-50')
  })
  
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault()
    dropZone.classList.remove('border-blue-500', 'bg-blue-50')
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      await handleCSVFile(file)
    }
  })
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (file) {
      await handleCSVFile(file)
    }
  })
}

async function handleCSVFile(file) {
  const text = await file.text()
  const lines = text.split('\n')
  if (lines.length < 2) {
    alert('CSVファイルが空です')
    return
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  
  // Show column mapping UI
  document.getElementById('columnMapping').classList.remove('hidden')
  
  const standardFields = [
    { key: 'date', label: '日付 *', required: true },
    { key: 'title', label: '投稿タイトル' },
    { key: 'link', label: 'リンク' },
    { key: 'views', label: '再生数' },
    { key: 'likes', label: 'いいね' },
    { key: 'comments', label: 'コメント' },
    { key: 'shares', label: 'シェア' },
    { key: 'saves', label: '保存' },
    { key: 'reach', label: 'リーチ' },
    { key: 'impressions', label: 'インプレッション' },
    { key: 'outbound_clicks', label: '外部クリック' }
  ]
  
  const mappingFields = document.getElementById('mappingFields')
  mappingFields.innerHTML = standardFields.map(field => `
    <div class="flex items-center gap-4">
      <label class="w-48 text-sm font-medium text-gray-700">${field.label}</label>
      <select 
        id="map_${field.key}"
        class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        ${field.required ? 'required' : ''}
      >
        <option value="">-- 未選択 --</option>
        ${headers.map(h => `<option value="${h}">${h}</option>`).join('')}
      </select>
    </div>
  `).join('')
  
  // Auto-detect common column names
  const autoMapping = {
    date: ['date', '日付', 'Date', 'DATE'],
    title: ['title', 'タイトル', 'Title', 'Post Title'],
    views: ['views', '再生数', 'Views', 'ビュー'],
    likes: ['likes', 'いいね', 'Likes', 'Like'],
    reach: ['reach', 'リーチ', 'Reach'],
  }
  
  Object.entries(autoMapping).forEach(([key, patterns]) => {
    const select = document.getElementById(`map_${key}`)
    if (select) {
      const match = headers.find(h => 
        patterns.some(p => h.toLowerCase().includes(p.toLowerCase()))
      )
      if (match) {
        select.value = match
      }
    }
  })
  
  // Store CSV data
  window.csvData = { text, filename: file.name }
  
  // Handle process button
  document.getElementById('processBtn').onclick = async () => {
    await processCSV()
  }
}

async function processCSV() {
  const mapping = {}
  const fields = ['date', 'title', 'link', 'views', 'likes', 'comments', 'shares', 'saves', 'reach', 'impressions', 'outbound_clicks']
  
  fields.forEach(field => {
    const select = document.getElementById(`map_${field}`)
    if (select && select.value) {
      mapping[field] = select.value
    }
  })
  
  if (!mapping.date) {
    alert('日付列の選択は必須です')
    return
  }
  
  const resultDiv = document.getElementById('uploadResult')
  resultDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i><p class="mt-4">処理中...</p></div>'
  resultDiv.classList.remove('hidden')
  
  try {
    const result = await api.post(`/api/uploads/${state.currentClient.id}`, {
      csvText: window.csvData.text,
      filename: window.csvData.filename,
      columnMapping: mapping
    })
    
    resultDiv.innerHTML = `
      <div class="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h4 class="text-lg font-bold text-green-800 mb-2">
          <i class="fas fa-check-circle mr-2"></i>取り込み完了
        </h4>
        <p class="text-sm text-green-700">
          ${result.processed_rows} / ${result.total_rows} 行を処理しました
        </p>
        ${result.errors > 0 ? `<p class="text-sm text-red-600 mt-2">エラー: ${result.errors}行</p>` : ''}
        <button 
          onclick="navigateTo('dashboard', ${state.currentClient.id})"
          class="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
        >
          ダッシュボードを見る
        </button>
      </div>
    `
  } catch (error) {
    resultDiv.innerHTML = `
      <div class="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h4 class="text-lg font-bold text-red-800 mb-2">
          <i class="fas fa-exclamation-circle mr-2"></i>エラー
        </h4>
        <p class="text-sm text-red-700">${error.response?.data?.error || 'アップロードに失敗しました'}</p>
      </div>
    `
  }
}

// Dashboard View (simplified)
function renderDashboard() {
  if (!state.currentClient) return '<div>クライアントが選択されていません</div>'
  
  return `
    <div class="min-h-screen bg-gray-50">
      ${renderHeader()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <h2 class="text-3xl font-bold mb-8">
          <i class="fas fa-chart-bar mr-2"></i>ダッシュボード - ${state.currentClient.name}
        </h2>
        
        <div class="bg-white rounded-xl shadow-lg p-8">
          <p class="text-gray-600">データ分析とグラフ表示機能は実装中です...</p>
          <p class="text-sm text-gray-500 mt-4">CSV取り込み後、ここに統計情報とグラフが表示されます。</p>
        </div>
      </div>
    </div>
  `
}

function attachDashboardHandlers() {
  // TODO: Implement dashboard handlers
}

// KPI View (stub)
function renderKPI() {
  return `<div class="p-8">KPI設定画面（実装中）</div>`
}

function attachKPIHandlers() {}

// Reports View (stub)
function renderReports() {
  if (!state.currentClient) return '<div>クライアントが選択されていません</div>'
  
  return `
    <div class="min-h-screen bg-gray-50">
      ${renderHeader()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <h2 class="text-3xl font-bold mb-8">
          <i class="fas fa-file-alt mr-2"></i>レポート - ${state.currentClient.name}
        </h2>
        
        <div class="bg-white rounded-xl shadow-lg p-8">
          <button 
            onclick="generateReport()"
            class="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
          >
            <i class="fas fa-magic mr-2"></i>月次レポート生成
          </button>
          
          <div id="reportContent" class="mt-8"></div>
        </div>
      </div>
    </div>
  `
}

function attachReportHandlers() {}

async function generateReport() {
  const reportDiv = document.getElementById('reportContent')
  reportDiv.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-purple-600"></i><p class="mt-4">レポート生成中...</p></div>'
  
  try {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    const result = await api.post(`/api/reports/${state.currentClient.id}/generate`, {
      report_type: 'monthly_client',
      period_start: firstDay.toISOString().split('T')[0],
      period_end: lastDay.toISOString().split('T')[0],
      title: `月次レポート ${today.getFullYear()}年${today.getMonth() + 1}月`
    })
    
    reportDiv.innerHTML = `
      <div class="prose max-w-none">
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <i class="fas fa-check-circle text-green-600 mr-2"></i>
          レポートを生成しました
        </div>
        ${result.content_markdown.split('\n').map(line => {
          if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`
          if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`
          if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`
          return `<p>${line}</p>`
        }).join('')}
      </div>
    `
  } catch (error) {
    reportDiv.innerHTML = `
      <div class="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h4 class="text-lg font-bold text-red-800 mb-2">エラー</h4>
        <p class="text-sm text-red-700">${error.response?.data?.error || 'レポート生成に失敗しました'}</p>
      </div>
    `
  }
}

// Header component
function renderHeader() {
  return `
    <header class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button 
            onclick="navigateTo('clients')"
            class="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
          >
            <i class="fas fa-chart-line mr-2"></i>SNSレポート
          </button>
          ${state.currentClient ? `
            <span class="text-gray-400">›</span>
            <span class="text-lg text-gray-600">${state.currentClient.name}</span>
          ` : ''}
        </div>
        
        <nav class="flex items-center gap-4">
          ${state.currentClient ? `
            <button onclick="navigateTo('upload', ${state.currentClient.id})" class="text-gray-600 hover:text-blue-600 transition-colors">
              <i class="fas fa-upload mr-1"></i>CSV取込
            </button>
            <button onclick="navigateTo('dashboard', ${state.currentClient.id})" class="text-gray-600 hover:text-blue-600 transition-colors">
              <i class="fas fa-chart-bar mr-1"></i>ダッシュボード
            </button>
            <button onclick="navigateTo('reports', ${state.currentClient.id})" class="text-gray-600 hover:text-blue-600 transition-colors">
              <i class="fas fa-file-alt mr-1"></i>レポート
            </button>
            <span class="text-gray-300">|</span>
          ` : ''}
          <button onclick="logout()" class="text-red-600 hover:text-red-700 transition-colors">
            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
          </button>
        </nav>
      </div>
    </header>
  `
}

// Helper functions
async function loadClients() {
  try {
    const data = await api.get('/api/clients')
    state.clients = data.clients
  } catch (error) {
    console.error('Failed to load clients:', error)
  }
}

async function createClient() {
  const name = document.getElementById('clientName').value
  const industry = document.getElementById('clientIndustry').value
  const memo = document.getElementById('clientMemo').value
  
  try {
    await api.post('/api/clients', { name, industry, memo })
    await loadClients()
    hideNewClientModal()
    render()
  } catch (error) {
    alert('クライアントの作成に失敗しました')
  }
}

function showNewClientModal() {
  document.getElementById('newClientModal').classList.remove('hidden')
}

function hideNewClientModal() {
  document.getElementById('newClientModal').classList.add('hidden')
}

function showError(elementId, message) {
  const el = document.getElementById(elementId)
  el.textContent = message
  el.classList.remove('hidden')
}

function logout() {
  state.isAuthenticated = false
  state.currentClient = null
  navigateTo('login')
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', init)
