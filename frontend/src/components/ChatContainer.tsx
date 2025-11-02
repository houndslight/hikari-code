"use client";
import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { showLoading, dismissToast, showError } from "@/utils/toast";
import { useChatHistory } from "./ChatHistoryProvider";
import { Loader2 } from "lucide-react";

const ChatContainer: React.FC = () => {
  const {
    currentChatMessages,
    addMessageToCurrentChat,
    updateLastAIMessage,
    isLoading: isHistoryLoading,
  } = useChatHistory();
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChatMessages]);

  const handleSendMessage = async (text: string) => {
    addMessageToCurrentChat(text, true);
    setIsSendingMessage(true);
    const loadingToastId = showLoading("Hikari is thinking...");

    try {
      // Add empty AI message placeholder
      addMessageToCurrentChat("", false);

      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Split by newlines to handle multiple data events
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr);
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.content) {
                accumulatedContent += data.content;
                updateLastAIMessage(accumulatedContent);
              }
              
              if (data.done) {
                break;
              }
            } catch (parseError) {
              console.warn("Failed to parse chunk:", line, parseError);
            }
          }
        }
      }

      // If no content was received, show error
      if (!accumulatedContent) {
        throw new Error("No response received from server");
      }

    } catch (error) {
      console.error("Error sending message:", error);
      showError("Failed to get a response from Hikari. Please try again.");
      updateLastAIMessage("Sorry, I encountered an error. Please try again.");
    } finally {
      dismissToast(loadingToastId);
      setIsSendingMessage(false);
    }
  };

  if (isHistoryLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow w-full max-w-3xl mx-auto bg-card rounded-xl shadow-2xl overflow-hidden">
      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        {currentChatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-center p-4">
            <p className="text-lg font-medium">Start a conversation with Hikari, your Code Companion!</p>
          </div>
        ) : (
          currentChatMessages.map((msg, index) => (
            <MessageBubble key={msg.id || index} message={msg.text} isUser={msg.isUser} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isSendingMessage} />
    </div>
  );
};

export default ChatContainer;