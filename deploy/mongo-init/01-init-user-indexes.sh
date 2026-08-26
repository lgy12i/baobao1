# MongoDB 首次启动初始化脚本
# 当 /data/db 为空（首次）时，entrypoint 会执行此目录所有 .sh / .js 文件
# 作用：
#   1) 创建业务库用户 taotao_user（避免业务端一直用 root，降低风险）
#   2) 可选的初始化索引加速
# 面试讲解：
#   - 最小权限原则：业务账号仅对 taotao_mall 数据库有读写权限，泄漏不影响其他库
#   - 脚本路径挂到 /docker-entrypoint-initdb.d 是 mongo 官方镜像约定

MONGO_DB_NAME=${MONGO_INITDB_DATABASE:-taotao_mall}
APP_USER=${APP_USER:-taotao}
APP_PASS=${APP_PASS:-taotao_db_pwd_2026}

echo "[mongo-init] 创建业务库用户：$APP_USER @ $MONGO_DB_NAME"

mongosh --quiet <<EOF
  // 切到业务库
  db = db.getSiblingDB("$MONGO_DB_NAME");

  // 创建业务账号（仅针对业务库 readWrite 权限）
  db.createUser({
    user: "$APP_USER",
    pwd:  "$APP_PASS",
    roles: [
      { role: "readWrite", db: "$MONGO_DB_NAME" }
    ]
  });

  // 创建常用查询索引（即便 Mongoose 里有 autoIndex，初始化时建也不冲突）
  db.product.createIndexes([
    { key: { name: "text" }, background: true },
    { key: { status: 1, salesCount: -1 }, background: true },
    { key: { categoryId: 1, status: 1 }, background: true },
    { key: { createdAt: -1 }, background: true }
  ]);

  db.user.createIndexes([
    { key: { username: 1 }, unique: true, background: true },
    { key: { email: 1 }, unique: true, background: true }
  ]);

  db.order.createIndexes([
    { key: { userId: 1, createdAt: -1 }, background: true },
    { key: { status: 1, expireAt: 1 }, background: true }
  ]);

  db.category.createIndex({ level: 1, sort: 1 }, { background: true });

  print("[mongo-init] ✅ 业务库用户与索引初始化完成");
EOF
