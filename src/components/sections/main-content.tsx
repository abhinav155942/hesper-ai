"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mic } from 'lucide-react';
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/chat/chat-interface";

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
  const [isRecording, setIsRecording] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [settings, setSettings] = useState(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { data: session } = useSession();
  const name = session?.user?.name?.split(' ')[0] || 'Friend';
  const isSignedIn = !!session?.user && !!name;

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

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchSettings = async () => {
      const token = localStorage.getItem("bearer_token");
      if (!token) return;
      try {
        const res = await fetch("/api/settings/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          // Check if basic info filled: name in session, and any email provider config
          const basicFilled = !!session?.user?.name && (
            data.smtp_username || data.smtp_host || data.sendgrid_domain_email || data.mailgun_domain_email
          ) && (data.email_tone || data.user_name || data.business_description);
          setShowNote(!basicFilled);
        }
      } catch (err) {
        console.error('Failed to fetch settings for note', err);
      }
    };
    fetchSettings();
  }, [session]);

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

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.success("Listening... Speak now!");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please allow access and try again.");
      } else {
        toast.error("Voice input failed. Please try again.");
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
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
      </div>);

  }

  return (
    <div className="h-full flex flex-col justify-between px-4">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[900px] flex flex-col items-center justify-center">
          
          <div className="text-center mb-6 sm:mb-10 w-full">
            {isSignedIn ? (
              <>
                <h1 className="font-['Google_Sans'] font-normal text-4xl sm:text-5xl md:text-[56px] leading-[1.15] text-foreground/80">
                  Hi <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">{name},</span>
                </h1>
                <h2 className="font-['Google_Sans'] font-normal text-4xl sm:text-5xl md:text-[56px] leading-[1.15] text-foreground/80 mt-1">
                  <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">{selectedModel === 'hesper-pro' ? 'Ready to finish a task?' : "what's the agenda today?"}</span>
                </h2>
              </>
            ) : (
              <>
                <h1 className="font-['Google_Sans'] font-normal text-4xl sm:text-5xl md:text-[56px] leading-[1.15] text-foreground/80">
                  Meet <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">{selectedModel === 'hesper-pro' ? 'Hesper Agent' : 'Hesper'},</span>
                </h1>
                <h2 className="font-['Google_Sans'] font-normal text-4xl sm:text-5xl md:text-[56px] leading-[1.15] text-foreground/80 mt-1">
                  your <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">{selectedModel === 'hesper-pro' ? 'personal AI Agent' : 'personal AI assistant'}</span>
                </h2>
              </>
            )}
          </div>

          {isSignedIn && showNote && (
            <div className="mb-6 p-4 bg-secondary rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">To get the best results, finish configuring all your settings.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">Complete Settings</Link>
              </Button>
            </div>
          )}

          <div className="w-full max-w-[768px] mb-4">
            <form onSubmit={handleInputSubmit}>
              <div className="relative flex items-center w-full bg-secondary rounded-full py-1 pl-4 sm:pl-6 pr-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-300">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Hesper"
                  className="flex-grow bg-transparent text-base md:text-lg text-foreground placeholder-muted-foreground outline-none border-none py-3 px-2 sm:px-4" />


                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isRecording}
                  className={`p-2 rounded-full transition-colors ${isRecording ? 'animate-pulse bg-primary/10 text-primary' : 'hover:bg-muted/80'}`}
                  aria-label={isRecording ? "Stop microphone" : "Use microphone"}>

                  <Mic className={`h-6 w-6 ${isRecording ? 'text-primary' : 'text-foreground/80'}`} />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
      
      <footer className="w-full max-w-[768px] text-center pb-4 pt-2">
        <p className="text-xs leading-relaxed text-muted-foreground mx-auto max-w-[500px]">
          <a href="/terms" className="px-2 hover:underline text-primary">Terms and Conditions</a>,
          <a href="/privacy" className="px-2 hover:underline text-primary">Privacy Policy</a>, and
          <a href="/terms" className="px-2 hover:underline text-primary">Disclaimer</a> apply. Hesper can make mistakes, so double-check it.
        </p>
      </footer>
    </div>);

}