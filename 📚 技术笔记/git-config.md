---
title: Git 配置
tags: [git, 代理, 配置]
category: 📚 技术笔记
related:
  - VPN 代理设置
  - GitHub Pages 部署
---

# Git 配置

## 全局代理

```bash
git config --global http.proxy socks5://127.0.0.1:10808
```

## 用户信息

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

## 常用别名

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.st status
```
