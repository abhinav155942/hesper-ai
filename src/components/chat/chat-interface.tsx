"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Send, Mic, RotateCcw, Copy, ThumbsUp, ThumbsDown, Zap, Brain, ChevronDown } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const N8N_WEBHOOK_URL = "/api/hesper/chat";

async function fetchN8nReply(message: string, model: string): Promise<string> {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message,
        model 
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(errorText || `Webhook error: ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return (
        data.reply || data.message || data.text || data.content || JSON.stringify(data)
      );
    }
    return await res.text();
  } catch (err: any) {
    throw new Error(err?.message || "Failed to contact chat service");
  }
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  modelName?: string; // freeze display name per message
}

interface ChatInterfaceProps {
  selectedModel: 'hesper-1.0v' | 'hesper-pro';
  onBack: () => void;
  initialMessage?: string;
}

export default function ChatInterface({ selectedModel, onBack, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
    setHasNewMessages(false);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    const increased = messages.length > prevCountRef.current;
    if (isNearBottom) {
      scrollToBottom();
    } else {
      setShowScrollButton(true);
      if (increased) setHasNewMessages(true);
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();

    // Handle initial message
    if (initialMessage && messages.length === 0) {
      handleInitialMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      setShowScrollButton(!atBottom);
      if (atBottom) setHasNewMessages(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleInitialMessage = async (message: string) => {
    const currentModelName = selectedModel === 'hesper-pro' ? "Hesper Pro" : "Hesper";
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages([userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      type: 'assistant',
      content: "",
      timestamp: new Date(),
      isTyping: true,
      modelName: currentModelName
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const reply = await fetchN8nReply(message, selectedModel);

      // Remove typing indicator and add response
      setMessages((prev) => prev.filter((m) => !m.isTyping));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: reply || "",
        timestamp: new Date(),
        modelName: currentModelName
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages([userMessage]);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const currentModelName = selectedModel === 'hesper-pro' ? 'Hesper Pro' : 'Hesper';

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      type: 'assistant',
      content: "",
      timestamp: new Date(),
      isTyping: true,
      modelName: currentModelName
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const reply = await fetchN8nReply(userMessage.content, selectedModel);

      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => !m.isTyping));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: reply || "",
        timestamp: new Date(),
        modelName: currentModelName
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => !m.isTyping));
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    addMessage("user", message);
    setIsLoading(true);

    try {
      const res = await fetch("/api/hesper/chat", {
        method: "POST",
        body: message
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to send message");
        if (error.includes("Insufficient credits")) {
          router.push("/subscribe");
        }
        return;
      }

      const { response } = await res.json();
      addMessage("assistant", response);
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: `${type}-${Date.now()}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, message]);
  };

  const generateModelResponse = (userInput: string, model: string): string => {
    if (model === 'hesper-pro') {
      return `*Analyzing your request...*

I understand you're asking about "${userInput}". Let me think through this systematically:

**Research Phase:**
- Analyzing context and implications
- Considering multiple perspectives
- Cross-referencing relevant information

**Reasoning Phase:**
- Evaluating potential approaches
- Weighing pros and cons
- Formulating comprehensive response

**Response:**
This is a thoughtful response from Hesper Pro. I've taken time to research and reason through your query to provide you with the most accurate and helpful information possible. The Pro model allows me to dive deeper into complex topics and provide more nuanced, well-researched answers.

Would you like me to explore any specific aspect of this topic in more detail?`;
    } else {
      return `Thanks for your message! This is a quick response from Hesper. I'm designed to provide fast, helpful responses to your everyday questions and tasks.

Your input: "${userInput}"

I'm here to help with a wide range of tasks including answering questions, helping with writing, providing explanations, and assisting with various everyday needs. Feel free to ask me anything!`;
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages].reverse().find((m) => m.type === 'user');
    if (lastUserMessage) {
      // Remove last assistant response and regenerate
      setMessages((prev) => prev.filter((m) => m.id !== messages[messages.length - 1].id));
      setInputValue(lastUserMessage.content);
      handleSubmit(new Event('submit') as any);
    }
  };

  const getModelInfo = () => {
    if (selectedModel === 'hesper-pro') {
      return {
        icon: <Brain className="h-4 w-4" />,
        name: "Hesper Pro", // new display name going forward
        description: "Advanced reasoning model"
      };
    } else {
      return {
        icon: <Zap className="h-4 w-4" />,
        name: "Hesper", // changed from "Hesper Core"
        description: "Fast general AI model"
      };
    }
  };

  const modelInfo = getModelInfo();

  // Typing timer that counts up indefinitely while visible
  const TypingTimer: React.FC = () => {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
      const start = Date.now();
      const id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(id);
    }, []);

    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");

    return (
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground font-mono animate-pulse" role="status" aria-live="polite">
        <span>runtime:</span>
        <span>{mm}:{ss}</span>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col min-h-[100dvh] w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors">

          ← Back to homepage
        </button>
        
        <div className="flex items-center gap-2 text-sm">
          {modelInfo.icon}
          <span className="font-medium">{modelInfo.name}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{modelInfo.description}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-28"
        role="log"
        aria-live="polite">

        {messages.length === 0 &&
        <div className="text-center py-12">
            <div className="mb-4">
              {modelInfo.icon}
            </div>
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Ask me anything! I'm here to help with questions, tasks, and creative projects.
            </p>
          </div>
        }

        {messages.map((message, idx) =>
        <div key={message.id} className="w-full">
            {idx > 0 && <div className="h-px bg-border my-4" />}
            {message.type === 'assistant' &&
          <div className="flex items-center gap-2 mb-2">
                {modelInfo.icon}
                <span className="text-sm font-medium text-muted-foreground !w-20 !h-full !whitespace-pre-line">{message.modelName ?? modelInfo.name}</span>
              </div>
          }
            <div>
              {message.isTyping ?
            <div className="flex items-center gap-1" role="status" aria-live="polite">
                  <TypingTimer />
                </div> :

            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {message.content}
                </div>
            }
            </div>

            {message.type === 'assistant' && !message.isTyping &&
          <div className="flex items-center gap-2 mt-2">
                <button
              onClick={() => handleCopy(message.content)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Copy">

                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
              onClick={handleRegenerate}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Regenerate">

                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Good response">
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Bad response">
                  <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
          }
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton &&
      <button
        onClick={scrollToBottom}
        className="absolute bottom-28 right-4 z-10 inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-2 shadow hover:bg-secondary transition-colors">

          {hasNewMessages ?
        <span className="text-xs text-muted-foreground">New messages</span> :

        <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
        </button>
      }

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-3 bg-secondary rounded-full py-1.5 pl-6 pr-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask ${modelInfo.name}...`}
              disabled={isLoading}
              className="flex-grow bg-transparent text-base text-foreground placeholder-muted-foreground outline-none border-none py-3 disabled:opacity-50" />

            
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2.5 rounded-full hover:bg-muted/80 transition-colors"
                aria-label="Use microphone">

                <Mic className="h-5 w-5 text-muted-foreground" />
              </button>
              
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message">

                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
        
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            {selectedModel === 'hesper-pro' ?
            "Pro model provides deeper analysis and research-backed responses" :
            "Fast responses for everyday questions and tasks"
            }
          </p>
        </div>
      </div>
    </div>);

}