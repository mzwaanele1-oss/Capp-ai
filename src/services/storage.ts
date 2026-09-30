import { Conversation, AppSettings, MemoryItem, UserProfile } from '../types';

const CONVERSATIONS_KEY = 'capp_ai_conversations_v1';
const CURRENT_CONVO_KEY = 'capp_ai_current_convo_id';
const SETTINGS_KEY = 'capp_ai_settings_v1';
const MEMORIES_KEY = 'capp_ai_memories_v1';
const USER_KEY = 'capp_ai_user_profile_v1';
const ONBOARDING_KEY = 'capp_ai_onboarded_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  model: 'gemini-3.8-flash',
  responseStyle: 'balanced',
  temperature: 0.7,
  enableStreaming: true,
  enableMemory: true,
  enableWebSearch: false,
  ttsVoice: '',
};

export const DEFAULT_USER: UserProfile = {
  name: 'User',
  email: 'mzwaanele12@gmail.com',
  isGuest: false,
};

export const storage = {
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(CONVERSATIONS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load conversations from storage:', e);
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to storage:', e);
    }
  },

  getCurrentConversationId(): string | null {
    return localStorage.getItem(CURRENT_CONVO_KEY);
  },

  setCurrentConversationId(id: string | null): void {
    if (id) {
      localStorage.setItem(CURRENT_CONVO_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_CONVO_KEY);
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(MEMORIES_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    try {
      localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save memories:', e);
    }
  },

  getUser(): UserProfile {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (!data) return DEFAULT_USER;
      return { ...DEFAULT_USER, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_USER;
    }
  },

  saveUser(user: UserProfile): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  },

  isOnboarded(): boolean {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  },

  setOnboarded(): void {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  },

  clearAllData(): void {
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(CURRENT_CONVO_KEY);
    localStorage.removeItem(MEMORIES_KEY);
  },
};
