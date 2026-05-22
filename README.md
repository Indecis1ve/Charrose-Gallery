# Charrose Gallery

<div align="center">
  <p><strong>An elegant, local-first AI photo organization agent.</strong></p>
  <p>您的私人 AI 影像画廊 —— 让每一张照片被理解、被整理、被温柔讲述。</p>
</div>

---

## 简介 (Introduction)

**Charrose Gallery** 是一款基于 **Electron + React + TypeScript + Google Gemini API** 构建的本地桌面端 AI 智能相册应用。

它不只是一个照片展示工具，更是一个面向私人影像管理场景的 **AI Photo Curation Agent**。应用可以在照片上传后自动理解画面内容，生成诗意标题、叙事描述、语义标签、场景信息与画质标记；同时支持用户通过自然语言提出整理目标，由 AI 生成可编辑的逻辑相册草稿，并在用户确认后完成本地相册归档。

所有照片均存储在本地硬盘中。AI 只参与图像理解、语义分析和整理建议生成，真正的相册创建、数据持久化与文件安全控制均由本地 Electron 应用完成。

---

## 核心亮点 (Highlights)

- **Local-first 本地优先**：照片文件保存在本地 `charrose_photos` 文件夹中，不依赖云端相册。
- **Gemini 多模态图像理解**：自动生成标题、描述、标签、场景类型、人物数量与画质标记。
- **Agent 式照片整理流程**：支持自然语言整理目标，自动生成相册建议，并提供人工确认机制。
- **逻辑相册设计**：创建、删除、重命名相册时不移动、不重命名、不删除原始图片。
- **个性化归档规则**：支持自定义关键词、标签、质量标记到目标相册的映射关系。
- **离线兜底分类**：Gemini 不可用时，自动使用本地规则引擎完成基础分类。
- **优雅画廊体验**：Stone 暗色美学、瀑布流布局、灯箱预览与动态相册侧边栏。

---

## 核心功能 (Features)

### 1. 艺术感视觉画廊 (Artistic Photo Gallery)

Charrose Gallery 采用极简暗色视觉风格，结合 Stone 色调、精致排版与沉浸式图片展示，为个人摄影作品提供具有美感的本地浏览体验。

主要能力包括：

- **Stone Style 暗色美学**
  - 深色石墨质感界面。
  - 高对比度照片展示区域。
  - 适合摄影、旅行、生活记录等视觉内容浏览。

- **瀑布流照片墙**
  - 支持 Masonry 瀑布流布局。
  - 自动适配不同尺寸与比例的图片。
  - 图片卡片支持悬停微动效果与平滑加载。

- **灯箱大图预览**
  - 支持全屏大图浏览。
  - 支持键盘左右方向键切换照片。
  - 支持 ESC 退出预览。
  - 支持单张照片删除。
  - 支持展示标题、描述、标签与元数据面板。

- **本地拖拽上传**
  - 支持拖拽导入图片。
  - 支持本地图片压缩处理。
  - 默认使用最大 1200px 限制，在保证画质的同时减少本地存储占用。

### 2. 单张照片 AI 深度解析 (AI Photo Analyzer)

上传照片后，Charrose Gallery 会调用 Google Gemini API 对照片进行多模态分析，并生成结构化元数据。

AI 分析内容包括：

- **诗意标题**：自动生成简短、优雅、富有故事感的标题，标题控制在 6 个词以内。
- **叙事描述**：生成温暖、怀旧或艺术风格的照片描述，为静态照片补充情绪化的视觉叙事。
- **语义标签**：自动提取 3 到 5 个 lowercase 标签，标签可用于检索、分类、相册整理和规则匹配。
- **场景与人物判定**：判断照片场景类型、室内/室外环境，以及画面中是否包含单人、多人或无人场景。
- **质量标记 (Quality Flags)**：自动识别模糊、过暗、低光照、截图等情况，可用于后续整理到 Review、Low Quality、Screenshots 等相册。

示例结构化分析结果：

```json
{
  "title": "Golden Evening Walk",
  "description": "A warm and quiet moment captured under fading sunlight.",
  "tags": ["sunset", "street", "warm", "travel"],
  "scene": "outdoor evening street",
  "people": "one",
  "locationType": "outdoor",
  "qualityFlags": ["low-light"]
}
```

### 3. AI 智能相册整理 Agent (AI Photo Organization Agent)

Charrose Gallery 新增了一个面向照片整理场景的 **Human-in-the-loop AI Agent 工作流**。

用户不需要手动逐张分类，只需输入整理目标，例如：

```text
帮我把照片按旅游、小动物、美食和模糊评测归档
```

系统会自动完成：

```text
选择待整理照片
↓
复用已有 AI 元数据
↓
补充分析缺失元数据的照片
↓
调用 Gemini 生成相册建议
↓
展示可编辑相册草稿
↓
用户人工确认与微调
↓
创建本地逻辑相册
```

#### AI Organizer Wizard

AI 整理向导支持：

- 选择整理范围：所有照片、未分类照片。
- 输入自然语言整理目标：按旅行、美食、人物、宠物分类；单独整理天空、大自然和日常美食；找出模糊、低光照或需要复查的照片；将截图、文档类图片单独归档。
- 显示全流程进度：正在准备照片、正在分析照片、正在通过 Gemini 生成分组、正在应用相册结果。

#### Album Suggestion Review

AI 生成的相册不会直接写入系统，而是先进入可视化草稿箱。

用户可以在确认前进行：

- 修改相册名称。
- 修改相册描述。
- 查看 AI 推荐理由。
- 查看置信度。
- 删除不需要的推荐相册。
- 从某个推荐相册中移除错误照片。
- 对低置信度相册进行人工确认。

示例 AI 相册建议：

```json
{
  "name": "Quiet Nature Moments",
  "description": "A calm collection of skies, trees, flowers and outdoor landscapes.",
  "reason": "These photos share nature-related tags such as sky, flower, forest and sunset.",
  "photoIds": ["photo_001", "photo_004", "photo_009"],
  "tags": ["nature", "sky", "landscape"],
  "confidence": 0.91
}
```

### 4. 个性化整理偏好规则 (Curation Rules & Preferences)

除了 Gemini 的智能分组，Charrose Gallery 还支持用户自定义本地整理偏好。

用户可以将特定关键词、语义标签或质量标记映射到目标相册，例如：

```text
landscape / sunset / forest  → Nature
food / coffee / cake         → Gourmet
blurry / dark / low-light    → Review
cat / dog / animal           → Pets
screenshot / interface       → Screenshots
```

#### 精确单词边界匹配

为避免误判，系统引入了单词边界匹配机制。例如：

```text
pet      → 可以匹配 pet
petrol   → 不会误匹配 pet
carpet   → 不会误匹配 pet
```

这可以避免因为词根包含关系导致照片被错误归类，提高自动分类的可靠性。

### 5. 新照片上传实时推荐 (Auto-Curation Recommendation)

当新照片上传并完成 AI 分析后，系统会根据用户偏好规则进行实时匹配，并在界面中给出归档建议。

支持场景：

- 如果目标相册已存在，系统会自动推荐归入该相册。
- 如果目标相册不存在，用户可以一键准备创建新相册。
- 成功归档后，侧边栏相册数量会自动同步更新。
- 未分类照片数量也会实时刷新。

该机制让 Charrose Gallery 具备轻量级“持续整理”能力，而不是只在用户手动点击整理时才工作。

### 6. 动态相册侧边栏 (Dynamic Album Sidebar)

Charrose Gallery 提供清晰的相册导航结构：

- **All Moments**：查看全部照片。
- **Unclassified**：查看尚未归入任何逻辑相册的照片。
- **My Albums**：查看用户手动创建或 AI 生成的逻辑相册。

相册侧边栏支持：

- 点击相册过滤照片。
- 显示每个相册的照片数量。
- 区分 AI 相册与用户相册。
- 逻辑删除相册。
- 删除相册时不删除原始照片文件。

### 7. 本地持久化与鲁棒性 (Local Persistence & Robustness)

Charrose Gallery 使用本地 JSON 文件保存相册和元数据关系。

主要数据文件包括：

```text
charrose_photos/       # 本地照片存储目录
charrose_albums.json   # 本地逻辑相册数据
.env.local             # Gemini API Key 配置
```

#### JSON 持久化层

相册数据支持：创建相册、更新相册、删除逻辑相册、读取全部相册、同步相册照片数量、保存 AI 生成与用户创建的相册关系。

#### 损坏恢复机制

如果 `charrose_albums.json` 文件不存在、为空或损坏，系统会：

1. 自动创建新的相册数据文件。
2. 对损坏文件进行 `.bak` 备份。
3. 使用空相册结构恢复应用运行。
4. 避免前端界面因数据损坏而卡死。

#### 本地规则兜底

当出现 Gemini API Key 未配置、网络不可用、Gemini 响应格式异常或 AI JSON 解析失败时，系统会自动切换到本地规则分类引擎，使用内置规则完成基础相册整理，保证核心功能仍然可用。

---

## 技术栈 (Tech Stack)

- **Frontend**：React 19、TypeScript、Vite
- **Desktop**：Electron、Electron IPC、Node.js File System
- **Styling**：Tailwind CSS、Stone-style dark theme
- **AI**：Google Gemini API、Google Generative AI SDK (`@google/genai`)、Multimodal image understanding、Structured JSON generation
- **Local Data**：Local file system、JSON persistence、Rule-based fallback engine

---

## 系统架构 (Architecture)

```text
React Renderer Process
负责 UI 交互、照片墙展示、AI 整理向导、相册侧边栏
        ↓
Electron IPC Bridge
连接前端操作与本地系统能力
        ↓
Electron Main Process
负责本地文件读写、照片保存、相册 JSON 持久化
        ↓
Gemini API / Local Rules
负责图像理解、语义标签、整理建议与兜底分类
```

---

## 项目结构 (Project Structure)

```text
charrose-gallery/
├── electron/
│   └── main.cjs                    # Electron 主进程，负责窗口、本地文件与 IPC
├── src/
│   ├── components/
│   │   ├── ClassificationWizard.tsx # AI 智能分类向导
│   │   ├── AlbumSuggestionReview.tsx# AI 相册建议审查组件
│   │   ├── AlbumSidebar.tsx         # 动态相册侧边栏
│   │   └── ...                      # 其他 UI 组件
│   ├── services/
│   │   ├── classificationService.ts # Gemini 分类与相册建议服务
│   │   ├── albumService.ts          # 相册数据读写服务
│   │   └── ...                      # 其他服务
│   ├── utils/
│   │   ├── classificationRules.ts   # 本地规则分类引擎
│   │   ├── safeJson.ts              # Gemini JSON 安全解析
│   │   └── ...
│   ├── App.tsx                      # 应用主入口
│   └── types.ts                     # TypeScript 类型定义
├── charrose_photos/                 # [自动生成] 本地照片存储目录
├── charrose_albums.json             # [自动生成] 本地逻辑相册数据
├── release/                         # [自动生成] 打包输出目录
├── .env.local                       # Gemini API Key 配置文件
├── package.json
└── README.md
```

---

## 界面预览 (UI Preview)

<img width="448.8" height="300" alt="Charrose Gallery UI" src="https://github.com/user-attachments/assets/72579531-209c-4a96-8711-8f82076a0bbf" />
<img width="448.8" height="300" alt="Charrose Gallery Lightbox" src="https://github.com/user-attachments/assets/a022e4d9-abe3-436b-8508-70d1d2197673" />

---

## 快速开始 (Getting Started)

### 环境要求

请确保本地已安装：

- Node.js v18 或更高版本
- npm
- Google Gemini API Key
- 可访问 Gemini API 的网络环境

Gemini API Key 可在 Google AI Studio 获取：

```text
https://aistudio.google.com/app/apikey
```

### 1. 克隆项目

```bash
git clone https://github.com/Indecis1ve/Charrose-Gallery.git
cd Charrose-Gallery
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API Key

在项目根目录创建 `.env.local` 文件：

```bash
GEMINI_API_KEY=your_api_key_here
```

如果没有配置 Gemini API Key，应用仍可启动，但 AI 图像分析能力会受限；智能分类功能会优先使用本地规则兜底。

### 4. 运行开发模式

```bash
npm run electron:dev
```

### 5. 打包构建

```bash
npm run electron:build
```

构建完成后，输出文件位于 `release/`。其中 `.exe` 是 Windows 安装程序，`win-unpacked/` 是 Windows 免安装版。

---

## 使用说明 (Usage)

### 上传照片

1. 打开应用。
2. 将图片拖入上传区域，或点击上传按钮选择图片。
3. 系统会将图片保存到本地 `charrose_photos` 文件夹。
4. Gemini 会自动生成标题、描述和标签。
5. 照片会出现在瀑布流画廊中。

### 使用 AI 智能分类

1. 点击右上角的 **AI Organizer** 或 **AI 智能分类** 按钮。
2. 选择整理范围：All Photos 或 Unclassified。
3. 输入自然语言整理目标，例如：

```text
我想单独整理出天空、大自然相关的风景，以及日常美食照片
```

4. 点击 **Start AI Classification**。
5. 系统会展示 AI 生成的相册草稿。
6. 用户可以修改名称、描述，或移除错误照片。
7. 点击 **Confirm & Create Albums**。
8. 左侧相册栏会自动出现新的逻辑相册。

### 使用偏好规则

可以在偏好规则面板中配置标签到相册的映射关系，例如：

```text
sunset, sky, forest → Nature
coffee, cake, food  → Gourmet
blurry, dark        → Review
```

之后新照片上传并完成 AI 分析后，系统会自动推荐归档目标。

---

## 数据安全说明 (Data Safety)

Charrose Gallery 的设计原则是：

```text
AI 可以建议，但不能擅自破坏用户数据。
```

因此：

- 删除逻辑相册不会删除照片文件。
- AI 分类不会移动照片文件。
- AI 分类不会重命名照片文件。
- 创建相册只保存照片 ID 与相册之间的关系。
- 原始照片始终保存在本地 `charrose_photos` 文件夹中。
- 只有在图像分析时，图片内容会被发送给 Gemini API。

---

## AI Agent 定位说明

Charrose Gallery 可以被视为一个面向私人影像管理场景的 **Human-in-the-loop AI Photo Organization Agent**。

它具备以下 Agent 特征：

- 用户可以输入自然语言目标。
- 系统会根据目标执行多步骤整理流程。
- Gemini 负责图像理解与语义分组。
- 本地规则引擎负责偏好匹配与失败兜底。
- Electron 本地工具负责文件读写和状态持久化。
- 用户在最终创建相册前拥有确认与编辑权。
- 系统能够在新照片上传后基于偏好规则进行实时归档推荐。

它不是完全自主型通用 Agent，而是一个垂直领域、半自主、注重安全边界的本地 AI 整理 Agent。

---

## 后续计划 (Roadmap)

- [ ] 支持相册拖拽排序。
- [ ] 支持照片在相册之间拖拽移动。
- [ ] 支持相册导出为真实文件夹。
- [ ] 支持重复照片检测。
- [ ] 支持按时间线自动聚合照片。
- [ ] 支持更细粒度的人物、地点、事件聚类。
- [ ] 支持用户偏好长期学习。
- [ ] 支持后台监听新照片并自动生成整理建议。
- [ ] 支持更多本地模型或离线视觉模型接入。

---

## 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request。

如果您有更好的 UI 设计建议，或希望加入新的 AI 功能，例如：按地点自动分类、人物聚类、重复照片检测、相册故事生成、本地离线模型支持、多语言标题与描述生成，都欢迎参与改进。

---

## 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。
