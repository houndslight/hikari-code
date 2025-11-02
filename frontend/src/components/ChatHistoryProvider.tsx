"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { ChatSession, ChatMessage } from "@/types/chat";
import {
  loadChatHistory,
  saveChatHistory,
  createNewChatSession,
  generateMessageId,
} from "@/utils/chatHistory";
import { showSuccess } from "@/utils/toast";

interface ChatHistoryContextType {
  chatSessions: ChatSession[];
  currentChatSessionId: string | null;
  currentChatMessages: ChatMessage[];
  startNewChat: () => void;
  selectChatSession: (sessionId: string) => void;
  addMessageToCurrentChat: (text: string, isUser: boolean) => void;
  updateLastAIMessage: (newText: string) => void;
  isLoading: boolean;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(
  undefined,
);

export const ChatHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const history = loadChatHistory();
    setChatSessions(history);
    if (history.length > 0) {
      setCurrentChatSessionId(history[0].id); // Load the most recent chat
    } else {
      const newSession = createNewChatSession();
      setChatSessions([newSession]);
      setCurrentChatSessionId(newSession.id);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveChatHistory(chatSessions);
    }
  }, [chatSessions, isLoading]);

  const startNewChat = useCallback(() => {
    const newSession = createNewChatSession();
    setChatSessions((prev) => [newSession, ...prev]);
    setCurrentChatSessionId(newSession.id);
    showSuccess("New chat started!");
  }, []);

  const selectChatSession = useCallback((sessionId: string) => {
    setCurrentChatSessionId(sessionId);
  }, []);

  const addMessageToCurrentChat = useCallback(
    (text: string, isUser: boolean) => {
      if (!currentChatSessionId) return;

      const newMessage: ChatMessage = {
        id: generateMessageId(),
        text,
        isUser,
        timestamp: Date.now(),
      };

      setChatSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentChatSessionId
            ? {
                ...session,
                messages: [...session.messages, newMessage],
                updatedAt: Date.now(),
                title: session.messages.length === 0 && isUser ? text.substring(0, 30) + (text.length > 30 ? "..." : "") : session.title,
              }
            : session,
        ),
      );
    },
    [currentChatSessionId],
  );

  const updateLastAIMessage = useCallback(
    (newText: string) => {
      if (!currentChatSessionId) return;

      setChatSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === currentChatSessionId) {
            const lastMessageIndex = session.messages.length - 1;
            if (lastMessageIndex >= 0 && !session.messages[lastMessageIndex].isUser) {
              const updatedMessages = [...session.messages];
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                text: newText,
                timestamp: Date.now(),
              };
              return {
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              };
            }
          }
          return session;
        }),
      );
    },
    [currentChatSessionId],
  );

  const currentChatMessages =
    chatSessions.find((session) => session.id === currentChatSessionId)
      ?.messages || [];

  const value = {
    chatSessions,
    currentChatSessionId,
    currentChatMessages,
    startNewChat,
    selectChatSession,
    addMessageToCurrentChat,
    updateLastAIMessage,
    isLoading,
  };

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error("useChatHistory must be used within a ChatHistoryProvider");
  }
  return context;
};