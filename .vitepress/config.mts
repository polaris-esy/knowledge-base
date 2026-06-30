import { defineConfig } from 'vitepress'
import sidebar from './sidebar'

export default defineConfig({
  title: '知识图谱',
  description: 'DNA 式个人知识库',
  vite: {
    server: {
      allowedHosts: ['.pinggy.net', '.pinggy-free.link', '.loca.lt', '.serveo.net', 'localhost']
    }
  },
  lang: 'zh-CN',
  appearance: 'dark',
  themeConfig: {
    siteTitle: '🧬 知识图谱',
    nav: [
      { text: '首页', link: '/' },
      { text: '对话精华', link: '/💬 对话精华/' },
      { text: '技术笔记', link: '/📚 技术笔记/' },
      { text: '踩坑记录', link: '/🛠 踩坑记录/' },
      { text: '灵感便签', link: '/💡 灵感便签/' },
      { text: '设计素材', link: '/🎨 设计素材/' },
      { text: '项目日志', link: '/📋 项目日志/' },
    ],
    sidebar,
    socialLinks: [],
    search: {
      provider: 'local'
    },
    footer: {
      message: '知识连接万物',
    },
  },
})
