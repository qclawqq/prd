# 爱心公益平台

> 巴马瑶族自治县佳妮艺术支教教育服务中心 — 爱心捐助平台

## 技术栈

- **前端**：React 18 + Vite + React Router 6 + Axios
- **后端**：Express.js（可部署为 Netlify Functions）
- **数据库**：Neon PostgreSQL
- **媒体存储**：Cloudinary

## 本地开发

### 1. 安装依赖

```bash
# 安装前后端依赖
cd frontend && npm install
cd ../netlify/functions && npm install
```

### 2. 配置环境变量

**前端** (`frontend/.env`)：
```
VITE_API_BASE=/api
VITE_CLOUDINARY_CLOUD_NAME=dtultipb8
VITE_UPLOAD_PRESET=donation_unsigned
```

**后端** (`netlify/functions/.env`)：
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=admin123
```

### 3. 初始化数据库

在 Neon PostgreSQL 中执行 `schema.sql` 脚本。

### 4. 启动开发服务器

```bash
# 终端1：后端 API（端口 3001）
cd netlify/functions && npm run dev

# 终端2：前端（端口 5173）
cd frontend && npm run dev
```

## 部署

### GitHub + Netlify 自动部署

1. 将代码推送到 GitHub
2. 在 [Netlify](https://netlify.com) 连接仓库
3. 配置环境变量（见上）
4. 触发部署

## 项目结构

```
donation-platform/
├── frontend/                # React 前端
│   ├── src/
│   │   ├── api/             # API 调用
│   │   ├── components/       # 组件
│   │   ├── pages/           # 页面
│   │   ├── hooks/           # 自定义 Hooks
│   │   └── utils/           # 工具函数
│   └── public/
│       └── seal.png         # 公章图片（需替换）
├── netlify/
│   └── functions/
│       └── api.js           # Express 后端
├── schema.sql               # 数据库初始化
└── netlify.toml            # Netlify 配置
```

## 功能模块

- ✅ 募捐项目管理（创建/编辑/结束）
- ✅ 捐赠（捐款/捐物/志愿者报名）
- ✅ 爱心捐助证书（PDF 自动生成）
- ✅ 库存管理与领用
- ✅ 成果展示
- ✅ 爱心故事墙（拖拽排序）
- ✅ 爱心宣传墙轮播
- ✅ 素材库（上传/替换/引用追踪）
- ✅ 仪表盘（统计卡片）
- ✅ JWT 管理员认证
- ✅ 响应式布局
