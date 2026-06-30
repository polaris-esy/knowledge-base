---
title: VPN 代理设置
tags: [vpn, 代理, v2rayN]
category: 💬 对话精华
related:
  - Git 配置
  - Git 不走系统代理
  - Codex CLI 代理问题
---

# VPN 代理设置

## 代理信息

- **类型**：SOCKS5
- **地址**：`127.0.0.1:10808`
- **工具**：v2rayN

## Git 代理配置

```bash
git config --global http.proxy socks5://127.0.0.1:10808
```

## Codex CLI 代理

Codex 不会自动走 git 代理，需手动 export：

```bash
export ALL_PROXY=socks5://127.0.0.1:10808
```
