"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Mic } from 'lucide-react';
import { toast } from "sonner";
import ChatInterface from "@/components/chat/chat-interface";

interface MainContentProps {
  selectedModel?: 'hesper-1.0v' | 'hesper-pro';
  chatMode?: boolean;
  onChatModeChange?: (mode: boolean) => void;
  chatKey?: number;
}

export default function MainContent({ 
  selectedModel = 'hesper-1.0v',
  chatMode: externalChatMode,
  onChatModeChange,
  chatKey 
}: MainContentProps) {
  const [internalChatMode, setInternalChatMode] = useState(externalChatMode || false);
  const [inputValue, setInputValue] = useState("");
  const [credits, setCredits] = useState(0);

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
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-[900px] flex flex-col items-center justify-center">
        
        <div className="text-center mb-6 sm:mb-10 w-full">
          <h1 className="font-['Google_Sans'] font-normal text-4xl sm:text-5xl md:text-[56px] leading-[1.15] text-foreground/80">
            Meet <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">Hesper,</span>
          </h1>
          <h2 className="font-['Google_Sans'] font-normal text-4xl sm:text-5xl md:text-[56px] leading-[1.15] text-foreground/80 mt-1">
            your <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">personal AI assistant</span>
          </h2>
        </div>

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
                className="p-2 rounded-full hover:bg-muted/80 transition-colors" 
                aria-label="Use microphone"
              >
                <Mic className="h-6 w-6 text-foreground/80" />
              </button>
            </div>
          </form>
        </div>

      </div>
      
      <footer className="w-full max-w-[768px] text-center pb-4 pt-2">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <a href="#" target="_blank" rel="noopener noreferrer" className="inline-block px-2 hover:underline">Hesper Terms</a> and the <a href="#" target="_blank" rel="noopener noreferrer" className="inline-block px-2 hover:underline">Hesper Privacy Policy</a> apply. Hesper can make mistakes, so double-check it.
        </p>
      </footer>
    </div>
  );
}