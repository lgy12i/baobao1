# 宝宝商城 · 线上部署指南（Render 免费版）

> 本文档说明如何把宝宝商城部署到 Render 免费版，无需云服务器。

---

## 一、部署架构

```
GitHub 仓库 baobao1
    │ push / auto-deploy
    ▼
┌────────────────────────────────────────────────────┐
│  Render · Web Service (免费版)                       │
│  名称: baobao-mall                                   │
│  区域: singapore                                     │
│                                                      │
│  构建阶段:                                           │
│   1. cd frontend && npm install && npm run build     │
│   2. cd backend && npm install                       │
│                                                      │
│  运行阶段（单服务同源）：                              │
│   node backend/src/app.js                           │
│   ├─ /api/v1/*      → Express API 路由               │
│   ├─ /uploads/*    → 后端静态资源                    │
│   ├─ /health       → 健康检查                        │
│   ├─ /assets/*     → 前端构建产物（一年强缓存）       │
│   └─ /*            → 前端 SPA（index.html 兜底）     │
│                                                      │
│  访问地址: https://baobao-mall.onrender.com          │
└────────────────────────────────────────────────────┘
```

**为什么单服务同源部署？**
- 节省 Render 免费额度（免费版只能开 1 个常驻 Web Service）
- 前端和后端同源，无 CORS 跨域问题
- 配置简单，一次部署搞定

---

## 二、部署前准备

### 2.1 确保代码已推送到 GitHub
仓库地址：`https://github.com/lgy12i/baobao1`

### 2.2 关键文件清单
| 文件 | 作用 |
|------|------|
| `render.yaml` | Render Blueprint 配置 |
| `render-build.sh` | 构建脚本（前端构建 + 后端装依赖）|
| `backend/src/app.js` | 已修改：生产环境托管 frontend/dist |
| `.gitignore` | 已排除 node_modules、dist、.env |

---

## 三、Render 控制台操作步骤

### 步骤 1：注册 Render
打开 https://render.com → 用 GitHub 账号登录

### 步骤 2：创建 Blueprint（推荐）
1. 进入 Dashboard → 右上角 **New +** → **Blueprint**
2. 选择 GitHub 仓库 `lgy12i/baobao1`
3. Render 会自动读取 `render.yaml` 配置
4. 在 Environment Variables 界面填入两个 `sync: false` 的变量：
   - `AI_API_KEY`：你的 Qwen DashScope API Key（若不填会走知识库兜底模式）
   - `AI_FALLBACK_KEY`：DeepSeek API Key（可选）
5. 点 **Apply** 开始构建

### 步骤 3：手动创建（备用方案）
如果 Blueprint 不工作，可以手动创建：

1. Dashboard → **New +** → **Web Service**
2. 选择仓库 `lgy12i/baobao1`，分支 `main`
3. 填写配置：
   - **Name**: `baobao-mall`
   - **Runtime**: `Node`
   - **Region**: `Singapore`（或 Oregon）
   - **Plan**: `Free`
   - **Build Command**: `bash render-build.sh`
   - **Start Command**: `node backend/src/app.js`
   - **Health Check Path**: `/health`
4. 添加环境变量（见下方 3.1）

### 3.1 必填环境变量

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `3000` | 端口 |
| `CLIENT_URL` | `*` | CORS 允许所有源 |
| `JWT_SECRET` | `baobao-mall-jwt-secret-render-2026` | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |

### 3.2 可选环境变量（AI 功能）

| Key | Value | 说明 |
|-----|-------|------|
| `AI_API_KEY` | `sk-xxx` | Qwen DashScope API Key |
| `AI_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Qwen 接口 |
| `AI_MODEL` | `qwen-max` | 主模型 |
| `AI_FALLBACK_KEY` | `sk-yyy` | DeepSeek API Key（备用）|
| `AI_FALLBACK_BASE` | `https://api.deepseek.com/v1` | DeepSeek 接口 |
| `AI_FALLBACK_MODEL` | `deepseek-chat` | 备用模型 |

> 不配置 AI_API_KEY 也能运行，AI 助手走知识库兜底模式，仍能回答发货/退货/活动等问题。

### 步骤 4：等待首次构建
- 首次构建约 3-5 分钟
- 构建日志在 Dashboard 实时显示
- 看到 `✓ 服务器启动成功！` 即部署成功

### 步骤 5：访问
- 网站地址：`https://baobao-mall.onrender.com`（名字按你的实际服务名）
- 健康检查：`https://baobao-mall.onrender.com/health`
- AI 状态：`https://baobao-mall.onrender.com/api/v1/ai/status`

---

## 四、Render 免费版限制与应对

| 限制 | 影响 | 应对 |
|------|------|------|
| **15 分钟无流量自动休眠** | 首次访问需 30-60 秒冷启动 | 用 UptimeRobot 每 10 分钟 ping `/health` |
| **512MB 内存** | 商品数据量大可能 OOM | 项目用内存存储，数据量小（~30 商品）无压力 |
| **750 小时/月** | 单服务 24×7 = 720h，刚好够用 | 只部署 1 个服务 |
| **构建 15 分钟超时** | 复杂构建可能超时 | render-build.sh 已精简，构建约 3-5 分钟 |
| **无持久化磁盘** | 重启后用户上传图片丢失 | 项目用 SVG 占位图兜底，无影响 |

### 4.1 配置防休眠（可选）
注册 https://uptimerobot.com → 添加 HTTP 监控 → URL 填 `https://你的域名.onrender.com/health` → 间隔 10 分钟

---

## 五、部署后验证清单

```bash
# 1. 健康检查（替换为你的实际域名）
curl https://baobao-mall.onrender.com/health
# 期望: {"status":"ok","storage":"memory",...}

# 2. 商品列表
curl https://baobao-mall.onrender.com/api/v1/products
# 期望: {"code":200,"data":{"list":[...]}}

# 3. AI 状态
curl https://baobao-mall.onrender.com/api/v1/ai/status
# 期望: {"success":true,"data":{"enabled":...}}

# 4. AI 问答
curl -X POST https://baobao-mall.onrender.com/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"咒术回战有哪些周边？","history":[]}'
# 期望: {"success":true,"data":{"reply":"...","ragHits":["kb_jjk"]}}

# 5. 登录测试
curl -X POST https://baobao-mall.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"testuser","password":"Test123456"}'
# 期望: {"code":200,"data":{"accessToken":"..."}}
```

---

## 六、常见问题

### Q1: 构建失败 "npm: command not found"
Render Node 运行时默认有 npm。检查 runtime 是否选 `Node` 而非 `Docker`。

### Q2: 前端访问 404
检查构建日志是否有 `✓ 前端静态文件托管已启用`。没有说明 frontend/dist 没构建成功。

### Q3: AI 助手不回复
检查 `/api/v1/ai/status` 返回的 `enabled` 字段。`false` 说明没配 AI_API_KEY，会走知识库兜底模式（仍能回答问题）。

### Q4: 冷启动慢
Render 免费版 15 分钟无流量会休眠，首次唤醒 30-60 秒。配置 UptimeRobot 防休眠（见 4.1）。

### Q5: 内存 OOM
Render 免费版 512MB 内存。本项目内存存储约用 50-100MB，不会 OOM。若数据量大需升级付费版或接 MongoDB Atlas 免费版（512MB）。

---

## 七、本地验证（部署前自测）

```bash
# 在本地模拟 Render 的构建和启动流程
cd D:\taotao-mall

# 1. 构建前端
cd frontend && npm install && npm run build && cd ..

# 2. 设置环境变量（PowerShell）
$env:NODE_ENV="production"
$env:PORT="3000"

# 3. 启动后端（会自动托管 frontend/dist）
cd backend && node src/app.js

# 4. 访问 http://localhost:3000
#    /api/v1/products  → API
#    /                 → 前端首页
```

---

**部署文档版本：** 2026-08
**仓库地址：** https://github.com/lgy12i/baobao1
