export type Role = 'user' | 'assistant';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  mimeType: string;
  size: number;
  data: string; // base64 data url or content
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  isStreaming?: boolean;
  isError?: boolean;
  liked?: boolean;
  disliked?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
}

export interface MemoryItem {
  id: string;
  text: string;
  createdAt: number;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResponseStyle = 'concise' | 'balanced' | 'detailed' | 'creative';

export interface AppSettings {
  theme: ThemeMode;
  model: string;
  responseStyle: ResponseStyle;
  temperature: number;
  enableStreaming: boolean;
  enableMemory: boolean;
  enableWebSearch: boolean;
  ttsVoice?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  isGuest: boolean;
}

export interface CreativeTool {
  id: string;
  category: 'writing' | 'creative' | 'productivity' | 'coding';
  name: string;
  description: string;
  icon: string;
  promptTemplate: string;
  inputPlaceholder: string;
}

export interface FollowUpPrompt {
  id: string;
  label: string;
  prompt: string;
  icon?: 'sparkles' | 'code' | 'help' | 'list' | 'lightbulb' | 'arrow' | 'file';
}
