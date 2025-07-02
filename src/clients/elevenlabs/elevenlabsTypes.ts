import { ElevenLabs } from '@elevenlabs/elevenlabs-js';

export type TextToSpeechRequest =
  | ElevenLabs.TextToSpeechRequest
  | ElevenLabs.TextToSpeechWithTimestampsRequest;

// 基础扩展类型
export interface TextToSpeechRequestBase {
  voiceId: string;
}

// 带 timestamps 的请求类型
export interface TextToSpeechRequestWithTimestamps
  extends ElevenLabs.TextToSpeechWithTimestampsRequest,
    TextToSpeechRequestBase {
  withTimestamps: true;
}

// 不带 timestamps 的请求类型
export interface TextToSpeechRequestWithoutTimestamps
  extends ElevenLabs.TextToSpeechRequest,
    TextToSpeechRequestBase {
  withTimestamps?: false;
}

// 联合类型
export type TextToSpeechRequestExtended =
  | TextToSpeechRequestWithTimestamps
  | TextToSpeechRequestWithoutTimestamps;

// 流式请求的相同模式
export interface StreamTextToSpeechRequestWithTimestamps
  extends ElevenLabs.StreamTextToSpeechWithTimestampsRequest,
    TextToSpeechRequestBase {
  withTimestamps: true;
}

export interface StreamTextToSpeechRequestWithoutTimestamps
  extends ElevenLabs.StreamTextToSpeechRequest,
    TextToSpeechRequestBase {
  withTimestamps?: false;
}

export type StreamTextToSpeechRequestExtended =
  | StreamTextToSpeechRequestWithTimestamps
  | StreamTextToSpeechRequestWithoutTimestamps;

// 条件类型：根据 withTimestamps 参数返回不同的响应类型
export type TTSResponse<T extends { withTimestamps?: boolean }> =
  T extends { withTimestamps: true } ? ElevenLabs.AudioWithTimestampsResponse : Uint8Array<ArrayBufferLike>;

export type TTSStreamResponse<T extends { withTimestamps?: boolean }> =
  T extends { withTimestamps: true } ? ElevenLabs.StreamingAudioChunkWithTimestampsResponse
  : Uint8Array<ArrayBufferLike>;

export type WSTextToSpeechRequest = {
  authorization?: string;
  modelId?: string;
  languageCode?: string;
  enableLogging?: boolean;
  enableSSMLParsing?: boolean;
  outputFormat?: ElevenLabs.TextToSpeechStreamRequestOutputFormat;
  inactivityTimeout?: number;
  syncAlignment?: boolean;
  autoModel: false;
  applyTextNormalization?: ElevenLabs.BodyTextToSpeechStreamingV1TextToSpeechVoiceIdStreamPostApplyTextNormalization;
  seed?: number;
};

export type WSTextToSpeechRequestExtended = WSTextToSpeechRequest & {
  voiceId: string;
};

export type TextToSpeechRequestUnion =
  | TextToSpeechRequestExtended
  | StreamTextToSpeechRequestExtended
  | WSTextToSpeechRequestExtended;

export type WSMessageInit = {
  text: string;
  voiceSettings?: ElevenLabs.VoiceSettings;
  generationConfig?: {
    chunkLengthSchedule?: number[];
  };
  pronunciationDictionaryLocators?: ElevenLabs.PronunciationDictionaryVersionLocator[];
  'xi-api-key'?: string;
  authorization?: string;
};

export type WSMessageSendText = {
  text: string;
  tryTriggerGeneration?: boolean;
  voiceSettings?: ElevenLabs.VoiceSettings;
  generationConfig?: {
    chunkLengthSchedule?: number[];
  };
  flush?: boolean;
};

export type WSMessageClose = {
  text: '';
};

export type WSMessage = WSMessageInit | WSMessageSendText | WSMessageClose;

export type WSReceivedMessageAudio = {
  audio: string; // base64 encoded audio
  isFinal: boolean;
  normalizedAlignment?: {
    charStartTimesMs: number[];
    charsDurationMs: number[];
    chars: string[];
  };
  alignment?: {
    charStartTimesMs: number[];
    charsDurationMs: number[];
    chars: string[];
  };
};
