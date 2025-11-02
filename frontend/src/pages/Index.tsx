"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import ChatContainer from "@/components/ChatContainer";
import Sidebar from "@/components/Sidebar";
import { useChatHistory } from "@/components/ChatHistoryProvider";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { cn } from "@/lib/utils"; // Import cn for conditional class names

const Index = () => {
  const { isLoading: isChatHistoryLoading } = useChatHistory();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar starts open by default
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (isChatHistoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex flex-grow overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main
          className={cn(
            "flex-grow flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden transition-all duration-300 ease-in-out",
            // On desktop, if sidebar is open, no extra margin needed as sidebar takes space.
            // If sidebar is closed, main content naturally expands.
            // On mobile, sidebar is a sheet, so main content is always full width.
          )}
        >
          <ChatContainer />
        </main>
      </div>
    </div>
  );
};

export default Index;