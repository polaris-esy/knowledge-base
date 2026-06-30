---
title: 知识库App化 — 从静态网站到三端独立应用
tags: [项目, Flutter, 跨平台, 知识库]
category: 📋 项目日志
date: 2026-06-30
related:
  - 知识库网站搭建与部署
  - 开发规范技能
---

# 知识库App化 — 从静态网站到三端独立应用

## 定位

**这是 `polaris-esy.github.io/knowledge-base` 知识库项目的功能扩展，不是独立项目。**

当前知识库是一个 VitePress 静态网站，目标是把它升级成像 QQ 一样的独立 App —— 手机、电脑、平板都能安装打开，里面包含：

- 📖 **知识库浏览**：查看 6 个分类的所有文章（已有网站功能的 App 化呈现）
- ✍️ **灵感便签**：手机随时写灵感 → 直接推送到知识库仓库 → 网站同步更新
- 💰 **账单记账**：CSV 导入支付宝/微信账单 → 自动分类 → 月度统计
- 🔐 **密码锁屏**：打开 App 先输密码，账单数据不外泄
- ⏰ **月度提醒**：每月 1 号弹通知「导出本月账单」

关系图：

```
┌────────────────────────────────────────────┐
│  Flutter App（三端独立安装）                    │
│                                             │
│  ┌──────────┬──────────┬────────────────┐   │
│  │ 📖 知识库  │ ✍️ 灵感   │ 💰 账单统计      │  │
│  │ 阅读文章   │ 写md推送  │ CSV导入+图表     │  │
│  └──────────┴──────────┴────────────────┘   │
│                                             │
│  本地 SQLite ───→ GitHub API ───→ knowledge-base 仓库   │
│  (账单数据)       (灵感推送)        (polaris-esy.github.io) │
└────────────────────────────────────────────┘
```

## 可行性结论

### ✅ 可行

| 项 | 说明 |
|----|------|
| Android .apk | `flutter build apk` 直接出包，任何 Android 手机安装 |
| Windows .exe | `flutter build windows` 出 .exe，双击安装 |
| 知识库内容展示 | Flutter 渲染 Markdown，从 GitHub API 拉取文章内容 |
| 灵感推送 | GitHub Contents API 直接 PUT .md 文件，无需 git clone、无需 VPN、手机 4G 直接推 |
| CSV 解析 + 自动分类 | Python 关键词规则搬到 Dart，纯字符串匹配 |
| 账单本地存储 | SQLite（sqflite），数据完全在本地，不上传任何服务器 |
| 密码锁屏 | 启动输密码，flutter_secure_storage 安全存储 |
| 统计图表 | fl_chart 柱状图 + 饼图 |
| 月度提醒 | flutter_local_notifications 本地通知 |

### 🔴 不可行或很难

| 问题 | 严重程度 | 说明 |
|------|---------|------|
| **iOS 真机安装** | 🔴 几乎不可能 | 没有 Mac 电脑无法编译 iOS 二进制。即使有 Mac，还需 $99/年 Apple Developer 账号。侧载工具（AltStore）每 7 天重签一次，体验极差。**这是物理限制，无解** |
| **账单自动跨设备同步** | 🟡 做不到自动 | 背后没有云服务器，不同设备的 SQLite 天然独立。A 手机的账单不会自己跑到 B 平板上。只能「手动导出加密文件 → 传到另一台 → 导入」 |
| **Windows 本地通知** | 🟡 效果弱 | Android 通知栏完美；Windows 端通知支持有限，可能只能应用内弹窗 |

### 平台覆盖真实情况

| 平台 | App 体验 | 备注 |
|------|---------|------|
| Android 手机 | 🟢 和 QQ 一样装 .apk | Flutter 最成熟平台 |
| Android 平板 | 🟢 同上 | 界面自适应大屏 |
| Windows 电脑 | 🟢 和 QQ 一样装 .exe | Flutter Windows 桌面端 |
| iPhone / iPad | 🔴 做不了 | 无 Mac + 无开发者账号 |

## 为什么不用 PWA 网站？

用户要求「像 QQ 一样的独立程序」，不是浏览器打开网页。PWA（添加到主屏幕）本质仍是网页，体验有差距：

| | Flutter App | PWA 网站 |
|---|---|---|
| Google Play / App Store 分发 | 可以 | 不可以 |
| 系统通知栏推送 | ✅ | ⚠️ iOS 不支持 |
| 后台运行 | ✅ | ❌ |
| 本地 SQLite 持久稳定 | ✅ | 🟡 IndexedDB 清缓存就丢 |
| 指纹/面容解锁 | ✅ 原生调用 | 🟡 WebAuthn 体验差 |
| 文件系统访问 | ✅ | 🟡 File API 受限 |
| 离线打开 | ✅ | ⚠️ 依赖 Service Worker |
| 打开方式 | 桌面图标，独立窗口 | 需要浏览器，有地址栏感 |

## 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 跨平台框架 | Flutter 3.x + Dart | 一套代码 → Android + Windows |
| Markdown 渲染 | flutter_markdown | 展示知识库文章内容 |
| 本地数据库 | sqflite | SQLite，复刻 bill_db.py 的 schema |
| 状态管理 | Provider | 轻量 |
| HTTP 客户端 | dio | GitHub API（拉文章 + 推灵感） |
| CSV 解析 | csv | 复刻 bill_parser.py 关键词规则 |
| 图表 | fl_chart | 月度收支柱状图 + 分类饼图 |
| 加密 | encrypt (AES-256) | 账单导出/导入加密 |
| 安全存储 | flutter_secure_storage | 存密码哈希 + GitHub Token |
| 本地认证 | local_auth | 指纹/面容替代输密码 |
| 本地通知 | flutter_local_notifications | 每月1号提醒 |
| 文件选择 | file_picker | 选 CSV 文件导入 |

## 数据流

### 知识库文章浏览
```
App 启动 → GitHub API GET /repos/polaris-esy/knowledge-base/contents/{分类目录}/
→ 获取 .md 文件列表 → 用户点文章 → GET 文件内容 → flutter_markdown 渲染
→ 可选：离线缓存到本地 SQLite（上次阅读过的文章）
```

### 灵感便签推送
```
用户填表 → Dart 生成 .md frontmatter → Base64 编码
→ GitHub Contents API PUT /repos/polaris-esy/knowledge-base/contents/{分类}/{slug}.md
→ 无需 git clone、无需本地仓库、无需 VPN
→ 手机 4G/5G 都直接推，电脑 WiFi 也直接推
→ 推送后 GitHub Actions 自动 rebuild 网站
```

### 账单数据
```
CSV 文件 → file_picker 选取 → Dart 解析（复用 bill_parser.py 关键词规则）
→ 自动分类 → 存入本地 SQLite → 去重（trade_time + amount + counterparty）
→ 月度统计页面展示

换设备恢复：
  SQLite → JSON → AES-256 加密 → 保存 .enc 文件
  → 手动传另一设备（微信/AirDrop/网盘任意方式）
  → 输入密码解密 → 合并到本地库
```

## 项目结构（位于 knowledge-base 仓库内）

```
knowledge-base/                  # 现有仓库不变
├── 💬 对话精华/
├── 📚 技术笔记/
├── 🛠 踩坑记录/
├── 💡 灵感便签/
├── 🎨 设计素材/
├── 📋 项目日志/
├── app/                         # 新增：Flutter App 源码
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app_theme.dart
│   │   ├── models/
│   │   │   ├── bill.dart
│   │   │   └── article.dart
│   │   ├── services/
│   │   │   ├── database_service.dart
│   │   │   ├── csv_parser.dart
│   │   │   ├── github_api.dart
│   │   │   ├── encrypt_service.dart
│   │   │   ├── auth_service.dart
│   │   │   └── notification_service.dart
│   │   ├── providers/
│   │   ├── screens/
│   │   │   ├── lock_screen.dart
│   │   │   ├── home_screen.dart
│   │   │   ├── knowledge_tab.dart      # 知识库浏览
│   │   │   ├── inspiration_tab.dart     # 灵感便签
│   │   │   ├── import_tab.dart          # CSV导入
│   │   │   ├── stats_tab.dart           # 收支统计
│   │   │   └── settings_screen.dart
│   │   └── widgets/
│   ├── pubspec.yaml
│   ├── android/
│   └── windows/
├── .github/workflows/deploy.yml   # 现有：网站部署
├── scripts/
├── index.md
└── package.json
```

## 已实现的依赖功能

### tkinter 桌面版（直接复刻逻辑）

| 源文件 | 功能 | 迁移去向 |
|--------|------|---------|
| `C:\Users\15596\Desktop\记账工具\main.pyw` | 三页签 UI | `lib/screens/*.dart` |
| `C:\Users\15596\Desktop\记账工具\bill_db.py` | SQLite schema + 查询 | `lib/services/database_service.dart` |
| `C:\Users\15596\Desktop\记账工具\bill_parser.py` | CSV 解析 + 9类关键词分类 | `lib/services/csv_parser.dart` |
| `C:\Users\15596\Desktop\记账工具\sync_manager.py` | git push（废弃，改 GitHub API） | `lib/services/github_api.dart` |

### 知识库网站（数据源 + 渲染目标）

- `.md` 文件格式规范（frontmatter）
- `scripts/generate-graph.mjs`（网站 build 时重新生成图谱，App 直接调 GitHub API 不依赖它）
- Dark Modern SaaS 色板令牌（16 色，直接映射到 Flutter ThemeData）

## 待决策

- **iOS 无法覆盖这一点是否接受？** 如果 iPhone/iPad 必须能用，唯一务实方案是把知识库网站升级为 PWA（浏览器打开，添加到主屏幕），放弃真正原生 App 体验。如果 Android + Windows 足够，Flutter 方案可行
- **账单跨设备不同步是否接受？** 无后端服务器 = 数据不通。可以通过加密导出/导入手动搬运，但做不到打开 App 自动同步
