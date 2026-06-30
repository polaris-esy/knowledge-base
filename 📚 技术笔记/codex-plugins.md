---
title: Codex 插件生态
tags: [codex, 插件, 市场]
category: 📚 技术笔记
related:
  - Codex 入门
  - Codex CLI 代理问题
  - 开发规范技能
---

# Codex 插件生态

## 插件市场（5个，279个插件）

| 市场 | 类型 | 插件数 |
|------|------|--------|
| openai-bundled | 本地 | 4 |
| openai-primary-runtime | 本地 | 5 |
| openai-third-party | 本地 | 141 |
| awesome-codex-plugins | Git 远程 | 128 |
| agent-plugins-marketplace | Git 远程 | 1 |

## 远程市场操作

远程市场需 VPN + 代理：

```bash
export ALL_PROXY=socks5://127.0.0.1:10808
codex plugin marketplace update awesome-codex-plugins
codex plugin upgrade --all
```
