#  Charrose Gallery

<div align="center">
  <p><strong>An elegant, AI-powered desktop photo album.</strong></p>
  <p>您的私人 AI 影像画廊 —— 自动为每一张照片讲述故事。</p>
</div>

---

##  简介 (Introduction)

**Charrose Gallery** 是一个极简主义的桌面端电子相册应用。它致力于通过人工智能为您的珍贵回忆增添色彩，打造沉浸式的浏览体验。

当您上传照片时，内置的 **Google Gemini AI** 会自动分析画面内容，为其生成一个富有诗意的标题、一段温暖怀旧的描述以及相关的标签。所有照片都**安全地存储在您的本地硬盘**中，既保证了隐私，又拥有优雅的画廊体验。

##  核心功能 (Features)

* **AI 智能策展 (AI Smart Curation)**
    * 集成 Google `gemini-2.5-flash` 模型。
    * 自动生成不超过6个词的优雅标题。
    * 自动撰写情感化描述（怀旧、温暖或艺术风格）。
    * 自动提取 3-5 个关键标签，方便回忆。

* **本地隐私优先 (Local Privacy First)**
    * **非云端存储**：摒弃了传统的浏览器缓存或云端上传。
    * **本地文件系统**：所有照片文件直接保存在应用运行目录下的 `charrose_photos` 文件夹中，您拥有数据的完全控制权。
    * **数据安全**：图片仅在分析时短暂发送给 Google API，分析完成后原图仅保存在您自己的电脑上。

* **沉浸式设计 (Elegant UI)**
    * 采用 **瀑布流 (Masonry)** 布局，完美展示不同比例的照片。
    * 深色系 Stone 风格主题，营造高端画廊氛围。
    * 支持 **灯箱模式 (Lightbox)** 全屏浏览，支持键盘左右键切换及删除操作。

* **桌面原生体验**
    * 基于 **Electron** 构建，支持 Windows (及 macOS/Linux) 运行。
    * 支持拖拽上传。
    * 深度集成本地文件读写能力。

##  技术栈 (Tech Stack)

* **前端框架**: React 19, TypeScript, Vite
* **桌面容器**: Electron
* **样式库**: Tailwind CSS
* **AI 模型**: Google Generative AI SDK (`@google/genai`)
* **图标库**: Heroicons (Custom Components)

## 🚀 快速开始 (Getting Started)

### 环境要求
* Node.js (建议 v18 或更高版本)
* Google Gemini API Key ([点击这里免费申请](https://aistudio.google.com/app/apikey))

### 1. 克隆项目
```bash
git clone [[https://github.com/您的用户名/charrose-gallery.git](https://github.com/Indecis1ve/Charrose-Gallery)]
```

### 2. 安装依赖



```bash
# 安装依赖，项目根目录下运行
npm install
```


### 3. 配置 API 密钥

在项目根目录下创建一个名为 `.env.local` 的文件，并填入您的 Google Gemini API Key：

```bash
GEMINI_API_KEY=your_api_key_here
```

### 4. 运行开发模式

同时启动 React 开发服务器和 Electron 窗口：
```bash
npm run electron:dev
```
### 5. 打包构建 (Build & Deploy)

如果您想生成可安装的 `.exe` 文件分享给朋友

```bash
npm run electron:build
```

构建完成后，文件将位于 release/ 文件夹中，执行.exe: 安装程序，支持自定义安装路径

win-unpacked/: 免安装版。

### 6. 项目结构 (Project Structure)

```markdown
charrose-gallery/
├── electron/          # Electron 主进程代码 (负责窗口、系统权限)
│   └── main.cjs
├── src/
│   ├── components/    # UI 组件
│   ├── services/      # AI 服务 (Gemini API 调用)
│   ├── App.tsx        # 主逻辑 (包含本地文件读写、UI 渲染)
│   └── types.ts       # TypeScript 类型定义
├── charrose_photos/   # [自动生成] 本地存储照片的文件夹
├── release/           # [自动生成] 打包后的输出目录
└── .env.local         # 配置文件 (需手动创建)
```
##  贡献 (Contributing)

欢迎提交 Issue 或 Pull Request！
如果您有更好的 UI 设计建议或想添加新的 AI 功能（如按地点分类、人脸识别等），请随时分享。

##  许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。
