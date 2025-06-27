# UNITTS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/unitts.svg)](https://badge.fury.io/js/unitts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**UNITTS** 是一个用TypeScript编写的统一文本转语音(TTS)库，提供了一套统一的API接口来支持多个TTS服务提供商。

## ✨ 特性

- 🔌 **统一接口**: 为所有TTS提供商提供一致的API体验
- 🧩 **适配器模式**: 通过适配器无缝对接不同的TTS服务
- 🌊 **流式处理**: 支持流式和增量TTS合成
- 🔧 **中间件支持**: 洋葱模型的中间件架构，支持日志、计时等功能
- 📦 **TypeScript**: 完整的类型支持和类型安全
- 🚀 **可扩展性**: 轻松添加新的TTS提供商
- ⚡ **高性能**: 异步处理和流式输出

## 🚀 快速开始

### 安装

```bash
npm install unitts
# 或
pnpm add unitts
# 或
yarn add unitts
```

### 基本使用

```typescript
import { TTSRelay } from 'unitts';
import { MinimaxProviderAdapter } from 'unitts/adapters';

// 创建TTS中继实例
const ttsRelay = new TTSRelay();

// 注册Minimax适配器
const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
ttsRelay.registerAdapter('minimax', minimaxAdapter);

// 文本转语音
const result = await ttsRelay.synthesize('minimax', {
  text: '你好，欢迎使用统一TTS服务！',
  voice: 'female-tianmei',
  model: 'speech-02-hd',
  format: 'mp3',
});

console.log('音频ID:', result.id);
console.log('音频数据:', result.data); // Base64编码的音频数据
```

## 📚 支持的TTS提供商

目前支持以下TTS服务提供商：

| 提供商 | 状态 | 描述 |
|--------|------|------|
| [Minimax](https://www.minimaxi.com/) | ✅ 支持 | 海螺AI的TTS服务 |
| OpenAI | 🚧 开发中 | GPT系列的TTS服务 |
| Anthropic | 🚧 开发中 | Claude的TTS服务 |
| Google Gemini | 🚧 开发中 | Gemini的TTS服务 |

## 🔧 使用示例

### 流式合成

```typescript
import { TTSRelay } from 'unitts';
import { MinimaxProviderAdapter } from 'unitts/adapters';

const ttsRelay = new TTSRelay();
const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
ttsRelay.registerAdapter('minimax', minimaxAdapter);

// 流式合成
const stream = ttsRelay.synthesizeStream('minimax', {
  text: '这是一个流式TTS合成的示例',
  voice: 'male-qn-qingse',
  model: 'speech-02-hd',
  format: 'mp3',
  stream: true,
});

for await (const chunk of stream) {
  console.log('音频片段:', chunk.id, chunk.data.length);
  if (chunk.final) {
    console.log('合成完成!');
    break;
  }
}
```

### 增量合成

```typescript
// 增量合成 - 适用于实时文本流
async function* textGenerator() {
  const sentences = ['你好，', '欢迎使用', '统一TTS服务！'];
  for (const sentence of sentences) {
    yield sentence;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

const stream = ttsRelay.synthesizeIncremental(
  'minimax',
  textGenerator(),
  {
    voice: 'female-tianmei',
    model: 'speech-02-hd',
    format: 'mp3',
  }
);

for await (const chunk of stream) {
  console.log('增量音频片段:', chunk.id);
}
```

### 中间件支持

```typescript
import { LoggingMiddleware, TimingMiddleware } from 'unitts/middleware';

// 添加日志中间件
ttsRelay.use(new LoggingMiddleware());

// 添加计时中间件
ttsRelay.use(new TimingMiddleware());

// 所有TTS调用都会经过中间件处理
const result = await ttsRelay.synthesize('minimax', {
  text: '测试中间件功能',
  voice: 'female-tianmei',
});
```

### 提供商特定参数

```typescript
// 使用Minimax特定的参数
const result = await ttsRelay.synthesize('minimax', {
  text: '测试特定参数',
  voice: 'female-tianmei',
  format: 'mp3',
  extra: {
    // Minimax特定参数
    speed: 1.2,
    vol: 0.8,
    pitch: 0,
    timber_weights: [
      { voice_id: 'female-tianmei', weight: 1 }
    ]
  }
});
```

## 📖 API 文档

### TTSRelay

主要的TTS中继类，提供统一的API接口。

#### 方法

- `registerAdapter(provider, adapter)` - 注册TTS提供商适配器
- `use(middleware)` - 添加中间件
- `synthesize(provider, params, options?)` - 文本转语音
- `synthesizeStream(provider, params, options?)` - 流式文本转语音
- `synthesizeIncremental(provider, textStream, params, options?)` - 增量文本转语音
- `listProviders()` - 列出已注册的提供商

#### 统一参数 (UnifiedTTSParams)

```typescript
interface UnifiedTTSParams {
  text: string;           // 要合成的文本
  model?: string;         // 模型名称
  voice?: string;         // 声音ID
  pitch?: number;         // 音调 (-20 到 20)
  emotion?: string;       // 情感
  rate?: number;          // 语速 (0.5 到 2.0)
  volume?: number;        // 音量 (0 到 1)
  format?: string;        // 音频格式 (mp3, wav, pcm等)
  sampleRate?: number;    // 采样率
  stream?: boolean;       // 是否流式输出
  extra?: any;           // 提供商特定参数
}
```

#### 统一响应 (UnifiedTTSAudio)

```typescript
interface UnifiedTTSAudio {
  id: string;                    // 音频ID
  data: string;                  // Base64编码的音频数据
  model?: string;                // 使用的模型
  object: 'tts.audio';          // 对象类型
  metadata?: Record<string, any>; // 元数据
  final: boolean;               // 是否为最终片段
  originalResponse?: any;       // 原始响应
}
```

## 🔌 添加新的TTS提供商

UNITTS采用适配器模式，可以轻松添加新的TTS提供商：

1. **创建客户端**：在 `src/clients/` 下创建新的提供商客户端
2. **实现适配器**：在 `src/adapters/` 下创建适配器，实现 `IProviderAdapter` 接口
3. **类型定义**：在 `src/types/unified.ts` 中添加提供商特定的类型
4. **注册导出**：在相应的 `index.ts` 文件中导出新的适配器

详细的开发指南请参考 [开发文档](docs/development.md)。

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行测试并监听文件变化
pnpm test:watch

# 运行单次测试
pnpm test:run
```

## 🔨 构建

```bash
# 构建项目
pnpm build

# 监听模式构建
pnpm build:watch

# 清理构建文件
pnpm clean
```

## 📝 示例

更多使用示例请查看 [examples](examples/) 目录：

- [基本使用](examples/basic-usage.ts)
- [流式合成](examples/streaming-usage.ts)
- [增量合成](examples/incremental-usage.ts)
- [多提供商使用](examples/multi-provider-usage.ts)
- [提供商特定参数](examples/provider-specific-params.ts)

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 👨‍💻 作者

- **boilcy** - *项目创建者* - [0x6c6379@gmail.com](mailto:0x6c6379@gmail.com)

## 🙏 致谢

感谢所有为此项目做出贡献的开发者！

---

如果您觉得这个项目有用，请给它一个 ⭐！
