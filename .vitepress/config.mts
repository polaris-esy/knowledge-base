import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '知识图谱',
  description: 'DNA 式个人知识库',
  lang: 'zh-CN',
  appearance: 'dark',
  themeConfig: {
    siteTitle: '🧬 知识图谱',
    nav: [
      { text: '首页', link: '/' },
      { text: '对话精华', link: '/💬 对话精华/' },
      { text: '技术笔记', link: '/📚 技术笔记/' },
      { text: '踩坑记录', link: '/🛠 踩坑记录/' },
    ],
    sidebar: {
      '/💬 对话精华/': [
        { text: '对话精华', items: [] }
      ],
      '/📚 技术笔记/': [
        { text: '技术笔记', items: [] }
      ],
      '/🛠 踩坑记录/': [
        { text: '踩坑记录', items: [] }
      ],
      '/💡 灵感便签/': [
        { text: '灵感便签', items: [] }
      ],
    },
    socialLinks: [],
    search: {
      provider: 'local'
    },
    footer: {
      message: '知识连接万物',
    },
  },
})
