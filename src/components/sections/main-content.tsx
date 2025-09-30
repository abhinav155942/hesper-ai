"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Mic } from 'lucide-react';
import { toast } from "sonner";
import ChatInterface from "@/components/chat/chat-interface";
import LiveVoiceAI from "./live-voice-ai";

interface MainContentProps {
  selectedModel?: 'hesper-1.0v' | 'hesper-pro';
  chatMode?: boolean;
  onChatModeChange?: (mode: boolean) => void;
  chatKey?: number;
  currentSessionId?: string;
  onLoadSession?: (id: string) => void;
}

export default function MainContent({
  selectedModel = 'hesper-1.0v',
  chatMode: externalChatMode,
  onChatModeChange,
  chatKey,
  currentSessionId,
  onLoadSession
}: MainContentProps) {
  const [internalChatMode, setInternalChatMode] = useState(externalChatMode || false);
  const [inputValue, setInputValue] = useState("");
  const [credits, setCredits] = useState(0);
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    if (externalChatMode !== undefined) {
      setInternalChatMode(externalChatMode);
    }
  }, [externalChatMode]);

  const setChatMode = (mode: boolean) => {
    setInternalChatMode(mode);
    onChatModeChange?.(mode);
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      toast.error("Please log in to view credits");
      return;
    }

    try {
      const res = await fetch("/api/user/credits", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to fetch credits");
      }
    } catch (err) {
      toast.error("Failed to fetch credits");
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Switch to chat mode with the input message
    setChatMode(true);
  };

  const handleBackToHome = () => {
    setChatMode(false);
    setInputValue("");
  };

  if (internalChatMode) {
    return (
      <div className="w-full h-full flex flex-col">
        <ChatInterface
          selectedModel={selectedModel}
          onBack={() => setChatMode(false)}
          initialMessage={inputValue}
          currentSessionId={currentSessionId}
          onLoadSession={onLoadSession}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {liveMode ? (
        <LiveVoiceAI 
          onBack={() => { 
            setLiveMode(false); 
            setInputValue(''); 
            // Sync with chat if session active
            if (internalChatMode) {
              setChatMode(false); // Ensure back to home
            }
          }} 
          selectedModel={selectedModel}
        />
      ) : (
        <div className="w-full max-w-[768px] mb-4">
          <form onSubmit={handleInputSubmit}>
            <div className="relative flex items-center w-full bg-secondary rounded-full py-1 pl-4 sm:pl-6 pr-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-300">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Hesper"
                className="flex-grow bg-transparent text-base md:text-lg text-foreground placeholder-muted-foreground outline-none border-none py-3 px-2 sm:px-4"
              />
              <button
                type="button"
                onClick={() => setLiveMode(true)}
                className="p-2 text-gray-500 hover:text-primary transition-colors"
                title="Start live Hesper talk"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}