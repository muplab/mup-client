#!/bin/bash

# MUP SDK 快速发布脚本
# 用于快速发布修复版本到 npm

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查是否在项目根目录
if [ ! -f "lerna.json" ]; then
    echo "请在项目根目录运行此脚本"
    exit 1
fi

log_info "开始快速发布流程..."

# 1. 清理和构建
log_info "清理构建目录..."
npm run clean

log_info "构建所有包..."
npm run build

# 2. 运行基本检查
log_info "运行 TypeScript 检查..."
npx tsc --noEmit

# 3. 发布 patch 版本
log_info "发布 patch 版本..."
npx lerna version patch --yes
npx lerna publish from-git --yes

# 4. 推送到远程
log_info "推送到远程仓库..."
git push origin $(git branch --show-current) --tags

log_success "🎉 快速发布完成！"

# 显示发布信息
echo
log_info "已发布的包:"
npx lerna list --json 2>/dev/null | jq -r '.[] | "  \(.name)@\(.version)"' 2>/dev/null || npx lerna list

echo
log_info "检查发布结果: https://www.npmjs.com/org/muprotocol"