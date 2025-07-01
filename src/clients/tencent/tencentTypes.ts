export type TencentVoiceId =
  // Real-time voice synthesis voices
  | 502004 // 智小满
  | 502003 // 智小敏
  | 502001 // 智小柔
  // Large model voices
  | 501000 // 智斌
  | 501001 // 智兰
  | 501002 // 智菊
  | 501003 // 智宇
  | 501004 // 月华
  | 501005 // 飞镜
  | 501006 // 千嶂
  | 501007 // 浅草
  | 501008 // WeJames
  | 501009 // WeWinny
  // Large model voices with emotions
  | 601015 // 爱小童
  | 601000 // 爱小溪
  | 601001 // 爱小洛
  | 601002 // 爱小辰
  | 601003 // 爱小荷
  | 601004 // 爱小树
  | 601005 // 爱小静
  | 601006 // 爱小耀
  | 601007 // 爱小叶
  | 601008 // 爱小豪
  | 601009 // 爱小芊
  | 601010 // 爱小娇
  | 601011 // 爱小川
  | 601012 // 爱小璟
  | 601013 // 爱小伊
  | 601014 // 爱小简
  // Premium voices
  | 100510000 // 智逍遥
  | 101001 // 智瑜
  | 101002 // 智聆
  | 101003 // 智美
  | 101004 // 智云
  | 101005 // 智莉
  | 101006 // 智言
  | 101008 // 智琪
  | 101009 // 智芸
  | 101010 // 智华
  | 101011 // 智燕
  | 101012 // 智丹
  | 101013 // 智辉
  | 101014 // 智宁
  | 101015 // 智萌
  | 101016 // 智甜
  | 101017 // 智蓉
  | 101018 // 智靖
  | 101019 // 智彤
  | 101020 // 智刚
  | 101021 // 智瑞
  | 101022 // 智虹
  | 101023 // 智萱
  | 101024 // 智皓
  | 101025 // 智薇
  | 101026 // 智希
  | 101027 // 智梅
  | 101028 // 智洁
  | 101029 // 智凯
  | 101030 // 智柯
  | 101031 // 智奎
  | 101032 // 智芳
  | 101033 // 智蓓
  | 101081 // 智佳
  | 101080 // 智英
  | 101034 // 智莲
  | 101035 // 智依
  | 101040 // 智川
  | 101050 // WeJack
  | 101051 // WeRose
  | 101052 // 智味
  | 101053 // 智方
  | 101054 // 智友
  | 101055 // 智付
  | 101056 // 智林
  | 101057 // 智美子
  // Premium voices with emotions
  | 301000 // 爱小广
  | 301001 // 爱小栋
  | 301002 // 爱小海
  | 301003 // 爱小霞
  | 301004 // 爱小玲
  | 301005 // 爱小章
  | 301006 // 爱小峰
  | 301007 // 爱小亮
  | 301008 // 爱小博
  | 301009 // 爱小芸
  | 301010 // 爱小秋
  | 301011 // 爱小芳
  | 301012 // 爱小琴
  | 301013 // 爱小康
  | 301014 // 爱小辉
  | 301015 // 爱小璐
  | 301016 // 爱小阳
  | 301017 // 爱小泉
  | 301018 // 爱小昆
  | 301019 // 爱小诚
  | 301020 // 爱小岚
  | 301021 // 爱小茹
  | 301022 // 爱小蓉
  | 301023 // 爱小燕
  | 301024 // 爱小莲
  | 301025 // 爱小武
  | 301026 // 爱小雪
  | 301027 // 爱小媛
  | 301028 // 爱小娴
  | 301029 // 爱小涛
  | 301030 // 爱小溪
  | 301031 // 爱小树
  | 301032 // 爱小荷
  | 301033 // 爱小叶
  | 301034 // 爱小杭
  | 301035 // 爱小梅
  | 301036 // 爱小柯
  | 301037 // 爱小静
  | 301038 // 爱小桃
  | 301039 // 爱小萌
  | 301040 // 爱小星
  | 301041 // 爱小菲
  // Standard voices
  | 10510000 // 智逍遥
  | 1001 // 智瑜
  | 1002 // 智聆
  | 1003 // 智美
  | 1004 // 智云
  | 1005 // 智莉
  | 1008 // 智琪
  | 1009 // 智芸
  | 1010 // 智华
  | 1017 // 智蓉
  | 1018 // 智靖
  | 1050 // WeJack
  | 1051; // WeRose

export interface TencentAuth {
  app_id: string;
  secret_id: string;
  secret_key: string;
}

// 基础语音合成参数
export interface TencentTTSParams {
  Action: 'TextToVoice' | 'TextToStreamAudioWS' | 'TextToStreamAudioWSv2';
  Version: '2019-08-23';
  Region?: string;
  Text: string;
  SessionId: string;
  Volume?: number;
  Speed?: number;
  ProjectId?: number;
  ModelType?: number;
  VoiceType?: number;
  FastVoiceType?: string; // deprecated
  PrimaryLanguage?: number;
  SampleRate?: 24000 | 16000 | 8000;
  Codec?: 'mp3' | 'pcm' | 'opus'; // wav returns error??
  EnableSubtitle?: boolean;
  SegmentRate?: number; // [0,1,2]
  EmotionCategory?:
    | 'neutral'
    | 'sad'
    | 'happy'
    | 'angry'
    | 'fear'
    | 'news'
    | 'story'
    | 'radio'
    | 'poetry'
    | 'call'
    | 'sajiao'
    | 'disgusted'
    | 'amaze'
    | 'peaceful'
    | 'exciting'
    | 'aojiao'
    | 'jieshuo';
  EmotionIntensity?: number; // 50 - 200, default 100
}
// 基础语音合成响应
export interface TencentBatchResponse {
  Audio: string; // base64 音频数据
  SessionId: string;
  RequestId: string;
  Subtitles: Array<Subtitle>;
}

// 流式语音合成响应
// audio data is send separately
export interface TencentTTSStreamResponse {
  code: number;
  message: string;
  session_id: string;
  request_id: string;
  message_id: string;
  final?: number;
  result?: {
    subtitles?: Array<Subtitle>;
  };
}

// 流式文本合成响应
// audio data is send separately
export interface TencentTTSIncrementalResponse {
  code: number;
  message: string;
  session_id: string;
  request_id: string;
  message_id: string;
  final?: number;
  ready?: number;
  heartbeat?: number;
  result?: {
    subtitles?: Array<Subtitle>;
  };
}

export type TencentWSResponse = TencentTTSIncrementalResponse;

interface Subtitle {
  Text: string;
  BeginTime: number;
  EndTime: number;
  BeginIndex: number;
  EndIndex: number;
  Phoneme?: string;
}

// WebSocket 消息类型
export interface TencentWSMessage {
  session_id: string;
  message_id: string;
  action: 'ACTION_SYNTHESIS' | 'ACTION_COMPLETE' | 'ACTION_RESET';
  data: string;
}

// 批量合成参数
export interface TencentBatchTTSParams extends TencentTTSParams {
  // 批量合成没有额外参数
}

// 流式合成参数
export interface TencentStreamTTSParams {
  Action: 'TextToStreamAudioWS';
  AppId: number;
  SecretId: string;
  Timestamp: number;
  Expired: number;
  SessionId: string;
  Text: string;
  VoiceType?: number;
  FastVoiceType?: string;
  Volume?: number;
  Speed?: number;
  SampleRate?: 24000 | 16000 | 8000;
  Codec?: 'mp3' | 'wav' | 'pcm';
  EnableSubtitle?: boolean;
  SegmentRate?: number; // [0,1,2]
  Signature: string;
  EmotionCategory?:
    | 'neutral'
    | 'sad'
    | 'happy'
    | 'angry'
    | 'fear'
    | 'news'
    | 'story'
    | 'radio'
    | 'poetry'
    | 'call'
    | 'sajiao'
    | 'disgusted'
    | 'amaze'
    | 'peaceful'
    | 'exciting'
    | 'aojiao'
    | 'jieshuo';
  EmotionIntensity?: number; // 50 - 200, default 100
}

// 增量合成参数
export interface TencentIncrementalTTSParams extends Omit<TencentStreamTTSParams, 'Text'> {
  // 增量合成不需要 text 参数，文本通过流提供
}

// ---above is copied from official doc---
// because tencent send audio data separately, so we need to define the response type
export interface TencentTTSResponse {
  code: number;
  message: string;
  session_id: string;
  request_id: string;
  message_id: string;
  audio_data?: string; // base64编码的音频数据或blob数据
  audio_blob?: Blob; // 原始blob数据（在某些情况下保留）
  final?: number; // 1 表示合成完成
  result?: {
    subtitles?: Array<Subtitle>;
  };
}

// 流式合成响应块
export interface TencentTTSChunk extends TencentTTSStreamResponse {
  audio_data?: Blob; // 音频数据块
}
