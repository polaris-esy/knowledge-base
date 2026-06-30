# 🧬 知识图谱

DNA 式个人知识库网站，用连线串联零散知识点。

**线上地址**：[polaris-esy.github.io/knowledge-base](https://polaris-esy.github.io/knowledge-base/)

## 预览

首页为 Three.js 3D 知识银河，每个星球代表一篇文章，拖拽旋转、滚轮缩放、点击聚焦、双击复位。

## 使用

```bash
# 本地预览
npm run dev

# 构建
npm run build

# 写文章 → 推送 → 自动部署
git add . && git commit -m "新增文章" && git push
```

## 文章规范

在 6 个分类目录中新建 `.md` 文件：

```yaml
---
title: 文章标题
tags: [标签1, 标签2]
category: 💬 对话精华
related:
  - 关联文章标题
---

# 文章标题

正文内容...
```

- `title` — 文章标题（不写就用文件名）
- `tags` — 标签列表
- `category` — 所属分类
- `related` — 关联的其他文章标题，自动生成知识图谱连线

## 目录结构

```
knowledge-base/
├── 💬 对话精华/          # 6 个分类目录，写 md 即可
├── 📚 技术笔记/
├── 🛠 踩坑记录/
├── 💡 灵感便签/
├── 🎨 设计素材/
├── 📋 项目日志/
├── scripts/
│   └── generate-graph.mjs   # 扫描 md → 生成图数据 + 侧边栏
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions 自动部署
└── index.md                 # 首页
```

## 自动化

推送后 GitHub Actions 自动执行：
1. 扫描 md frontmatter → 生成 `graph-data.json`
2. VitePress 构建静态站点
3. 部署到 GitHub Pages

## 技术栈

- VitePress · Three.js · Vue 3
- GitHub Pages + GitHub Actions
