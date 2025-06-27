# UNITTS 使用示例

本目录包含了 UNITTS 库的各种使用示例，展示了如何使用统一的 TTS API 接口。

## 示例文件

### 1. `basic-usage.ts` - 基本用法

展示如何：

- 创建 TTSRelay 实例
- 注册 Provider 适配器
- 添加中间件
- 进行基本的文本转语音合成

### 2. `streaming-usage.ts` - 流式合成

展示如何：

- 使用流式 TTS 合成
- 实时接收音频片段
- 处理流式响应

### 3. `incremental-usage.ts` - 增量合成

展示如何：

- 使用文本流进行增量合成
- 处理分批文本输入
- 获取增量音频输出

### 4. `multi-provider-usage.ts` - 多提供商支持

展示如何：

- 注册多个 TTS 提供商
- 在不同提供商之间切换
- 统一的 API 接口使用

### 5. `provider-specific-params.ts` - Provider特定参数 🆕

展示如何：

- 使用 `extra` 字段传入 provider 特定参数
- 利用 provider 独有功能（如 Minimax 的音色权重）
- 参数覆盖和合并机制
- 构建辅助函数来简化特定参数使用

## 运行示例

在运行示例之前，请确保：

1. 安装依赖：

```bash
pnpm install
```

2. 构建项目：

```bash
pnpm build
```

3. 配置 API 密钥：
   将示例中的 `'your-api-key'` 和 `'your-group-id'` 替换为你的实际 API 凭据。

4. 运行示例：

```bash
# 运行基本示例
npx ts-node examples/basic-usage.ts

# 运行流式示例
npx ts-node examples/streaming-usage.ts

# 运行增量示例
npx ts-node examples/incremental-usage.ts

# 运行多提供商示例
npx ts-node examples/multi-provider-usage.ts

# 运行Provider特定参数示例
npx ts-node examples/provider-specific-params.ts
```

## 注意事项

- 示例中使用了 Minimax TTS API，你需要有效的 API 凭据
- 其他提供商（OpenAI、Anthropic 等）的适配器需要单独实现
- 确保网络连接正常，因为 TTS 服务需要访问外部 API

## 核心概念

### TTSRelay

统一的 TTS 服务中继，负责管理多个 TTS 提供商和中间件。

### Provider Adapter

适配器模式实现，将统一接口转换为各个提供商特定的 API 调用。

### Middleware

中间件系统，支持在请求处理过程中插入自定义逻辑（如日志、监控等）。

### 统一接口

所有 TTS 提供商都通过相同的接口调用，简化了多提供商的使用。

### Extra 参数机制 🆕

通过 `extra` 字段支持传入任意 provider 特定参数：

```typescript
// 基础统一参数
const basicParams = {
  text: '要合成的文本',
  voice: 'female-tianmei',
  model: 'speech-02-hd',
  format: 'mp3',
};

// 带有 Minimax 特定参数
const minimaxParams = {
  ...basicParams,
  extra: {
    // Minimax 特有的音色权重
    timber_weights: [
      { voice_id: 'female-tianmei', weight: 0.7 },
      { voice_id: 'female-yujie', weight: 0.3 },
    ],
    // 语言增强
    language_boost: 'Chinese',
    // 字幕功能
    subtitle_enable: true,
    // 覆盖基础参数
    voice_setting: {
      voice_id: 'male-qn-qingse', // 覆盖 voice 参数
      emotion: 'happy',
    },
  },
};
```

这种设计允许：

1. **向后兼容**：现有代码无需修改
2. **灵活扩展**：支持任意 provider 特定功能
3. **参数覆盖**：extra 参数可以覆盖基础参数
4. **类型安全**：通过适配器确保参数正确转换
