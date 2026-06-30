---
title: GitHub Pages 部署
tags: [github, 部署, vitepress]
category: 📚 技术笔记
related:
  - Git 配置
  - Codex 插件生态
  - DNA 知识图谱灵感
---

# GitHub Pages 部署

## 方案

VitePress + GitHub Actions 自动部署到 GitHub Pages。

## 步骤

1. 创建 GitHub 仓库
2. 推送 VitePress 项目
3. 配置 GitHub Actions 工作流
4. 每次 push 自动构建部署

## GitHub Actions 配置

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .vitepress/dist
```
