---
title: 知识库网站搭建与部署
tags: [项目, VitePress, GitHub Pages]
category: 📋 项目日志
related:
  - GitHub Pages 部署
  - 开发规范技能
---

# 知识库网站搭建与部署

## 状态

已完成，持续更新中。

## 技术栈

- VitePress 静态站点框架
- Three.js 3D 知识银河首页
- GitHub Pages 自动部署
- Markdown frontmatter → 自动生成知识图谱数据

## 核心思路

写完 md 文件 push 到 GitHub，Actions 自动构建部署，零代码维护。

### 自动化管线

1. `scripts/generate-graph.mjs` 扫描 6 个分类目录的所有 md 文件
2. 解析 frontmatter，提取 title / tags / related / summary
3. 生成 `graph-data.json`（3D 银河图数据）和 `.vitepress/sidebar.ts`（侧边栏）
4. `npm run dev/build` 自动调用 gen → vitepress

### 文章关联

frontmatter 里写 `related` 字段，引用其他文章的 title，脚本自动匹配生成图谱连线。

```yaml
---
title: 某篇文章
related:
  - GitHub Pages 部署
  - 排期工具
---
```

## 6 个分类

| 分类 | 用途 |
|------|------|
| 💬 对话精华 | Claude/Codex 对话精华总结 |
| 📚 技术笔记 | 技术知识点记录 |
| 🛠 踩坑记录 | 遇到的坑和解决方案 |
| 💡 灵感便签 | 想法、灵感、待探索方向 |
| 🎨 设计素材 | UI 设计规范和素材 |
| 📋 项目日志 | 项目进度和决策记录 |

## 部署链路

- 仓库：`polaris-esy/knowledge-base`
- Pages：`polaris-esy.github.io/knowledge-base/`
- 推送 main 分支 → GitHub Actions 自动构建 → deploy-pages

## 使用方式

```bash
# 本地预览
npm run dev

# 构建
npm run build

# 推送上线
git add . && git commit -m "msg" && git push
```

## 踩坑记录

- **GitHub Pages base 路径**：部署在子路径 `/knowledge-base/` 下，VitePress 必须配置 `base` 和 `withBase()`，否则资源 404
- **gh CLI 认证**：需开代理 + Classic token（repo + workflow scope），Fine-grained token 权限颗粒度过细不适合
- **Pages 首次启用**：需在 Settings → Pages 手动开启 GitHub Actions 构建源，否则 deploy 报 Not Found
