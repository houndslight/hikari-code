import { ChatSession, ChatMessage } from "@/types/chat";

const CHAT_HISTORY_KEY = "hikari_chat_history";

export const loadChatHistory = (): ChatSession[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const history = localStorage.getItem(CHAT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Failed to load chat history from localStorage:", error);
    return [];
  }
};

export const saveChatHistory = (history: ChatSession[]) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save chat history to localStorage:", error);
  }
};

export const createNewChatSession = (): ChatSession => {
  const now = Date.now();
  return {
    id: `chat-${now}`,
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const generateMessageId = (): string => {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};