#!/bin/bash

# MUP SDK 发布脚本
# 用于构建、测试和发布所有包到 npm

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否在项目根目录
if [ ! -f "lerna.json" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    log_warning "检测到未提交的更改，请先提交或暂存更改"
    git status --short
    read -p "是否继续发布？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "发布已取消"
        exit 1
    fi
fi

# 检查当前分支
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    log_warning "当前不在主分支 ($current_branch)，建议在主分支发布"
    read -p "是否继续发布？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "发布已取消"
        exit 1
    fi
fi

# 获取发布类型
echo "请选择发布类型:"
echo "1) patch (0.0.x) - 修复bug"
echo "2) minor (0.x.0) - 新功能"
echo "3) major (x.0.0) - 破坏性更改"
echo "4) prerelease - 预发布版本"
read -p "请输入选择 (1-4): " choice

case $choice in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        VERSION_TYPE="prerelease"
        ;;
    *)
        log_error "无效选择"
        exit 1
        ;;
esac

log_info "开始发布流程 - 版本类型: $VERSION_TYPE"

# 1. 清理构建目录
log_info "清理构建目录..."
npm run clean

# 2. 安装依赖
log_info "安装依赖..."
npm install
npx lerna bootstrap

# 3. 运行 linting
log_info "运行代码检查..."
npm run lint

# 4. 运行测试
log_info "运行测试..."
npm run test

# 5. 构建所有包
log_info "构建所有包..."
npm run build

# 6. 检查构建结果
log_info "检查构建结果..."
for package in packages/*/; do
    if [ -d "$package/dist" ]; then
        log_success "✓ $(basename $package) 构建成功"
    else
        log_error "✗ $(basename $package) 构建失败"
        exit 1
    fi
done

# 7. 版本更新
log_info "更新版本..."
if [ "$VERSION_TYPE" = "prerelease" ]; then
    npx lerna version prerelease --preid=beta --yes
else
    npx lerna version $VERSION_TYPE --yes
fi

# 8. 发布到 npm
log_info "发布到 npm..."
npx lerna publish from-git --yes

# 9. 推送到远程仓库
log_info "推送到远程仓库..."
git push origin $current_branch --tags

log_success "🎉 发布完成！"
log_info "所有包已成功发布到 npm"

# 显示发布的包信息
echo
log_info "已发布的包:"
npx lerna list --json | jq -r '.[] | "  \(.name)@\(.version)"'

echo
log_info "发布后检查:"
echo "  1. 检查 npm 上的包: https://www.npmjs.com/org/muprotocol"
echo "  2. 更新文档和 CHANGELOG"
echo "  3. 通知团队成员"