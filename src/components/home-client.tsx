"use client";

import { useState, useEffect } from "react";
import Header from "@/components/sections/header";
import Sidebar from "@/components/sections/sidebar";
import MainContent from "@/components/sections/main-content";
import LiveVoiceAI from "@/components/LiveVoiceAI";

/**
 * Home page client component
 * Manages sidebar, model selection, chat mode, and session state
 */
export const HomeClient: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"hesper-1.0v" | "hesper-pro">(
    "hesper-1.0v"
  );
  const [chatMode, setChatMode] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNewChat = () => {
    setChatMode(true);
    setChatKey((prev) => prev + 1);
    setCurrentSessionId(null);
    setSidebarOpen(false);
  };

  const handleLoadSession = (id: string) => {
    setCurrentSessionId(id);
    setChatMode(true);
  };

  const handleLiveClick = () => {
    setShowLive(!showLive);
    if (!showLive) {
      setChatMode(false);
      setCurrentSessionId(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onLiveClick={handleLiveClick}
        showLive={showLive}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          onNewChat={handleNewChat}
          onSelectSession={handleLoadSession}
        />
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`flex-1 overflow-auto ${isMobile ? 'w-full' : ''}`}>
          {!showLive ? (
            <MainContent
              selectedModel={selectedModel}
              chatMode={chatMode}
              onChatModeChange={setChatMode}
              chatKey={chatKey}
              currentSessionId={currentSessionId}
              onLoadSession={handleLoadSession}
            />
          ) : (
            <LiveVoiceAI />
          )}
        </div>
      </div>
    </div>
  );
};