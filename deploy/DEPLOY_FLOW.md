# 宝宝商城 · 容器化与部署流程总结

> 项目仓库：https://github.com/lgy12i/baobao
> 文档目标：用一张流程图 + 分阶段步骤，说清楚"个人全栈电商项目如何与 Docker / Kubernetes / GitHub Actions 结合，从代码到上线"。

---

## 一、整体流程一图看清

```
┌──────────────────────────────────────────────────────────────────────┐
│  开发者本地 (Windows)                                                 │
│    D:\taotao-mall  →  git push origin main                           │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ①  GitHub Actions (deploy.yml)   ← 自动触发                          │
│      ├─ QEMU + Buildx：构建多架构镜像 (amd64 + arm64)                 │
│      ├─ Docker Build：使用分层缓存（gha cache）                       │
│      └─ Docker Push：lgy12i/baobao-{backend,frontend}:<tag>           │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ 拉取镜像
        ┌──────────────────┴───────────────────┐
        ▼                                      ▼
┌─────────────────────────┐       ┌──────────────────────────────────┐
│  ②  Docker Compose 单机   │       │  ③  Kubernetes 集群               │
│      (1 台云服务器)       │       │      (MiniKube / ACK / TKE)      │
│                          │       │                                   │
│   frontend (nginx:8080)  │       │   Ingress → frontend Svc         │
│        ↓ /api 反代        │       │              ↓                    │
│   backend (node:3000)     │       │   backend Svc (HPA 2~10)          │
│        ↓                 │       │              ↓                    │
│   mongo + redis          │       │   mongo(StatefulSet) + redis     │
│        ↓                 │       │                                   │
│   Named Volumes 持久化    │       │   PVC 持久化 + ConfigMap/Secret   │
└─────────────────────────┘       └──────────────────────────────────┘
```

---

## 二、阶段一：Docker 容器化（本地编写 Dockerfile）

### 🎯 做了什么
为前端和后端各写了一个**多阶段构建 Dockerfile**，把"代码 + 依赖"打包成可在任何机器上运行的镜像。

### 📁 涉及文件
| 文件 | 作用 |
|------|------|
| [deploy/Dockerfile.backend](./Dockerfile.backend) | 后端镜像构建脚本 |
| [deploy/Dockerfile.frontend](./Dockerfile.frontend) | 前端镜像构建脚本 |
| [deploy/nginx.conf](./nginx.conf) | 前端 Nginx 配置 |

### 🔧 后端 Dockerfile 关键步骤

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
  └─ CMD ["node", "src/app.js"]          ← 直接用 node 启动（避免 PID 1 信号问题）
```

**为什么这么做：**
| 设计 | 原因 |
|------|------|
| 多阶段构建 | 构建工具链不进运行镜像，体积从 ~1GB 降到 ~350MB |
| 先 COPY package*.json | 依赖不变时直接命中缓存，构建从分钟级降到秒级 |
| alpine 基础镜像 | 体积小、攻击面小 |
| 非 root 用户运行 | 即使容器被攻破，也不会直接拿到宿主机 root |
| HEALTHCHECK | 让 Compose / K8s 知道容器是否真健康，而不只是"进程在跑" |
| `node` 而非 `npm start` | npm 不转发 SIGTERM，会导致优雅停机失效 |

### 🔧 前端 Dockerfile 关键步骤

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

### 🔧 nginx.conf 关键配置

| 配置 | 作用 |
|------|------|
| `try_files $uri /index.html` | SPA 路由兜底，刷新页面不 404 |
| `location /api` 反代 backend:3000 | 解决前端跨域 |
| `location /uploads` 反代 backend | 图片走后端，统一入口 |
| `/assets/*` 一年 immutable 缓存 | 带文件 hash，可永久强缓存 |
| `index.html` no-cache | 保证用户拿到最新 HTML |
| Gzip on | 压缩 JS/CSS，减少 70% 传输 |

---

## 三、阶段二：Docker Compose 单机编排

### 🎯 做了什么
一条命令拉起 4 个服务（前端 + 后端 + Mongo + Redis），并保证启动顺序、网络隔离、数据持久化。

### 📁 涉及文件
| 文件 | 作用 |
|------|------|
| [deploy/docker-compose.yml](./docker-compose.yml) | 服务编排定义 |
| [deploy/.env.example](./.env.example) | 环境变量模板 |
| [deploy/mongo-init/01-init-user-indexes.sh](./mongo-init/01-init-user-indexes.sh) | Mongo 首次启动初始化脚本 |

### 🔧 关键设计

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
> **作用：** 避免"后端启动比 Mongo 快，连接失败 crash"的经典坑。

#### 2) 网络拆分
```yaml
networks:
  front-tier: { driver: bridge }    # frontend + backend 在这里
  back-tier:   { driver: bridge }   # backend + mongo + redis 在这里
```
> **作用：** Mongo/Redis 默认不对外暴露，只有 backend 能访问；frontend 不能直连数据库。

#### 3) 数据持久化（Named Volumes）
```yaml
volumes:
  taotao-mongo-data:    # MongoDB 数据
  taotao-redis-data:    # Redis AOF
  taotao-uploads:       # 用户上传的图片
```
> **作用：** `docker compose down` 容器销毁，数据保留；只有 `down -v` 才会删数据。

#### 4) 敏感信息外置
```yaml
environment:
  MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASS}   # 从 .env 读取
  JWT_SECRET: ${JWT_SECRET}
```
> **作用：** 密码不进 Git（.env 已在 .gitignore），符合 12-Factor App。

### 🚀 启动流程
```bash
# 1. 复制环境变量
cp deploy/.env.example .env
vim .env   # 改 MONGO_ROOT_PASS / REDIS_PASSWORD / JWT_SECRET

# 2. 一键构建 + 启动
docker compose -f deploy/docker-compose.yml up -d --build

# 3. 首次初始化种子数据
docker exec taotao-backend node src/scripts/seed.js

# 4. 访问
# 浏览器 → http://服务器IP:8080
# 测试账号 → testuser / Test123456
```

---

## 四、阶段三：Kubernetes 集群部署

### 🎯 做了什么
为生产环境写了 8 个 YAML 清单，覆盖命名空间、配置、存储、数据库、应用、入口、自动扩缩容。

### 📁 涉及文件（按 apply 顺序）

| # | 文件 | 资源类型 | 作用 |
|---|------|---------|------|
| 00 | [00-namespace.yaml](./k8s/00-namespace.yaml) | Namespace + ResourceQuota + LimitRange | 隔离环境，限制资源配额 |
| 01 | [01-config-secret.yaml](./k8s/01-config-secret.yaml) | ConfigMap + Secret | 非敏感配置 + 密钥分离 |
| 02 | [02-storage.yaml](./k8s/02-storage.yaml) | 3 × PVC | Mongo/Redis/上传文件持久化 |
| 03 | [03-mongo.yaml](./k8s/03-mongo.yaml) | **StatefulSet** + Service | MongoDB（有状态服务） |
| 04 | [04-redis.yaml](./k8s/04-redis.yaml) | Deployment + Service | Redis 缓存 |
| 05 | [05-backend.yaml](./k8s/05-backend.yaml) | Deployment + HPA + Service | 后端（含探针、HPA、优雅停机） |
| 06 | [06-frontend.yaml](./k8s/06-frontend.yaml) | Deployment + HPA + Service | 前端 Nginx |
| 07 | [07-ingress.yaml](./k8s/07-ingress.yaml) | Ingress | 7 层域名路由 + TLS + 限频 |

### 🔧 后端 Deployment 关键设计（[05-backend.yaml](./k8s/05-backend.yaml)）

#### 1) 副本与滚动更新
```yaml
replicas: 2
strategy:
  type: RollingUpdate
  rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }   # 零停机
```
> **作用：** 新 Pod 起来后才摘旧 Pod，整个过程不停流量。

#### 2) initContainer 等待依赖
```yaml
initContainers:
  - name: wait-mongo-redis
    image: busybox:1.36
    command: ['sh', '-c', 'until nc -z taotao-mongo...; do sleep 3; done']
```
> **作用：** 后端容器只在 Mongo + Redis 都通后才启动，避免启动期 crash。

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
> **作用：** Pod 被删时先从 Endpoints 摘除 → sleep 15s 让 Ingress 刷新 → 再接 SIGTERM，避免"正在转发的请求"失败。

#### 6) 资源限制
```yaml
resources:
  requests: { cpu: 200m, memory: 256Mi }   # 调度依据
  limits:   { cpu: "2",  memory: 2Gi }       # 上限，防止单 Pod 抢资源
```

### 🔧 Mongo 为什么用 StatefulSet

| 维度 | Deployment | StatefulSet |
|------|-----------|-------------|
| Pod 名 | 随机 hash | `mongo-0`、`mongo-1`（稳定） |
| DNS | `mongo-xxx` 不稳定 | `mongo-0.mongo.taotao-mall` 稳定 |
| PVC 绑定 | Pod 换了 PVC 跟着换 | 永远绑定同一个 PVC |
| 适用 | 无状态 API | 数据库（需要稳定身份） |

### 🔧 Ingress 的作用

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

> **对比：** Service（ClusterIP 集群内）/ NodePort（节点开端口）/ LoadBalancer（云商 LB）/ **Ingress（一个域名按路径转发到多个 Service）**。

### 🚀 部署流程

```bash
# 1) 本地或 CI 执行（前提：kubectl 已配好 kubeconfig）
kubectl apply -f deploy/k8s/00-namespace.yaml
kubectl apply -f deploy/k8s/01-config-secret.yaml
kubectl apply -f deploy/k8s/02-storage.yaml
kubectl apply -f deploy/k8s/03-mongo.yaml
kubectl apply -f deploy/k8s/04-redis.yaml
kubectl apply -f deploy/k8s/05-backend.yaml
kubectl apply -f deploy/k8s/06-frontend.yaml
kubectl apply -f deploy/k8s/07-ingress.yaml

# 2) 看状态
kubectl -n taotao-mall get pods -w
kubectl -n taotao-mall get hpa
kubectl -n taotao-mall get ingress

# 3) 首次种子数据
BPOD=$(kubectl -n taotao-mall get pods -l app=taotao-backend -o jsonpath='{.items[0].metadata.name}')
kubectl -n taotao-mall exec -it $BPOD -- node src/scripts/seed.js
```

---

## 五、阶段四：GitHub Actions CI/CD 自动化

### 🎯 做了什么
push 代码 → 自动构建镜像 → 推送 Docker Hub → 自动部署到 Compose 或 K8s，全程无人值守。

### 📁 涉及文件
| 文件 | 作用 |
|------|------|
| [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) | CI/CD 流水线定义 |

### 🔧 流水线全貌

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
        │                              │
        └── 手动选 compose 时触发        └── push main 或 手动选 k8s 时触发
```

### 🔧 关键技术点

| 技术 | 作用 |
|------|------|
| **多架构镜像** (linux/amd64 + linux/arm64) | 一次构建，云服务器 + Mac + 树莓派都能跑 |
| **QEMU 模拟** | GitHub Actions 跑在 AMD 机器上，靠 QEMU 模拟 arm64 |
| **Buildx + gha cache** | 把构建层缓存到 GitHub，二次构建只跑变更层，速度提升 30%~60% |
| **concurrency** | 同一分支只串行跑一次，避免重复部署冲突 |
| **手动选择部署目标** | workflow_dispatch + inputs 可选 compose / k8s + prod / staging |
| **滚动更新** | K8s 用 `kubectl set image` + `rollout status`，零停机发布 |
| **Secrets 管理** | `DOCKERHUB_TOKEN` / `KUBE_CONFIG` / `SSH_PRIVATE_KEY` 全部走 GitHub Secrets，不入库 |

### 🔧 镜像 Tag 规则

| 触发方式 | Tag | 用途 |
|---------|-----|------|
| 打 `v1.2.3` 标签 | `v1.2.3` | 正式版本 |
| push 到 main | `sha-XXXXXXX` | 每次提交可追溯 |
| 手动触发 | `dev-XXXXXXX` | 测试用 |
| 全部同时打 | `latest` | 默认拉取 |

### 🔐 GitHub 上需要配置的 Secrets / Variables

打开 `https://github.com/lgy12i/baobao/settings/secrets/actions`：

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

## 六、完整上线流程（从代码到生产）

### 路径 A：个人服务器（Docker Compose）
```
本地改代码 → git push → GitHub Actions 构建镜像 → 推送 Docker Hub
                                                          ↓
                  服务器 SSH → docker compose pull → up -d → 浏览器访问
```
**适用：** 1 台 2C4G 云服务器，简单可靠。

### 路径 B：K8s 集群（生产级）
```
本地改代码 → git push → GitHub Actions 构建镜像 → 推送 Docker Hub
                                                          ↓
                  K8s：kubectl set image → 滚动更新 → rollout status → 完成
```
**适用：** MiniKube / K3s / 阿里云 ACK / 腾讯 TKE。

---

## 七、关键技术点速查表

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
| CI/CD | kubectl set image + rollout | 滚动更新可回滚 |

---

## 八、回滚方案

| 部署方式 | 回滚命令 |
|---------|---------|
| Docker Compose | 改 image tag 回 `:prev` → `docker compose up -d` |
| Kubernetes | `kubectl rollout undo deployment/taotao-backend -n taotao-mall` |
| GitHub Actions | 重新触发旧 commit 的 workflow |

---

## 九、本地验证（无需服务器也能跑通）

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

---

本流程覆盖：**业务代码 → 容器化 → 单机编排 → 集群编排 → CI/CD 自动化 → 上线 → 回滚**，是一个完整的工程闭环。
