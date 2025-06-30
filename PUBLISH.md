# MUP SDK 发布指南

本文档说明如何将修复后的代码发布到 npm。

## 发布方式

### 1. 交互式发布（推荐）

使用完整的发布脚本，包含所有检查和确认步骤：

```bash
npm run publish
# 或直接运行
./scripts/publish.sh
```

该脚本会：
- 检查 git 状态和分支
- 让你选择版本类型（patch/minor/major/prerelease）
- 运行完整的测试和构建流程
- 交互式确认发布

### 2. 快速发布

用于紧急修复的快速发布：

```bash
npm run publish:quick
# 或直接运行
./scripts/publish-quick.sh
```

该脚本会：
- 自动发布 patch 版本
- 跳过交互式确认
- 只运行基本的 TypeScript 检查

### 3. 命令行发布

直接使用 npm 脚本：

```bash
# 发布 patch 版本（修复）
npm run publish:patch

# 发布 minor 版本（新功能）
npm run publish:minor

# 发布 major 版本（破坏性更改）
npm run publish:major
```

## 发布前检查清单

- [ ] 所有 TypeScript 错误已修复
- [ ] 代码已提交到 git
- [ ] 在正确的分支（main/master）
- [ ] 更新了相关文档
- [ ] 运行了测试

## 版本类型说明

- **patch (0.0.x)**: 修复 bug，向后兼容
- **minor (0.x.0)**: 新功能，向后兼容
- **major (x.0.0)**: 破坏性更改，不向后兼容
- **prerelease**: 预发布版本（如 0.3.1-beta.0）

## 发布后验证

1. 检查 npm 上的包：https://www.npmjs.com/org/muprotocol
2. 验证包可以正常安装：
   ```bash
   npm install @muprotocol/client@latest
   ```
3. 检查包的内容和版本号

## 故障排除

### 发布失败

如果发布过程中出现错误：

1. 检查网络连接
2. 确认 npm 登录状态：`npm whoami`
3. 检查包名是否已存在
4. 查看详细错误信息

### 回滚发布

如果需要撤销发布：

```bash
# 撤销最近24小时内的发布
npm unpublish @muprotocol/package-name@version

# 或使用 deprecate 标记为废弃
npm deprecate @muprotocol/package-name@version "This version has issues"
```

## 自动化发布

对于 CI/CD 环境，可以设置自动发布：

```bash
# 设置 npm token
export NPM_TOKEN=your_npm_token

# 自动发布
npm run publish:patch
```

## 注意事项

1. 发布是不可逆的操作，请谨慎操作
2. 确保在发布前充分测试
3. 遵循语义化版本规范
4. 及时更新 CHANGELOG.md
5. 通知团队成员新版本发布