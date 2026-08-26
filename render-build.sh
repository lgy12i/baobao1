#!/bin/bash
# =============================================================
# Render 构建脚本
# 在 Render 的 Linux 构建环境中执行：
#   1. 安装并构建前端（Vite 产物 → frontend/dist）
#   2. 安装后端依赖
#   3. 后端启动时通过 express.static 托管 frontend/dist
# =============================================================
set -e

echo "═══════════════════════════════════════════"
echo "  📦 Render 构建开始"
echo "═══════════════════════════════════════════"

# Node 版本检查
echo "✓ Node 版本: $(node -v)"
echo "✓ npm 版本: $(npm -v)"

# ========== 1. 构建前端 ==========
echo ""
echo "▶ 步骤 1/2: 构建前端 (Vite)"
cd frontend
npm install --no-audit --no-fund
npm run build
echo "✓ 前端构建完成，产物："
ls -la dist/ | head -5
cd ..

# ========== 2. 安装后端依赖 ==========
echo ""
echo "▶ 步骤 2/2: 安装后端依赖"
cd backend
npm install --no-audit --no-fund --omit=optional
echo "✓ 后端依赖安装完成"
cd ..

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ 构建完成"
echo "  启动命令: node backend/src/app.js"
echo "  前端托管: backend/../frontend/dist (同源)"
echo "═══════════════════════════════════════════"
