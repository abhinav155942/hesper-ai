"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Header from "@/components/sections/header";
import Sidebar from "@/components/sections/sidebar";
import MainContent from "@/components/sections/main-content";

export const HomeClient: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"hesper-1.0v" | "hesper-pro">(
    "hesper-1.0v"
  );
  const [chatMode, setChatMode] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNewChat = () => {
    setChatMode(true);
    setSelectedChatId(null);
    setChatKey((prev) => prev + 1);
    setSidebarOpen(false);
  };

  const handleSelectChat = (id: number) => {
    setSelectedChatId(id);
    setChatMode(true);
    setSidebarOpen(false);
    // bump key to force fresh mount if switching
    setChatKey((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`flex-1 overflow-auto ${isMobile ? 'w-full' : ''}`}>
          <MainContent
            selectedModel={selectedModel}
            chatMode={chatMode}
            onChatModeChange={setChatMode}
            chatKey={chatKey}
            selectedChatId={selectedChatId}
          />
        </div>
      </div>
    </div>
  );
};