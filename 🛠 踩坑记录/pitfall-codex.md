---
title: Codex CLI 代理问题
tags: [codex, 代理, 踩坑]
category: 🛠 踩坑记录
related:
  - VPN 代理设置
  - Git 不走系统代理
  - Codex 插件生态
---

# Codex CLI 代理问题

## 问题

Codex CLI 配置了 git 代理后仍然无法访问远程市场。

## 原因

Codex 不会自动读取 git 代理配置。

## 解决

在每条远程操作命令前手动 export：

```bash
export ALL_PROXY=socks5://127.0.0.1:10808
codex plugin marketplace update awesome-codex-plugins
```

## 注意

- HTTP 代理端口是 10809，不可用
- SOCKS5 端口是 10808，正常
