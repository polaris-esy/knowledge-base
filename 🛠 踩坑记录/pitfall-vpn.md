---
title: Git 不走系统代理
tags: [git, 代理, 踩坑]
category: 🛠 踩坑记录
related:
  - VPN 代理设置
  - Codex CLI 代理问题
---

# Git 不走系统代理

## 问题

Windows 系统设置了代理，但 Git 不会自动走系统代理。

## 原因

Git 有自己独立的代理配置，不走系统设置。

## 解决

```bash
git config --global http.proxy socks5://127.0.0.1:10808
```

## 教训

凡是命令行工具，代理基本都要单独配置。
