# UnitTTS 测试套件

## 环境配置

1. 复制 `.env.local.example` 到 `.env.local`
2. 填入你的API密钥

```bash
cp .env.local.example .env.local
```

## 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单次测试
pnpm test:run

# 监听模式
pnpm test:watch
```

## 测试结构

```
tests/
├── setup.ts              # 测试环境配置
├── utils/
│   └── testHelpers.ts     # 测试工具函数
├── ttsRelay.test.ts       # 核心TTS中继测试
├── adapters/
│   ├── minimax.test.ts    # Minimax适配器测试
│   └── tencent.test.ts    # 腾讯云适配器测试
├── clients/
│   ├── minimax.test.ts    # Minimax客户端测试
│   └── tencent.test.ts    # 腾讯云客户端测试
├── middleware/
│   └── logging.test.ts    # 日志中间件测试
├── types/
│   └── types.test.ts      # 类型定义测试
└── integration/
    └── full-workflow.test.ts  # 完整工作流集成测试
```

## 测试说明

- 需要有效的API密钥才能运行集成测试
- 没有API密钥时，相关测试会被跳过
