"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, MessageSquare, Github } from "lucide-react";
import { useChatHistory } from "@/components/ChatHistoryProvider";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { chatSessions, currentChatSessionId, startNewChat, selectChatSession } =
    useChatHistory();

  const handleNewChat = () => {
    startNewChat();
    onClose?.();
  };

  const handleSelectChat = (sessionId: string) => {
    selectChatSession(sessionId);
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={handleNewChat}
          className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-md transition-colors"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>
      <ScrollArea className="flex-grow p-2 custom-scrollbar"> {/* Added custom-scrollbar class */}
        <nav className="grid gap-1">
          {chatSessions.map((session) => (
            <Button
              key={session.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left px-3 py-2 rounded-md transition-colors",
                currentChatSessionId === session.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold hover:bg-sidebar-accent/80 shadow-sm" // Enhanced active state
                  : "hover:bg-sidebar-subtle",
              )}
              onClick={() => handleSelectChat(session.id)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span className="truncate">{session.title || "Untitled Chat"}</span>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-sidebar-border text-sm text-muted-foreground">
        <a
          href="https://github.com/houndslight/hikari-pack"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:text-sidebar-primary transition-colors mb-2"
        >
          <Github className="mr-2 h-4 w-4" /> GitHub Repo
        </a>
        <p>Created by <a href="https://houndslight.online" target="_blank" rel="noopener noreferrer" className="hover:text-sidebar-primary transition-colors">houndslight.online</a></p>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0"> {/* Removed border-r from SheetContent */}
          <SidebarContent onClose={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      {isSidebarOpen && <SidebarContent />}
    </div>
  );
};

export default Sidebar;