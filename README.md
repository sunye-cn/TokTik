# TokTik 🎵

TokTik 是一个基于 **Vue 3** 和 **Node.js** 构建的全栈短视频分享平台。它模仿了现代短视频应用的核心体验，支持瀑布流浏览、视频录制与上传、弹幕互动等功能。

![TokTik Banner](https://via.placeholder.com/1200x400?text=TokTik+Project+Preview)
*(此处可以替换为项目的实际截图)*

## ✨ 项目亮点 (Features)

- **📹 沉浸式浏览**: 采用高性能**瀑布流布局 (Masonry Layout)**，结合无限滚动加载，提供流畅的视频浏览体验。
- **🎥 视频创作**:
  - 支持**在线录制**: 调用原生摄像头进行拍摄，支持实时预览。
  - **镜像处理**: 智能处理前置摄像头镜像问题，确保“所见即所得”。
  - **自定义上传**: 美观的原生感文件选择器，支持拖拽与预览。
- **💬 互动系统**:
  - **弹幕 (Danmaku)**: 视频播放时支持实时弹幕飘过，增强互动感。
  - **点赞与关注**: 完整的社交互动链路。
- **🎨 现代化 UI**: 基于 **Tailwind CSS** 和 **Shadcn UI** 构建，界面简洁美观，响应式设计适配多种屏幕。

## 🛠️ 技术栈 (Tech Stack)

### 前端 (Frontend)
- **框架**: Vue 3 (Composition API + TypeScript)
- **构建工具**: Vue CLI / Vite
- **样式**: Tailwind CSS
- **组件库**: Shadcn UI (Radix Vue), Lucide Icons
- **状态管理**: Vuex / Pinia
- **路由**: Vue Router

### 后端 (Backend)
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: PostgreSQL
- **ORM**: TypeORM
- **认证**: JWT (JSON Web Token)
- **文件处理**: Multer

## 🚀 快速开始 (Getting Started)

按照以下步骤在你的本地机器上运行 TokTik。

### 前置要求 (Prerequisites)
- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) (v13+)
- [Git](https://git-scm.com/)

### 1. 克隆项目 (Clone Repository)

```bash
git clone https://github.com/yourusername/toktik.git
cd toktik
```

### 2. 数据库设置 (Database Setup)

确保你的 PostgreSQL 服务正在运行，并创建一个名为 `toktik` 的数据库。

```sql
CREATE DATABASE toktik;
```

### 3. 后端设置 (Server Setup)

进入 `server` 目录，安装依赖并启动服务。

```bash
cd server

# 安装依赖
npm install

# 配置环境变量 (可选，默认连接本地 postgres)
# 你可以复制 .env.example 为 .env 并修改配置
# cp .env.example .env

# 启动开发服务器
npm run dev
```

> 后端服务默认运行在 `http://localhost:3000`。
> 启动时 TypeORM 会自动同步数据库表结构 (`synchronize: true`)。

### 4. 前端设置 (Web Setup)

打开一个新的终端窗口，进入 `web` 目录，安装依赖并启动前端。

```bash
cd web

# 安装依赖
npm install

# 启动开发服务器
npm run serve
```

> 前端服务默认运行在 `http://localhost:8080`。

## ⚙️ 环境变量 (Environment Variables)

### Server (`server/.env`)

如果需要修改默认配置，请在 `server` 目录下创建 `.env` 文件：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=toktik
JWT_SECRET=your_super_secret_key
```

## 📂 项目结构 (Project Structure)

```
TokTik/
├── server/                 # 后端代码
│   ├── src/
│   │   ├── controllers/    # 业务逻辑控制器
│   │   ├── entity/         # TypeORM 实体定义
│   │   ├── routes/         # API 路由定义
│   │   └── ...
│   └── uploads/            # 上传的视频文件存储目录
├── web/                    # 前端代码
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   ├── views/          # 页面视图
│   │   ├── store/          # 状态管理
│   │   └── ...
│   └── ...
└── README.md
```

## 🤝 贡献 (Contribution)

欢迎提交 Issue 或 Pull Request 来改进这个项目！

## 📄 许可证 (License)

[MIT](LICENSE)
