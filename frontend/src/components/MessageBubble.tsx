"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeContent = part.substring(3, part.length - 3).trim();
        const languageMatch = codeContent.match(/^(\w+)\n/);
        const language = languageMatch ? languageMatch[1] : "javascript";
        const actualCode = languageMatch ? codeContent.substring(languageMatch[0].length) : codeContent;

        return (
          <SyntaxHighlighter
            key={index}
            language={language}
            style={coldarkDark}
            customStyle={{
              borderRadius: "0.75rem", // Softer corners for code blocks
              padding: "1rem",
              margin: "0.75rem 0", // Increased vertical margin
              fontSize: "0.875rem",
              lineHeight: "1.5rem", // Adjusted line height for better readability
              backgroundColor: "var(--rosepine-base)", // Ensure code block background fits theme
              color: "var(--rosepine-text)",
            }}
          >
            {actualCode}
          </SyntaxHighlighter>
        );
      } else {
        return (
          <p key={index} className="text-sm md:text-base whitespace-pre-wrap leading-relaxed"> {/* Adjusted line height */}
            {part}
          </p>
        );
      }
    });
  };

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] p-3 rounded-xl shadow-lg", // Softer corners, increased shadow, slightly narrower max-width
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-secondary text-secondary-foreground rounded-bl-none"
        )}
      >
        {renderMessageContent(message)}
      </div>
    </div>
  );
};

export default MessageBubble;