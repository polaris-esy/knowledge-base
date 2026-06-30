import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const CATEGORIES = [
  { name: '💬 对话精华', color: '#6366f1' },
  { name: '📚 技术笔记', color: '#10b981' },
  { name: '🛠 踩坑记录', color: '#f59e0b' },
  { name: '💡 灵感便签', color: '#ec4899' },
  { name: '🎨 设计素材', color: '#8b5cf6' },
  { name: '📋 项目日志', color: '#06b6d4' },
]

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const fm = {}
  const lines = match[1].split(/\r?\n/)
  let currentKey = null

  for (const line of lines) {
    const listMatch = line.match(/^\s+-\s+(.+)/)
    if (listMatch && currentKey) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = []
      fm[currentKey].push(listMatch[1].trim())
      continue
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      let value = kvMatch[2].trim()

      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
      }

      fm[currentKey] = value
    }
  }

  return fm
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim()
}

function extractSummary(content) {
  const parts = content.split(/^---$/m)
  if (parts.length < 3) return ''
  const body = parts.slice(2).join('---')
  const lines = body.split(/\r?\n/)
  let h1Seen = false
  let summaryParts = []

  for (const line of lines) {
    if (line.startsWith('# ') && !h1Seen) {
      h1Seen = true
      continue
    }
    if (!h1Seen) continue

    if (line.startsWith('#')) continue

    if (line.trim() === '') {
      if (summaryParts.length > 0) break
      continue
    }

    if (line.startsWith('|') || line.startsWith('```') || line.startsWith('- ') || line.startsWith('> ')) {
      if (summaryParts.length > 0) break
      continue
    }

    const cleaned = stripMarkdown(line)
    if (cleaned) summaryParts.push(cleaned)
  }

  let summary = summaryParts.join(' ')
  if (summary.length > 120) {
    summary = summary.slice(0, 117) + '...'
  }
  return summary
}

function main() {
  const nodes = []
  const titleToId = new Map()

  for (const cat of CATEGORIES) {
    const catDir = path.join(ROOT, cat.name)
    if (!fs.existsSync(catDir)) {
      console.warn(`⚠ 目录不存在: ${cat.name}`)
      continue
    }

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md') && f !== 'index.md')
    for (const file of files) {
      const id = file.replace(/\.md$/, '')
      const filePath = path.join(catDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const fm = parseFrontmatter(content)
      const summary = extractSummary(content)

      const title = fm.title || id
      nodes.push({
        id,
        title,
        category: fm.category || cat.name,
        summary: summary || title,
        url: `/${cat.name}/${id}`,
      })
      titleToId.set(title, id)
    }
  }

  const links = []
  const seenPairs = new Set()

  for (const cat of CATEGORIES) {
    const catDir = path.join(ROOT, cat.name)
    if (!fs.existsSync(catDir)) continue

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md') && f !== 'index.md')
    for (const file of files) {
      const id = file.replace(/\.md$/, '')
      const filePath = path.join(catDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const fm = parseFrontmatter(content)

      if (!fm.related || !Array.isArray(fm.related)) continue

      for (const relatedTitle of fm.related) {
        const targetId = titleToId.get(relatedTitle)
        if (!targetId) {
          console.warn(`⚠ ${id}: related 目标 "${relatedTitle}" 未匹配`)
          continue
        }
        const pairKey = [id, targetId].sort().join('::')
        if (seenPairs.has(pairKey)) continue
        seenPairs.add(pairKey)
        links.push({ source: id, target: targetId })
      }
    }
  }

  const sidebar = {}
  for (const cat of CATEGORIES) {
    const catDir = path.join(ROOT, cat.name)
    if (!fs.existsSync(catDir)) continue
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md') && f !== 'index.md')
    const items = files.map(file => {
      const id = file.replace(/\.md$/, '')
      const node = nodes.find(n => n.id === id && n.category === cat.name)
      return { text: node ? node.title : id, link: `/${cat.name}/${id}` }
    })
    sidebar[`/${cat.name}/`] = [{ text: cat.name, items }]
  }

  const graphOutput = { categories: CATEGORIES, nodes, links }
  fs.writeFileSync(path.join(ROOT, 'graph-data.json'), JSON.stringify(graphOutput, null, 2), 'utf-8')
  const sidebarTs = `export default ${JSON.stringify(sidebar, null, 2)} as const\n`
  fs.writeFileSync(path.join(ROOT, '.vitepress', 'sidebar.ts'), sidebarTs, 'utf-8')
  console.log(`✅ ${nodes.length} 节点, ${links.length} 连线 → graph-data.json + sidebar.ts`)
}

main()
