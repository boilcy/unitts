export type MinimaxVoiceId =
  | 'male-qn-qingse'
  | 'male-qn-jingying'
  | 'male-qn-badao'
  | 'male-qn-daxuesheng'
  | 'female-shaonv'
  | 'female-yujie'
  | 'female-chengshu'
  | 'female-tianmei'
  | 'presenter_male'
  | 'presenter_female'
  | 'audiobook_male_1'
  | 'audiobook_male_2'
  | 'audiobook_female_1'
  | 'audiobook_female_2'
  | 'male-qn-qingse-jingpin'
  | 'male-qn-jingying-jingpin'
  | 'male-qn-badao-jingpin'
  | 'male-qn-daxuesheng-jingpin'
  | 'female-shaonv-jingpin'
  | 'female-yujie-jingpin'
  | 'female-chengshu-jingpin'
  | 'female-tianmei-jingpin'
  | 'clever_boy'
  | 'cute_boy'
  | 'lovely_girl'
  | 'cartoon_pig'
  | 'bingjiao_didi'
  | 'junlang_nanyou'
  | 'chunzhen_xuedi'
  | 'lengdan_xiongzhang'
  | 'badao_shaoye'
  | 'tianxin_xiaoling'
  | 'qiaopi_mengmei'
  | 'wumei_yujie'
  | 'diadia_xuemei'
  | 'danya_xuejie'
  | 'Santa_Claus'
  | 'Grinch'
  | 'Rudolph'
  | 'Arnold'
  | 'Charming_Santa'
  | 'Charming_Lady'
  | 'Sweet_Girl'
  | 'Cute_Elf'
  | 'Attractive_Girl'
  | 'Serene_Woman'
  | (string & {});

export type MinimaxLanguageBoost =
  | 'Chinese'
  | 'Chinese,Yue'
  | 'English'
  | 'Arabic'
  | 'Russian'
  | 'Spanish'
  | 'French'
  | 'Portuguese'
  | 'German'
  | 'Turkish'
  | 'Dutch'
  | 'Ukrainian'
  | 'Vietnamese'
  | 'Indonesian'
  | 'Japanese'
  | 'Italian'
  | 'Korean'
  | 'Thai'
  | 'Polish'
  | 'Romanian'
  | 'Greek'
  | 'Czech'
  | 'Finnish'
  | 'Hindi'
  | 'auto';

export interface TimberWeight {
  voice_id: MinimaxVoiceId;
  weight: number;
}

export interface MinimaxTTSParams {
  text: string;
  model:
    | 'speech-02-hd'
    | 'speech-02-turbo'
    | 'speech-01-hd'
    | 'speech-01-turbo'
    | 'speech-01-240228'
    | 'speech-01-turbo-240228';
  voice_setting?: {
    voice_id?: MinimaxVoiceId;
    speed?: number;
    vol?: number;
    pitch?: number;
    emotion?: 'sad' | 'happy' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'neutral';
    latex_read?: boolean;
    english_normalization?: boolean;
  };
  timber_weights?: TimberWeight[];
  audio_setting?: {
    format?: 'mp3' | 'wav' | 'pcm' | 'flac';
    sample_rate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100;
    bit_rate?: 32000 | 64000 | 128000 | 256000;
    channel?: 1 | 2;
  };
  pronunciation_dict?: {
    tone: string[];
  };
  stream?: boolean;
  stream_options?: {
    exclude_aggregated_audio: boolean;
  };
  language_boost?: MinimaxLanguageBoost;
  subtitle_enable?: boolean;
  output_format?: 'hex' | 'url'; // 默认hex
}

export interface MinimaxTTSResponse {
  base_resp: {
    status_code: number;
    status_msg: string;
  };
  data?: {
    // 合成后的音频片段，采用hex编码，按照输入定义的格式进行生成（mp3/pcm/flac）。
    audio: string;
    // 合成的字幕下载链接。音频文件对应的字幕，精确到句（不超过50字），单位为毫秒，格式为json。
    subtitle_file?: string;
    // 当前音频流状态，1表示合成中，2表示合成结束。
    status: number;
  };
  extra_info?: {
    audio_length: number;
    audio_sample_rate: number;
    audio_size: number;
    bitrate: number;
    audio_format: string;
    audio_channel: number;
    invisible_character_ratio: number;
    usage_characters: number;
  };
  trace_id: string;
}

export type MinimaxTTSChunk = MinimaxTTSResponse;

export interface WSMinimaxTTSResponse {
  base_resp: {
    status_code: number;
    status_msg: string;
  };
  data?: {
    // 合成后的音频片段，采用hex编码，按照输入定义的格式进行生成（mp3/pcm/flac）。
    audio: string;
  };
  extra_info?: {
    audio_length: number;
    audio_sample_rate: number;
    audio_size: number;
    bitrate: number;
    audio_format: string;
    audio_channel: number;
    invisible_character_ratio: number;
    usage_characters: number;
  };
  trace_id: string;
  session_id: string;
  event: 'task_continued';
  is_final: boolean;
}

// Minimax 客户端构造函数选项
export interface MinimaxClientOptions {
  apiKey: string;
  groupId: string;
}
