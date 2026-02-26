# VibeFrame 文档目录

本目录包含 VibeFrame 项目的完整技术文档。

## 文档结构

```
docs/
├── README.md                           # 本文档
├── ARCHITECTURE.md                     # 架构设计文档
├── API.md                              # API 接口文档
├── SECURITY.md                         # 安全策略文档
├── sharing-report.md                   # Claude Code 实战经验分享
├── screenshots/                        # 截图目录
│   └── *.png
└── plans/                              # 设计与实施计划
    ├── 2026-02-14-vibeframe-design.md  # 原始设计文档
    └── 2026-02-25-vibeframe-implementation.md  # 实施计划
```

## 文档说明

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 技术栈、项目结构、LLM Provider 架构、核心数据流、iframe 通信协议、会话管理 |
| [API.md](./API.md) | API 端点定义、请求/响应格式、类型定义、错误处理 |
| [SECURITY.md](./SECURITY.md) | 三层防御架构、HTML 清洗规则、iframe 沙箱配置、白名单 CDN、安全测试覆盖 |
| [sharing-report.md](./sharing-report.md) | 七大领域的 Agentic Coding 实践案例、SKILL 使用经验、人机结对编程模式 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test:run

# 代码检查
pnpm lint

# 生产构建
pnpm build
```

## 相关链接

- **项目仓库：** https://github.com/geoffrey-zsg/vide-frame
- **在线演示：** https://vibe-frame.vercel.app