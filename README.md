# P33 主编的权柄（左滑右滑）

> 主编的权柄

[![Live Demo](https://img.shields.io/badge/Live-Demo-c7491f?style=for-the-badge)](https://yuuqq.github.io/P33-editor-swipe/)
[![PWA](https://img.shields.io/badge/PWA-Offline_Ready-4ade80?style=for-the-badge)](#)

## 🚀 在线体验

**[https://yuuqq.github.io/P33-editor-swipe/](https://yuuqq.github.io/P33-editor-swipe/)**

支持安装为 PWA 应用，离线使用。

## ✨ 功能特性

- 🌗 暗色/亮色模式一键切换
- 🔍 `Ctrl+K` 跨工具搜索跳转
- 📱 PWA 离线支持（可安装到桌面/手机）
- ♿ 完整无障碍标签（aria-label）
- 🔒 所有数据仅在浏览器本地处理

## ⌨️ 快捷键

| 键位 | 功能 |
|:-----|:-----|
| `←` | 上一项/扣留 |
| `→` | 下一项/发布 |
| `1` `2` `3` | 分级评分 |

## 🛠️ 技术栈

- 纯 HTML + CSS + JavaScript（零依赖框架）
- CSS 变量设计令牌系统
- Service Worker 缓存策略

## 📦 共享模块

- `design-tokens.css` — 统一设计令牌与暗色模式
- `dark-toggle.js` — 🌗 暗色/亮色模式切换
- `cmd-palette.js` — 🔍 Ctrl+K 命令面板
- `toast.js` — 🔔 Toast 通知系统
- `onboarding.js` — 🎯 首次访问引导
- `kbd-hints.js` — ⌨️ 快捷键提示条
- `sw.js` — 📱 PWA Service Worker
- `pm-metrics.js` — 📊 使用量遥测

## 📄 许可

本项目为新闻素养教学工具，仅供学习与研究使用。

---

*本项目是 [新闻素养工具箱](https://yuuqq.github.io/journalism-toolbox/) 的第 33 号工具。*
