> 🌏 This README is in English. [点击查看中文文档 (中文说明)](./README_CN.md)

# UNITTS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/unitts.svg)](https://badge.fury.io/js/unitts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**UNITTS** is a unified Text-to-Speech (TTS) library written in TypeScript, providing a unified API interface to support multiple TTS service providers.

## ✨ Features

- 🔌 **Unified Interface**: Consistent API experience for all TTS providers
- 🧩 **Adapter Pattern**: Seamlessly connect to different TTS services via adapters
- 🌊 **Streaming Support**: Supports streaming and incremental TTS synthesis
- 🔧 **Middleware Support**: Onion-model middleware architecture, supports logging, timing, etc.
- 📦 **TypeScript**: Full type support and type safety
- 🚀 **Extensibility**: Easily add new TTS providers
- ⚡ **High Performance**: Asynchronous processing and streaming output

## 🚀 Quick Start

### Installation

```bash
npm install unitts
# or
pnpm add unitts
# or
yarn add unitts
```

### Basic Usage

```typescript
import { TTSRelay } from 'unitts';
import { MinimaxProviderAdapter } from 'unitts/adapters';

// Create TTS relay instance
const ttsRelay = new TTSRelay();

// Register Minimax adapter
const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
ttsRelay.registerAdapter('minimax', minimaxAdapter);

// Text-to-speech
const result = await ttsRelay.synthesize('minimax', {
  text: 'Hello, welcome to UNITTS!',
  voice: 'female-tianmei',
  model: 'speech-02-hd',
  format: 'mp3',
});

console.log('Audio ID:', result.id);
console.log('Audio Data:', result.data); // Base64 encoded audio data
```

## 📚 Supported TTS Providers

Currently supports the following TTS providers:

| Provider                                         | Status     | Description                |
| ------------------------------------------------ | ---------- | ------------------------- |
| [Minimax](https://www.minimaxi.com/)             | ✅ Ready   | Minimax TTS service       |
| [Tencent](https://cloud.tencent.com/product/tts) | ✅ Ready   | Tencent Cloud TTS service |
| [Elevenlabs](https://elevenlabs.io/)             | ✅ Ready   | Elevenlabs TTS service    |
| OpenAI                                           | 🚧 WIP     | GPT series TTS service    |
| Anthropic                                        | 🚧 WIP     | Claude TTS service        |
| Google Gemini                                    | 🚧 WIP     | Gemini TTS service        |
| Lovo.ai                                          | 🚧 WIP     |         |

## 🔧 Usage Examples

### Streaming Synthesis

```typescript
import { TTSRelay } from 'unitts';
import { MinimaxProviderAdapter } from 'unitts/adapters';

const ttsRelay = new TTSRelay();
const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
ttsRelay.registerAdapter('minimax', minimaxAdapter);

// Streaming synthesis
const stream = ttsRelay.synthesizeStream('minimax', {
  text: 'This is a streaming TTS synthesis example',
  voice: 'male-qn-qingse',
  model: 'speech-02-hd',
  format: 'mp3',
  stream: true,
});

for await (const chunk of stream) {
  console.log('Audio chunk:', chunk.id, chunk.data.length);
  if (chunk.final) {
    console.log('Synthesis complete!');
    break;
  }
}
```

### Incremental Synthesis

```typescript
// Incremental synthesis - suitable for real-time text streams
async function* textGenerator() {
  const sentences = ['Hello,', 'welcome to', 'UNITTS!'];
  for (const sentence of sentences) {
    yield sentence;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

const stream = ttsRelay.synthesizeIncremental('minimax', textGenerator(), {
  voice: 'female-tianmei',
  model: 'speech-02-hd',
  format: 'mp3',
});

for await (const chunk of stream) {
  console.log('Incremental audio chunk:', chunk.id);
}
```

### Middleware Support

```typescript
import { LoggingMiddleware, TimingMiddleware } from 'unitts/middleware';

// Add logging middleware
ttsRelay.use(new LoggingMiddleware());

// Add timing middleware
ttsRelay.use(new TimingMiddleware());

// All TTS calls will go through middleware
const result = await ttsRelay.synthesize('minimax', {
  text: 'Test middleware feature',
  voice: 'female-tianmei',
});
```

### Provider-specific Parameters

```typescript
// Use Minimax-specific parameters
const result = await ttsRelay.synthesize('minimax', {
  text: 'Test provider-specific parameters',
  voice: 'female-tianmei',
  format: 'mp3',
  extra: {
    // Minimax-specific parameters
    speed: 1.2,
    vol: 0.8,
    pitch: 0,
    timber_weights: [{ voice_id: 'female-tianmei', weight: 1 }],
  },
});
```

## 📖 API Documentation

### TTSRelay

The main TTS relay class, providing a unified API interface.

#### Methods

- `registerAdapter(provider, adapter)` - Register a TTS provider adapter
- `use(middleware)` - Add middleware
- `synthesize(provider, params, options?)` - Text-to-speech
- `synthesizeStream(provider, params, options?)` - Streaming text-to-speech
- `synthesizeIncremental(provider, textStream, params, options?)` - Incremental text-to-speech
- `listProviders()` - List registered providers

#### Unified Parameters (UnifiedTTSParams)

```typescript
interface UnifiedTTSParams {
  text: string; // Text to synthesize
  model?: string; // Model name
  voice?: string; // Voice ID
  pitch?: number; // Pitch (-20 to 20)
  emotion?: string; // Emotion
  rate?: number; // Speed (0.5 to 2.0)
  volume?: number; // Volume (0 to 1)
  format?: string; // Audio format (mp3, wav, pcm, etc.)
  sampleRate?: number; // Sample rate
  stream?: boolean; // Whether to output as stream
  extra?: any; // Provider-specific parameters
}
```

#### Unified Response (UnifiedTTSAudio)

```typescript
interface UnifiedTTSAudio {
  id: string; // Audio ID
  data: string; // Base64 encoded audio data
  model?: string; // Model used
  object: 'tts.audio'; // Object type
  metadata?: Record<string, any>; // Metadata
  final: boolean; // Is this the final chunk
  originalResponse?: any; // Original response
}
```

## 🔌 Add a New TTS Provider

UNITTS uses the adapter pattern, making it easy to add new TTS providers:

1. **Create Client**: Create a new provider client under `src/clients/`
2. **Implement Adapter**: Create an adapter under `src/adapters/` and implement the `IProviderAdapter` interface
3. **Type Definitions**: Add provider-specific types in `src/types/unified.ts`
4. **Register Export**: Export the new adapter in the relevant `index.ts` file

For detailed development guide, see [Development Docs](docs/development.md).

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests and watch for file changes
pnpm test:watch

# Run a single test
pnpm test:run
```

## 🔨 Build

```bash
# Build the project
pnpm build

# Build in watch mode
pnpm build:watch

# Clean build files
pnpm clean
```

## 📝 Examples

See more usage examples in the [examples](examples/) directory:

- [Basic Usage](examples/basic-usage.ts)
- [Streaming Synthesis](examples/streaming-usage.ts)
- [Incremental Synthesis](examples/incremental-usage.ts)
- [Multi-provider Usage](examples/multi-provider-usage.ts)
- [Provider-specific Parameters](examples/provider-specific-params.ts)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).

## 👨‍💻 Author

- **boilcy** - _Project creator_ - [0x6c6379@gmail.com](mailto:0x6c6379@gmail.com)

## 🙏 Acknowledgements

Thanks to all the developers who contributed to this project!

---

If you find this project useful, please give it a ⭐!
