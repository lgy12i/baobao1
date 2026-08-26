# =============================================================
# 宝宝商城 · Kubernetes 部署清单（命名空间：taotao-mall）
# 文件拆分：
#   00-namespace.yaml      —— 命名空间
#   01-config-secret.yaml   —— ConfigMap + Secret（环境变量/密码）
#   02-storage.yaml         —— MongoDB / Redis / 上传文件的 PVC
#   03-mongo.yaml           —— MongoDB StatefulSet + Service
#   04-redis.yaml           —— Redis Deployment + Service
#   05-backend.yaml         —— 后端 Deployment + Service + HPA
#   06-frontend.yaml        —— 前端 Deployment + Service + HPA
#   07-ingress.yaml         —— Ingress（域名 + HTTPS）
# =============================================================
