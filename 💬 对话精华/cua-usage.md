---
title: CUA 操控桌面软件
tags: [cua, codex, 桌面操控]
category: 💬 对话精华
related:
  - Codex 入门
  - Python tkinter 开发
---

# CUA 操控桌面软件

## 原理

CUA（Computer Use Agent）通过截屏识别界面，模拟键鼠操作。

## 适用场景

- Photoshop、Illustrator 等无 API 的桌面软件
- 任何有 GUI 但没有插件支持的工具

## 使用方式

1. 打开目标软件
2. 在 Codex 里直接说需求
3. Codex 自动截屏 → 识别 → 操作

## 对比插件

- **插件**：调服务的 API 接口，有 API 的软件才能出插件
- **CUA**：截屏 + 模拟键鼠，没有 API 也能操控
