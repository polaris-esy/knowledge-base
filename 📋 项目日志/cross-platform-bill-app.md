---
title: 跨平台记账App — 可行性分析与架构设计
tags: [项目, Flutter, 记账工具, 跨平台]
category: 📋 项目日志
date: 2026-06-30
related:
  - 知识库网站搭建与部署
  - 开发规范技能
---

# 跨平台记账App — 可行性分析与架构设计

## 背景

已有 tkinter 桌面记账工具（`C:\Users\15596\Desktop\记账工具\`），功能包括：
- 灵感便签：填内容 → 生成 .md → 写入知识库仓库 → git push
- CSV 账单导入：自动识别支付宝/微信 → 解析 → 自动分类 → 去重
- 月度收支统计：收入/支出/结余 + 分类占比条
- 每月 1 号弹窗提醒导出账单

用户希望做成手机、平板、电脑三端都可安装的独立 App，非浏览器页面。

## 可行性结论

### 可行

- **Android .apk**：Flutter `flutter build apk` 直接出安装包
- **Windows .exe**：`flutter build windows` 出 .exe，双击安装
- **灵感推送**：用 GitHub Contents API 直接 PUT 文件，不需要 git clone，不需要 VPN，手机 4G 也能推
- **CSV 解析**：Python 逻辑搬到 Dart，纯字符串匹配，无技术障碍
- **SQLite 本地存储**：sqflite 成熟稳定，schema 直接复用
- **密码锁屏**：flutter_secure_storage 存密码哈希
- **统计图表**：fl_chart 做柱状图+饼图
- **加密导出/导入**：AES-256 加密 JSON → 保存文件，实现换设备手动恢复

### 不可行或很难

| 问题 | 严重程度 | 说明 |
|------|---------|------|
| iOS 真机安装 | 🔴 几乎不可能 | 需要 Mac 编译 + $99/年 Apple Developer。无 Mac 无账号 = 完全无法出包。侧载工具每 7 天重签，体验极差 |
| 账单自动跨设备同步 | 🟡 做不到 | 无后端服务器，不同设备 SQLite 天然独立。只能手动导出加密文件传另一台 |
| Windows 本地通知 | 🟡 较弱 | Android 完美，Windows 桌面端通知支持有限 |

### 真实覆盖

| 平台 | 结果 |
|------|------|
| Android | 🟢 安装包直接装 |
| Windows | 🟢 .exe 双击装 |
| iOS | 🔴 做不了 |

## 方案对比

| | Flutter App | 知识库网站升级 PWA |
|---|---|---|
| Android 独立 App | ✅ .apk | ⚠️ 浏览器打开，可装桌面 |
| Windows 独立 App | ✅ .exe | ⚠️ 浏览器打开 |
| iOS | 🔴 不行 | ✅ 浏览器直接开 |
| 需要浏览器 | 不需要 | 需要 |
| 灵感便签 | ✅ GitHub API | ✅ GitHub API（网页端调） |
| 账单导入 | ✅ | ✅ |
| 月度统计 | ✅ | ✅ |
| 账单隐私 | 🟢 本地 SQLite | 🟡 IndexedDB，清缓存会丢 |
| 开发成本 | 高（全新 Dart 代码） | 中（已有 VitePress 上加 JS） |
| 跨设备账单同步 | 🔴 手动传文件 | 🔴 手动传文件 |

## 推荐技术栈（Flutter 方案）

| 层 | 选型 | 说明 |
|----|------|------|
| 框架 | Flutter 3.x + Dart | 三端一套代码 |
| 状态管理 | Provider | 轻量，Flutter 官方推荐 |
| 本地数据库 | sqflite | SQLite |
| 加密 | encrypt (AES-256) | 账单加密导出/备份 |
| HTTP | http / dio | GitHub API 调用 |
| CSV 解析 | csv | 替代 Python bill_parser |
| 图表 | fl_chart | 柱状图 + 饼图 |
| 本地认证 | local_auth | 指纹/面容 + 密码 |
| 本地通知 | flutter_local_notifications | 月度提醒 |
| 文件选择 | file_picker | CSV 文件导入 |

## 数据流设计

### 灵感便签（无 git 依赖）
```
用户填表 → Dart 生成 .md frontmatter → GitHub Contents API
→ PUT /repos/polaris-esy/knowledge-base/contents/{category}/{slug}.md
→ 无需 git clone，无需本地仓库，无需 VPN
→ 手机 4G/5G 直接推，电脑 WiFi 直接推
```

### 账单数据
```
CSV 文件 → 文件选择器读取 → Dart 解析（复用 bill_parser.py 关键词规则）
→ 自动分类 → 存入本地 SQLite → 去重
→ 可选：AES-256 加密导出为 .enc 文件
→ 手动传到其他设备 → 输密码解密 → 合并到本地库
```

### 跨设备同步
- **灵感便签**：GitHub API 直推 → knowledge-base 仓库，本身就是三端共享
- **账单数据**：无自动同步，手动加密导出/导入。这是无服务器的固有局限

## 已实现功能参考

### tkinter 桌面版（`C:\Users\15596\Desktop\记账工具\`）

| 文件 | 功能 |
|------|------|
| `main.pyw` | 三页签 UI：灵感便签 / 账单导入 / 收支统计 |
| `bill_db.py` | SQLite：bills 表 + monthly_check 表 |
| `bill_parser.py` | 自动识别支付宝/微信 CSV，9 类关键词自动分类 |
| `sync_manager.py` | git add/commit/push 到 knowledge-base 仓库 |

### 灵感 .md 生成格式
```yaml
---
title: <标题>
tags: [标签1, 标签2, ...]
category: <分类目录>
date: 2026-06-30 14:30
---

# <标题>

内容正文...
```

### 账单数据库 Schema
```sql
bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_time TEXT NOT NULL,
  category TEXT DEFAULT '',
  counterparty TEXT DEFAULT '',
  description TEXT DEFAULT '',
  direction TEXT NOT NULL CHECK(direction IN ('收入','支出')),
  amount REAL NOT NULL,
  payment_method TEXT DEFAULT '',
  source TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
)

monthly_check (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_month TEXT NOT NULL UNIQUE,
  checked_at TEXT DEFAULT (datetime('now','localtime'))
)
```

## 待决策

- **是否接受 Android + Windows 双端、放弃 iOS？** 如果可以，Flutter 方案可行
- **iOS 刚需？** 唯一务实方案是升级知识库网站为 PWA（浏览器打开，可装桌面）
