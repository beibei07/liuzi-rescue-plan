# 汉字练习 App — CLAUDE.md

## 项目简介

一款帮助「提笔忘字」人群练习汉字书写的移动应用。用户通过手写、自我判别、间隔重复等方式系统性地练习汉字，支持词库分级、经典内容练习、每日打卡等功能。个人使用，不商用。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React Native + Expo (SDK 51+) |
| 语言 | TypeScript（严格模式） |
| 本地数据库 | expo-sqlite (SQLite) |
| 手写画布 | react-native-canvas 或 @shopify/react-native-skia |
| 笔顺动画 | hanzi-writer（通过 react-native-svg 渲染） |
| SRS 算法 | ts-fsrs |
| 拼音转换 | pinyin（npm，离线） |
| 语音播放 | expo-speech（系统 TTS） |
| 通知 | expo-notifications |
| 文件选择 | expo-document-picker |
| 文件分享 | expo-sharing |
| 日期处理 | date-fns |
| 导航 | expo-router |

---

## 项目结构

```
hanzi-app/
├── app/                        # expo-router 页面
│   ├── (tabs)/
│   │   ├── index.tsx           # 首页 / 今日练习
│   │   ├── library.tsx         # 经典内容库
│   │   ├── progress.tsx        # 进度 / 掌握度仪表盘
│   │   └── settings.tsx        # 设置
│   ├── practice/
│   │   ├── [id].tsx            # 单字练习页
│   │   └── classic/[id].tsx    # 经典内容练习页
│   └── _layout.tsx
├── components/
│   ├── HandwritingCanvas.tsx   # 手写画布组件
│   ├── StrokeAnimation.tsx     # hanzi-writer 笔顺动画
│   ├── SelfJudgePanel.tsx      # 自我判别按钮组（Again/Hard/Good）
│   ├── PinyinLabel.tsx         # 拼音标注 + 发音按钮
│   ├── DefinitionCard.tsx      # 字义 / 例句展示卡
│   └── StreakBadge.tsx         # 连续打卡天数徽章
├── db/
│   ├── schema.ts               # 建表 SQL
│   ├── db.ts                   # expo-sqlite 初始化
│   ├── characters.ts           # 汉字词库 CRUD
│   ├── quotes.ts               # 名句库 CRUD
│   ├── srs.ts                  # SRS 调度逻辑（ts-fsrs 封装）
│   └── streak.ts               # 打卡 / streak 逻辑
├── data/
│   ├── hsk_500.json            # 高频 500 字词库
│   ├── chars_3500.json         # 教育部 3500 常用字
│   ├── quotes_default.json     # 内置名著名句库（100条）
│   └── poetry/                 # 精选古诗词子集
│       ├── primary_75.json     # 小学必背 75 首
│       └── high_school.json    # 高中必背篇目
├── hooks/
│   ├── useSRS.ts               # SRS 调度 hook
│   ├── useStreak.ts            # 打卡 streak hook
│   └── usePinyin.ts            # 拼音转换 hook
├── utils/
│   ├── pinyin.ts               # 拼音工具函数
│   ├── speech.ts               # expo-speech 封装
│   ├── importExport.ts         # JSON 导入 / 导出逻辑
│   └── difficulty.ts           # 句子难度自动计算（按字数）
└── CLAUDE.md
```

---

## 数据库 Schema

```sql
-- 汉字学习记录（SRS 核心表）
CREATE TABLE IF NOT EXISTS char_cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  character   TEXT NOT NULL UNIQUE,   -- 单个汉字
  pinyin      TEXT,
  definition  TEXT,                   -- 字义（JSON 字符串，含例句）
  level       INTEGER DEFAULT 1,      -- 1=高频500 2=常用3500 3=扩展
  -- FSRS 字段
  due         INTEGER,                -- 下次复习时间戳（ms）
  stability   REAL DEFAULT 0,
  difficulty  REAL DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps        INTEGER DEFAULT 0,
  lapses      INTEGER DEFAULT 0,
  state       INTEGER DEFAULT 0,      -- 0=New 1=Learning 2=Review 3=Relearning
  last_review INTEGER                 -- 上次复习时间戳（ms）
);

-- 名句库（内置 + 用户自定义）
CREATE TABLE IF NOT EXISTS quotes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  text        TEXT NOT NULL,
  author      TEXT,
  work        TEXT,
  category    TEXT DEFAULT 'novel',   -- 'novel' | 'poetry' | 'film' | 'custom'
  source      TEXT DEFAULT 'default', -- 'default' | 'user'
  difficulty  INTEGER DEFAULT 2,      -- 1=短句≤20字 2=中句21-50字 3=长句>50字
  created_at  INTEGER
);

-- 练习记录日志
CREATE TABLE IF NOT EXISTS practice_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,          -- 'char' | 'quote'
  ref_id      INTEGER NOT NULL,       -- char_cards.id 或 quotes.id
  rating      INTEGER NOT NULL,       -- 1=Again 2=Hard 3=Good
  practiced_at INTEGER NOT NULL       -- 时间戳（ms）
);

-- 每日打卡记录
CREATE TABLE IF NOT EXISTS streak (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  date            TEXT NOT NULL UNIQUE, -- 'YYYY-MM-DD'
  chars_practiced INTEGER DEFAULT 0,
  quotes_practiced INTEGER DEFAULT 0
);
```

---

## 核心功能规格

### 1. 手写 + 自我判别
- 用 Canvas 捕获手写笔迹（黑色笔画，白色背景）
- 写完后在旁边展示 hanzi-writer 的标准字形
- 用户点击三档按钮：**又错了（Again）/ 有点难（Hard）/ 记住了（Good）**
- 按钮评分直接作为 ts-fsrs 的 Rating 输入

### 2. 笔顺动画
- 用户点「看笔顺」后播放 hanzi-writer 逐笔动画
- 支持暂停 / 重播
- 速度固定为 1x（不需要调速）

### 3. SRS 间隔重复
- 使用 ts-fsrs 的 `createEmptyCard()` 和 `fsrs.repeat()` 方法
- 每次评判后更新 `char_cards` 表的 FSRS 字段
- 首页「今日练习」展示所有 `due <= now` 的到期卡片
- 新字默认插入，due = now（立即可练）

### 4. 拼音 + 语音
- 使用 `pinyin` npm 包转换，支持多音字
- 拼音显示在汉字上方（带声调符号，如 nǐ hǎo）
- 点击喇叭图标调用 `expo-speech` 朗读，language: 'zh-CN'

### 5. 字义 / 例句
- 字义数据来源：CC-CEDICT 预处理后的 JSON，或 Claude API 批量生成
- 展示格式：词性标签 + 释义 + 2 条例句
- 在练习完成后（自我判别后）展示，不提前显示

### 6. 每日打卡 + Streak
- 每次完成练习自动记录当天日期到 `streak` 表
- Streak 计算：查询连续天数（today、yesterday、day before…）
- 首页顶部显示当前连续天数和火焰图标
- 每日目标：默认 10 个字（可在设置里调整）

### 7. 经典内容库
- **古诗词**：从 `data/poetry/` 读取精选 JSON，按朝代 / 作者展示
- **名著名句**：从 `quotes` 表读取，支持按 author / work / category 筛选
- **练习模式**：随机挖空句子中若干汉字，用户逐字默写填入
- **挖空策略**：优先挖掉笔画复杂字和高频易错字，其次随机

### 8. 内容管理
- **应用内添加**：表单输入（原文必填，作者/作品选填），保存到 `quotes` 表，`source = 'user'`
- **JSON 导入**：用 `expo-document-picker` 选择 `.json` 文件，解析后批量 INSERT，格式与 `quotes_default.json` 相同
- **难度自动计算**：字数 ≤20 → difficulty=1，21-50 → difficulty=2，>50 → difficulty=3

---

## 开发规范

- 所有异步数据库操作用 `async/await`，不用回调
- 组件用函数式组件 + hooks，不用 class
- 颜色 / 字号等 UI 常量统一放 `constants/theme.ts`
- 不使用 Redux，局部状态用 `useState`，跨页面状态用 React Context
- 数据库操作全部封装在 `db/` 目录，页面组件不直接写 SQL
- 每个功能模块独立文件，不把所有逻辑堆在一个文件里

---

## 开发顺序（推荐）

1. 项目初始化 + expo-router 导航框架
2. SQLite 数据库初始化 + schema 建表
3. 导入 `quotes_default.json` 和高频 500 字词库
4. SRS 核心逻辑（ts-fsrs 封装 + char_cards CRUD）
5. 拼音转换 + expo-speech 语音
6. 手写 Canvas + 自我判别面板
7. hanzi-writer 笔顺动画
8. 字义 / 例句展示卡
9. 每日打卡 + Streak
10. 经典内容库页面 + 挖空练习
11. 应用内添加名句 + JSON 导入
12. 首页「今日练习」整体串联
13. 整体 UI 打磨 + 测试
