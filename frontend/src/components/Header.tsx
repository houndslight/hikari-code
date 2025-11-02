"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle"; // Correctly import ThemeToggle

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border shadow-lg">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Hikari Assistant</h1>
      </div>
      <ThemeToggle />
    </header>
  );
};

export default Header;