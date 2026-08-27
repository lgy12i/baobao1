# 宝宝商城 · 技术深度解析（Docker + Kubernetes + AI Agent RAG）

> 仓库：https://github.com/lgy12i/baobao2

---

## 目录

- [一、项目全景与技术栈](#一项目全景与技术栈)
- [二、Docker 容器化深度解析](#二docker-容器化深度解析)
- [三、Docker Compose 单机编排深度解析](#三docker-compose-单机编排深度解析)
- [四、Kubernetes 集群部署深度解析](#四kubernetes-集群部署深度解析)
- [五、GitHub Actions CI/CD 深度解析](#五github-actions-cicd-深度解析)
- [六、AI Agent + RAG 知识库深度解析](#六ai-agent--rag-知识库深度解析)
- [七、技术闭环与架构总结](#七技术闭环与架构总结)
- [八、复现与验证流程](#八复现与验证流程)

---

## 一、项目全景与技术栈

### 1.1 项目定位

**宝宝商城**B2C 全栈电商平台，融合霓虹潮流主题，包含完整的电商业务闭环：

- 商品浏览 / 搜索 / 筛选
- 购物车 / 下单结算 / 订单管理
- 用户认证 / 个人中心
- 营销模块（限时秒杀 / 优惠券 / 拼团）
- **AI 智能客服助手**（基于 RAG 知识库）

### 1.2 整体架构

```
┌──────────────────────────────────────────────────────────────────┐
│  客户端 (Browser)                                                 │
│   React 18 + TypeScript + Vite + TailwindCSS + Zustand + React Query│
│   ├─ 路由 (React Router v6)                                       │
│   ├─ 状态 (Zustand)                                              │
│   ├─ 数据请求 (React Query)                                       │
│   ├─ AI 助手悬浮窗 (AIAssistant.tsx)                              │
│   └─ 图片降级组件 (ProductImage.tsx)                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP / REST API + AI Chat
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  服务端 (Node.js 20 + Express)                                     │
│   ├─ 中间件层：JWT 鉴权 / express-rate-limit / helmet / 错误处理    │
│   ├─ 路由层：auth / products / cart / orders / categories / ai     │
│   ├─ 控制器层：业务逻辑 + 参数校验 + 响应格式化                     │
│   ├─ AI 控制器：RAG 检索 → 拼 prompt → 调用 LLM → 主备模型降级      │
│   └─ 数据层：Mongoose ODM + 内存降级存储 (MemoryStore)              │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────┬──────────────────────┬───────────────────┐
│   MongoDB 7.x        │      Redis 7.x       │  外部 LLM API     │
│  用户/商品/订单/购物车 │   会话/缓存/限流计数   │ Qwen / DeepSeek  │
└──────────────────────┴──────────────────────┴───────────────────┘
```

### 1.3 关键文件清单

| 模块 | 文件 | 作用 |
|------|------|------|
| 后端入口 | `backend/src/app.js` | Express 应用启动、中间件装配、路由挂载 |
| AI 控制器 | `backend/src/controllers/ai.controller.js` | AI 问答主流程：RAG 检索 → 调 LLM → 降级 |
| RAG 知识库 | `backend/src/data/knowledge-base.js` | 11 条知识条目 + 关键词检索 + 拼 prompt |
| AI 路由 | `backend/src/routes/ai.routes.js` | AI 接口独立限流（30 req/min） |
| 内存降级 | `backend/src/config/memory-store.js` | Mongo 不可用时的降级存储 |
| 前端 AI 组件 | `frontend/src/components/AIAssistant.tsx` | 悬浮窗聊天 UI + RAG 命中可视化 |
| 前端 AI API | `frontend/src/services/ai.api.ts` | AI 接口前端封装 |
| 图片降级 | `frontend/src/components/ProductImage.tsx` | 多层 onError 兜底 + SVG 占位图 |
| Dockerfile 后端 | `deploy/Dockerfile.backend` | 多阶段构建后端镜像 |
| Dockerfile 前端 | `deploy/Dockerfile.frontend` | 多阶段构建前端镜像 |
| Compose 编排 | `deploy/docker-compose.yml` | 4 服务单机编排 |
| K8s 清单 | `deploy/k8s/*.yaml` | 8 个 YAML（namespace → ingress） |
| CI/CD | `.github/workflows/deploy.yml` | GitHub Actions 自动化流水线 |

---

## 二、Docker 容器化深度解析

### 2.1 做了什么

为前端和后端各写了一个**多阶段构建 Dockerfile**，把"代码 + 依赖"打包成可在任何机器上运行的不可变镜像，解决"在我电脑上能跑"的环境差异问题。

### 2.2 后端 Dockerfile 关键设计

**文件：** [deploy/Dockerfile.backend](./deploy/Dockerfile.backend)

```
Stage 1 (deps)：node:20-alpine
  ├─ COPY backend/package*.json ./       ← 先复制 package.json
  └─ RUN npm ci --omit=optional          ← 安装依赖（利用 layer cache）

Stage 2 (runner)：node:20-alpine
  ├─ RUN adduser appuser (非 root)       ← 最小权限原则
  ├─ COPY --from=deps node_modules       ← 复用 stage1 的依赖
  ├─ COPY backend ./                     ← 复制业务代码
  ├─ USER appuser                        ← 切换非 root
  ├─ HEALTHCHECK /health                 ← 容器健康检查
  └─ CMD ["node", "src/app.js"]          ← 直接用 node 启动
```

**设计决策与原因：**

| 设计 | 解决的问题 |
|------|----------|
| 多阶段构建 | 构建工具链不进运行镜像，体积从 ~1GB 降到 ~350MB |
| 先 COPY package*.json | 依赖不变时直接命中缓存，构建从分钟级降到秒级 |
| alpine 基础镜像 | 体积小、攻击面小 |
| 非 root 用户运行 | 即使容器被攻破，也不会直接拿到宿主机 root |
| HEALTHCHECK | 让 Compose / K8s 知道容器是否真健康，而不只是"进程在跑" |
| `node` 而非 `npm start` | npm 不转发 SIGTERM，会导致优雅停机失效 |

### 2.3 前端 Dockerfile 关键设计

**文件：** [deploy/Dockerfile.frontend](./deploy/Dockerfile.frontend)

```
Stage 1 (build)：node:20-alpine
  ├─ COPY frontend/package*.json ./
  ├─ RUN npm ci
  ├─ COPY frontend ./
  └─ RUN npm run build          ← Vite 构建产物 → /app/dist

Stage 2 (runner)：nginx:1.27-alpine
  ├─ COPY --from=build /app/dist → /usr/share/nginx/html
  ├─ COPY deploy/nginx.conf → /etc/nginx/conf.d/default.conf
  ├─ EXPOSE 80
  └─ CMD ["nginx", "-g", "daemon off;"]
```

**最终前端镜像 ~25MB**（Vite 产物 + Nginx）。

### 2.4 nginx.conf 关键配置

**文件：** [deploy/nginx.conf](./deploy/nginx.conf)

| 配置 | 作用 |
|------|------|
| `try_files $uri /index.html` | SPA 路由兜底，刷新页面不 404 |
| `location /api` 反代 backend:3000 | 解决前端跨域 |
| `location /uploads` 反代 backend | 图片走后端，统一入口 |
| `/assets/*` 一年 immutable 缓存 | 带文件 hash，可永久强缓存 |
| `index.html` no-cache | 保证用户拿到最新 HTML |
| Gzip on | 压缩 JS/CSS，减少 70% 传输 |

---

## 三、Docker Compose 单机编排深度解析

### 3.1 做了什么

一条命令拉起 4 个服务（前端 + 后端 + Mongo + Redis），并保证启动顺序、网络隔离、数据持久化。

**文件：** [deploy/docker-compose.yml](./deploy/docker-compose.yml)

### 3.2 关键设计

#### 1) 服务依赖（启动顺序）
```yaml
backend:
  depends_on:
    mongo: { condition: service_healthy }   # 等 Mongo 真的能 ping 通
    redis: { condition: service_healthy }   # 等 Redis 真的能响应
frontend:
  depends_on:
    backend: { condition: service_healthy }  # 等后端就绪再起 Nginx
```
**作用：** 避免"后端启动比 Mongo 快，连接失败 crash"的经典坑。

#### 2) 网络拆分
```yaml
networks:
  front-tier: { driver: bridge }    # frontend + backend 在这里
  back-tier:   { driver: bridge }   # backend + mongo + redis 在这里
```
**作用：** Mongo/Redis 默认不对外暴露，只有 backend 能访问；frontend 不能直连数据库。

#### 3) 数据持久化（Named Volumes）
```yaml
volumes:
  taotao-mongo-data:    # MongoDB 数据
  taotao-redis-data:    # Redis AOF
  taotao-uploads:       # 用户上传的图片
```
**作用：** `docker compose down` 容器销毁，数据保留；只有 `down -v` 才会删数据。

#### 4) 敏感信息外置
```yaml
environment:
  MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASS}   # 从 .env 读取
  JWT_SECRET: ${JWT_SECRET}
```
**作用：** 密码不进 Git（.env 已在 .gitignore），符合 12-Factor App。

### 3.3 启动流程

```bash
cp deploy/.env.example .env && vim .env
docker compose -f deploy/docker-compose.yml up -d --build
docker exec taotao-backend node src/scripts/seed.js
# 访问 http://服务器IP:8080
```

---

## 四、Kubernetes 集群部署深度解析

### 4.1 做了什么

为生产环境写了 8 个 YAML 清单，覆盖命名空间、配置、存储、数据库、应用、入口、自动扩缩容，实现集群级的生产部署。

### 4.2 清单文件（按 apply 顺序）

| # | 文件 | 资源类型 | 作用 |
|---|------|---------|------|
| 00 | [00-namespace.yaml](./deploy/k8s/00-namespace.yaml) | Namespace + ResourceQuota + LimitRange | 隔离环境，限制资源配额 |
| 01 | [01-config-secret.yaml](./deploy/k8s/01-config-secret.yaml) | ConfigMap + Secret | 非敏感配置 + 密钥分离 |
| 02 | [02-storage.yaml](./deploy/k8s/02-storage.yaml) | 3 × PVC | Mongo/Redis/上传文件持久化 |
| 03 | [03-mongo.yaml](./deploy/k8s/03-mongo.yaml) | **StatefulSet** + Service | MongoDB（有状态服务） |
| 04 | [04-redis.yaml](./deploy/k8s/04-redis.yaml) | Deployment + Service | Redis 缓存 |
| 05 | [05-backend.yaml](./deploy/k8s/05-backend.yaml) | Deployment + HPA + Service | 后端（含探针、HPA、优雅停机） |
| 06 | [06-frontend.yaml](./deploy/k8s/06-frontend.yaml) | Deployment + HPA + Service | 前端 Nginx |
| 07 | [07-ingress.yaml](./deploy/k8s/07-ingress.yaml) | Ingress | 7 层域名路由 + TLS + 限频 |

### 4.3 后端 Deployment 关键设计

**文件：** [deploy/k8s/05-backend.yaml](./deploy/k8s/05-backend.yaml)

#### 1) 副本与滚动更新
```yaml
replicas: 2
strategy:
  type: RollingUpdate
  rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }   # 零停机
```
**作用：** 新 Pod 起来后才摘旧 Pod，整个过程不停流量。

#### 2) initContainer 等待依赖
```yaml
initContainers:
  - name: wait-mongo-redis
    image: busybox:1.36
    command: ['sh', '-c', 'until nc -z taotao-mongo...; do sleep 3; done']
```
**作用：** 后端容器只在 Mongo + Redis 都通后才启动，避免启动期 crash。

#### 3) 三类探针
| 探针 | 失败后果 | 我的配置 |
|------|---------|---------|
| readinessProbe | 从 Service Endpoints 摘除，不接流量 | `/health` successThreshold=2 |
| livenessProbe  | 自动重启 Pod | `/health` period=20s |
| (startup) | 老应用启动慢时使用 | 本项目未用，Node 启动够快 |

#### 4) HPA 自动扩缩
```yaml
minReplicas: 2
maxReplicas: 10
metrics:
  - cpu    target: 60%   # CPU 平均超 60% 扩容
  - memory target: 75%
behavior:
  scaleDown: { stabilizationWindowSeconds: 300 }   # 缩容冷却 5 分钟，防抖动
```

#### 5) 优雅停机
```yaml
terminationGracePeriodSeconds: 45
lifecycle:
  preStop:
    exec: { command: ["/bin/sh", "-c", "sleep 15"] }
```
**作用：** Pod 被删时先从 Endpoints 摘除 → sleep 15s 让 Ingress 刷新 → 再接 SIGTERM，避免"正在转发的请求"失败。

#### 6) 资源限制
```yaml
resources:
  requests: { cpu: 200m, memory: 256Mi }   # 调度依据
  limits:   { cpu: "2",  memory: 2Gi }       # 上限，防止单 Pod 抢资源
```

### 4.4 Mongo 为什么用 StatefulSet

| 维度 | Deployment | StatefulSet |
|------|-----------|-------------|
| Pod 名 | 随机 hash | `mongo-0`、`mongo-1`（稳定） |
| DNS | `mongo-xxx` 不稳定 | `mongo-0.mongo.taotao-mall` 稳定 |
| PVC 绑定 | Pod 换了 PVC 跟着换 | 永远绑定同一个 PVC |
| 适用 | 无状态 API | 数据库（需要稳定身份） |

### 4.5 Ingress 的作用

```
        baobao.lgy12i.com  (TLS 证书)
                │
                ▼
         ┌──────────────┐
         │   Ingress    │   ← 7层路由，限频 100 req/s/IP
         └──────┬───────┘
        /api  /  │  /uploads
              │  │
              ▼  ▼
       backend  frontend
        Svc      Svc
```

**对比：** Service（ClusterIP 集群内）/ NodePort（节点开端口）/ LoadBalancer（云商 LB）/ **Ingress（一个域名按路径转发到多个 Service）**。

### 4.6 部署流程

```bash
kubectl apply -f deploy/k8s/00-namespace.yaml
kubectl apply -f deploy/k8s/01-config-secret.yaml
kubectl apply -f deploy/k8s/02-storage.yaml
kubectl apply -f deploy/k8s/03-mongo.yaml
kubectl apply -f deploy/k8s/04-redis.yaml
kubectl apply -f deploy/k8s/05-backend.yaml
kubectl apply -f deploy/k8s/06-frontend.yaml
kubectl apply -f deploy/k8s/07-ingress.yaml

kubectl -n taotao-mall get pods -w
kubectl -n taotao-mall get hpa
```

---

## 五、GitHub Actions CI/CD 深度解析

### 5.1 做了什么

push 代码 → 自动构建镜像 → 推送 Docker Hub → 自动部署到 Compose 或 K8s，全程无人值守。

**文件：** [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### 5.2 流水线全貌

```
┌────────────────────────────────────────────────────────────┐
│ 触发条件：                                                   │
│   ① push 到 main     ② 打 v* tag     ③ 手动 workflow_dispatch│
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Job 1: build-and-push          │
        │   1. Checkout                   │
        │   2. QEMU + Buildx              │  ← 支持多架构
        │   3. 登录 Docker Hub             │
        │   4. 决定 Tag (v* / sha7 / dev)  │
        │   5. 构建后端镜像 (gha 缓存)     │
        │   6. 构建前端镜像 (gha 缓存)     │
        │   7. Push 到 Docker Hub          │
        └──────────────┬─────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
┌─────────────────────┐    ┌──────────────────────────┐
│ Job 2: deploy-      │    │ Job 3: deploy-k8s          │
│   compose           │    │   1. 写入 kubeconfig       │
│   1. SSH 到服务器    │    │   2. apply 8 个 yaml        │
│   2. git pull       │    │   3. kubectl set image 滚动 │
│   3. docker compose │    │   4. rollout status 等待   │
│      pull + up -d   │    │   5. get pods / hpa 检查   │
└─────────────────────┘    └──────────────────────────┘
```

### 5.3 关键技术点

| 技术 | 作用 |
|------|------|
| **多架构镜像** (linux/amd64 + linux/arm64) | 一次构建，云服务器 + Mac + 树莓派都能跑 |
| **QEMU 模拟** | GitHub Actions 跑在 AMD 机器上，靠 QEMU 模拟 arm64 |
| **Buildx + gha cache** | 把构建层缓存到 GitHub，二次构建只跑变更层，速度提升 30%~60% |
| **concurrency** | 同一分支只串行跑一次，避免重复部署冲突 |
| **手动选择部署目标** | workflow_dispatch + inputs 可选 compose / k8s + prod / staging |
| **滚动更新** | K8s 用 `kubectl set image` + `rollout status`，零停机发布 |
| **Secrets 管理** | `DOCKERHUB_TOKEN` / `KUBE_CONFIG` / `SSH_PRIVATE_KEY` 全部走 GitHub Secrets，不入库 |

### 5.4 镜像 Tag 规则

| 触发方式 | Tag | 用途 |
|---------|-----|------|
| 打 `v1.2.3` 标签 | `v1.2.3` | 正式版本 |
| push 到 main | `sha-XXXXXXX` | 每次提交可追溯 |
| 手动触发 | `dev-XXXXXXX` | 测试用 |
| 全部同时打 | `latest` | 默认拉取 |

### 5.5 GitHub Secrets / Variables

**Secrets（加密）：**
| Name | Value |
|------|-------|
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |
| `KUBE_CONFIG` | `base64 -w0 ~/.kube/config` 的输出 |
| `SSH_PRIVATE_KEY` | 服务器 `~/.ssh/id_rsa` |

**Variables（明文）：**
| Name | Value |
|------|-------|
| `DOCKERHUB_USERNAME` | `lgy12i` |
| `SSH_HOST` / `SSH_USER` / `SSH_PORT` / `APP_DIR` | Compose 部署用 |

---

## 六、AI Agent + RAG 知识库深度解析

### 6.1 做了什么

在传统电商项目中集成一个 **AI 智能客服助手「小宝」**，让用户能用自然语言查询商品、订单、活动、售后等问题。核心采用 **RAG（Retrieval-Augmented Generation，检索增强生成）** 架构：

```
用户提问 → 检索知识库 → 拼 system prompt → 调用 LLM → 返回增强回答
```

### 6.2 RAG 架构与数据流

```
┌─────────────────────────────────────────────────────────────────┐
│  前端 (AIAssistant.tsx)                                          │
│   ├─ 悬浮按钮 → 展开聊天窗                                         │
│   ├─ 快捷问题按钮（发货/周边/优惠券/退换货/秒杀）                    │
│   ├─ POST /api/v1/ai/chat { message, history }                  │
│   └─ 显示 RAG 命中的知识 ID（kb_xxx 标签）                          │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  后端 (ai.controller.js → chat)                                  │
│                                                                  │
│  ① 接收 message + history                                       │
│  ② buildContext(message)  ← 调用 RAG 知识库                      │
│       ├─ retrieve(question, topK=3)                              │
│       │   ├─ 对每条知识做关键词命中打分                            │
│       │   ├─ 长关键词权重更高（kw.length）                        │
│       │   └─ 取 score>0 的前 topK 条                              │
│       └─ 拼 systemPrompt（含知识库上下文 + 当前时间）              │
│  ③ 构造 messages = [system, ...history.slice(-4), user]          │
│  ④ 调用主模型 (Qwen / DeepSeek / 豆包，OpenAI 兼容协议)           │
│  ⑤ 主模型失败 → 自动降级到备用模型                                 │
│  ⑥ 返回 { reply, model, provider, ragHits }                     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  外部 LLM (OpenAI 兼容协议)                                       │
│   ├─ 主：Qwen DashScope  https://dashscope.aliyuncs.com/...     │
│   └─ 备：DeepSeek        https://api.deepseek.com/v1            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 RAG 知识库实现

**文件：** [backend/src/data/knowledge-base.js](./backend/src/data/knowledge-base.js)

#### 1) 知识条目结构
```javascript
const knowledge = [
  {
    id: 'kb_shipping',
    keywords: ['发货', '快递', '物流', '运费', '包邮', '几天到', '什么时候到', '配送'],
    content: '宝宝商城所有商品默认包邮，下单后 24 小时内发货，3-5 个工作日送达。'
  },
  // ... 共 11 条：shipping / return / payment / coupon / seckill / groupbuy / jjk / points / ai / order / account
];
```

#### 2) 关键词检索算法
```javascript
function retrieve(question, topK = 3) {
  const q = (question || '').toLowerCase();
  const scored = knowledge.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length; // 长关键词权重高
      }
    }
    return { ...entry, score };
  });
  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
```

**算法说明：**
- 用 `String.includes()` 做关键词命中
- 长关键词命中权重更高（`kw.length`），例如"咒术回战"命中比"券"得分高
- 取 `score > 0` 的前 `topK=3` 条

#### 3) 构造 RAG 增强的 system prompt
```javascript
function buildContext(question) {
  const hits = retrieve(question, 3);
  if (hits.length === 0) return null;

  const contextText = hits
    .map((h, i) => `[${i + 1}] ${h.content}`)
    .join('\n');

  return {
    hits,
    systemPrompt: `你是「宝宝商城」的 AI 智能客服助手「小宝」...
请依据下方知识库内容回答用户问题，要求：
1. 只回答与宝宝商城、商品、订单、活动相关的问题
2. 优先使用知识库中的信息，不要编造运费/活动规则
3. 简洁友好，可用 emoji 点缀
4. 如果用户问的是商品推荐，可以引导到对应页面
5. 不在知识库范围的问题，礼貌引导到人工客服

【知识库】
${contextText}

【当前时间】${new Date().toLocaleString('zh-CN')}`
  };
}
```

### 6.4 LLM 调用与主备模型降级

**文件：** [backend/src/controllers/ai.controller.js](./backend/src/controllers/ai.controller.js)

#### 1) 使用 OpenAI 兼容协议
```javascript
async function callLLM({ baseUrl, apiKey, model, messages, temperature = 0.7, maxTokens = 800 }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens })
  });
  // ...
  return data?.choices?.[0]?.message?.content || '';
}
```

**优势：** 同一份代码可对接 Qwen DashScope / DeepSeek / 豆包 / OpenAI 等任何兼容协议的服务，只需改 `baseUrl` 和 `apiKey`。

#### 2) 主备模型降级策略
```javascript
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const AI_MODEL    = process.env.AI_MODEL || 'qwen-max';
const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'deepseek-chat';
const AI_FALLBACK_BASE  = process.env.AI_FALLBACK_BASE || 'https://api.deepseek.com/v1';

// 主模型失败 → 自动降级
try {
  reply = await callLLM({ baseUrl: AI_BASE_URL, apiKey: AI_API_KEY, model: AI_MODEL, messages });
} catch (err) {
  console.warn('[AI] 主模型调用失败，降级到备用模型:', err.message);
  if (AI_FALLBACK_KEY) {
    reply = await callLLM({ baseUrl: AI_FALLBACK_BASE, apiKey: AI_FALLBACK_KEY, model: AI_FALLBACK_MODEL, messages });
    usedModel = AI_FALLBACK_MODEL;
    usedProvider = 'fallback';
  } else {
    throw err;
  }
}
```

#### 3) 完全无 AI Key 时的兜底
```javascript
if (!ENABLE_AI) {
  const fallback = ctx?.hits?.[0]?.content ||
    '您好，我是宝宝商城 AI 助手小宝 🤖。您可以问我发货、退换货、优惠券、秒杀、咒术回战周边等问题～';
  return res.json({
    success: true,
    data: { reply: `[知识库模式] ${fallback}`, model: 'knowledge-base-fallback', ragHits: ctx?.hits?.map((h) => h.id) || [] }
  });
}
```
**作用：** 即使没配 API Key，知识库命中也能给出准确回答，保证 AI 功能可用性。

### 6.5 前端 AI 助手实现

**文件：** [frontend/src/components/AIAssistant.tsx](./frontend/src/components/AIAssistant.tsx)

#### 1) 核心交互
- 右下角霓虹悬浮按钮（`animate-float` 浮动动画）
- 点击展开玻璃拟态聊天窗（`glass` + `shadow-glass`）
- 快捷问题按钮（5 个高频问题）
- 自动滚动到底部（`scrollIntoView({ behavior: 'smooth' })`）
- 保留最近 4 轮历史发给后端（`messages.slice(-4)`）

#### 2) RAG 命中可视化（亮点）
```tsx
{m.ragHits && m.ragHits.length > 0 && (
  <div className="mt-1 flex flex-wrap gap-1">
    <span className="text-[9px] text-white/40">📚 RAG 命中:</span>
    {m.ragHits.map((h) => (
      <span key={h} className="text-[9px] px-1.5 py-0.5 rounded bg-neon-500/15 text-neon-300 border border-neon-500/30">
        {h}
      </span>
    ))}
  </div>
)}
```
**作用：** 让用户看到 AI 回答时引用了哪些知识条目，增强可解释性与可信度。

#### 3) API Key 安全设计
- 前端**不持有**任何 LLM API Key
- 只调用后端 `/api/v1/ai/chat`
- 后端代理调用 LLM，Key 只在 `.env` 中
- 防止 Key 泄露到浏览器被滥用

### 6.6 接口限流防滥用

**文件：** [backend/src/routes/ai.routes.js](./backend/src/routes/ai.routes.js)

```javascript
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 分钟
  max: 30,               // 每分钟 30 次
  message: { success: false, message: 'AI 接口请求过于频繁，请稍后再试' }
});
router.use(aiLimiter);
```
**原因：** AI 接口调用 LLM 费 token，必须独立限流，防止恶意用户刷接口产生高额账单。

### 6.7 RAG 设计权衡说明

| 设计选择 | 原因 | 可演进方向 |
|---------|------|----------|
| 关键词检索（非向量） | 单机项目数据量小（11 条），关键词足够，避免引入向量数据库依赖 | 数据量大后换 embeddings + pgvector / Milvus |
| 知识库写死在 JS 文件 | 项目演示阶段，知识量可控，便于版本管理 | 改为数据库存储 + 后台 CRUD 管理界面 |
| 主备模型降级 | 单一 LLM 服务可能不稳定，备用模型保证可用性 | 加入更多 provider，按延迟/成本路由 |
| 后端代理 LLM | API Key 不暴露到前端 | 可加缓存层（相同问题直接返回缓存答案） |
| topK = 3 | 平衡上下文长度与准确性 | 可动态调整：长问题取更多，短问题取更少 |

---

## 七、技术闭环与架构总结

### 7.1 从代码到上线的完整闭环

```
┌──────────────────────────────────────────────────────────────────┐
│  ① 业务代码（React + Express + Mongo）                            │
│      ├─ 电商业务（商品/购物车/订单）                                │
│      └─ AI 业务（RAG 检索 + LLM 调用）                             │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ② 容器化（Dockerfile 多阶段构建）                                 │
│      ├─ 前端：Vite build → Nginx 静态托管                          │
│      └─ 后端：node:20-alpine + 非 root + HEALTHCHECK               │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ③ 单机编排（Docker Compose）                                      │
│      └─ 4 服务 + 网络隔离 + 数据持久化 + 启动顺序                   │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ④ 集群编排（Kubernetes）                                          │
│      ├─ StatefulSet（Mongo）+ Deployment（Redis/前端/后端）          │
│      ├─ HPA 自动扩缩（CPU 60% / Memory 75%）                       │
│      ├─ 三类探针 + 优雅停机（零停机）                               │
│      └─ Ingress（域名 + TLS + 限频）                               │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ⑤ CI/CD 自动化（GitHub Actions）                                  │
│      └─ push → 构建多架构镜像 → 推送 Docker Hub → 自动部署          │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 关键技术点速查表

| 阶段 | 关键技术 | 解决的问题 |
|------|---------|-----------|
| 容器化 | 多阶段构建 | 镜像体积减小 80%+ |
| 容器化 | alpine + 非 root | 安全 + 小体积 |
| 容器化 | HEALTHCHECK | 容器真实健康状态可探知 |
| Compose | depends_on healthcheck | 启动顺序依赖问题 |
| Compose | 网络隔离 | 数据库不对外暴露 |
| Compose | Named Volumes | 数据持久化 |
| K8s | StatefulSet (Mongo) | 稳定 DNS + PVC 绑定 |
| K8s | initContainer | 等待依赖服务就绪 |
| K8s | readiness / liveness | 流量只发到健康 Pod |
| K8s | HPA | 流量高峰自动扩容 |
| K8s | preStop + gracePeriod | 优雅停机不丢请求 |
| K8s | RollingUpdate maxUnavailable=0 | 零停机发布 |
| K8s | Ingress | 7 层路由 + TLS + 限频 |
| CI/CD | Buildx + QEMU | 多架构镜像 |
| CI/CD | gha cache | 构建加速 30%~60% |
| CI/CD | GitHub Secrets | 密钥不入库 |
| AI | OpenAI 兼容协议 | 一套代码对接多模型 |
| AI | 主备模型降级 | 单点故障兜底 |
| AI | 无 Key 知识库兜底 | 保证基本可用 |
| AI | 后端代理 LLM | API Key 不泄露 |
| AI | 接口独立限流 | 防 token 滥用 |
| RAG | 关键词检索 + 长词加权 | 轻量检索，无向量库依赖 |
| RAG | 命中可视化 | 增强可解释性 |

### 7.3 回滚方案

| 部署方式 | 回滚命令 |
|---------|---------|
| Docker Compose | 改 image tag 回 `:prev` → `docker compose up -d` |
| Kubernetes | `kubectl rollout undo deployment/taotao-backend -n taotao-mall` |
| GitHub Actions | 重新触发旧 commit 的 workflow |

---

## 八、复现与验证流程

### 8.1 本地验证（无需服务器）

```bash
# 1. 本地装 Docker Desktop（启用 K8s 选项可选）

# 2. 跑 Compose 版本
cd D:\taotao-mall
cp deploy\.env.example .env
docker compose -f deploy/docker-compose.yml up -d --build
docker exec taotao-backend node src/scripts/seed.js
# 访问 http://localhost:8080

# 3. 想试 K8s：Docker Desktop → Settings → Kubernetes → Enable
kubectl apply -f deploy/k8s/
kubectl -n taotao-mall get pods -w
```

### 8.2 生产上线（两条路径）

**路径 A：个人服务器（Docker Compose）**
```
本地改代码 → git push → GitHub Actions 构建镜像 → 推送 Docker Hub
                                                          ↓
                  服务器 SSH → docker compose pull → up -d → 浏览器访问
```
**适用：** 1 台 2C4G 云服务器，简单可靠。

**路径 B：K8s 集群（生产级）**
```
本地改代码 → git push → GitHub Actions 构建镜像 → 推送 Docker Hub
                                                          ↓
                  K8s：kubectl set image → 滚动更新 → rollout status → 完成
```
**适用：** MiniKube / K3s / 阿里云 ACK / 腾讯 TKE。

### 8.3 AI 功能验证

```bash
# 1. 配置 .env（可选，不配也能跑知识库模式）
AI_API_KEY=sk-xxx
AI_MODEL=qwen-max
AI_FALLBACK_KEY=sk-yyy
AI_FALLBACK_MODEL=deepseek-chat

# 2. 启动后端
cd backend && npm run dev

# 3. 测试接口
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"咒术回战有哪些周边？","history":[]}'

# 4. 看状态
curl http://localhost:3000/api/v1/ai/status
```

---

## 附：相关文档

- [deploy/DEPLOY_FLOW.md](./deploy/DEPLOY_FLOW.md) — 部署流程图与命令速查
- [deploy/k8s/README.md](./deploy/k8s/README.md) — K8s 清单文件总览
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) — 项目整体总结

---

**文档版本：** 2026-08
**项目仓库：** https://github.com/lgy12i/baobao
