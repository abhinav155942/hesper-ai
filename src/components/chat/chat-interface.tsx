"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Zap, Brain, Crown, Menu, Plus, Settings, Info, Smartphone, CreditCard, Building, Mic, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession, authClient } from "@/lib/auth-client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  selectedModel?: "hesper-1.0v" | "hesper-pro";
  onBack?: () => void;
  initialMessage?: string;
  onModelChange?: (model: "hesper-1.0v" | "hesper-pro") => void;
}

export default function ChatInterface({
  selectedModel: initialModel = "hesper-1.0v",
  onBack,
  initialMessage = "",
  onModelChange: externalOnModelChange,
}: ChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState<"hesper-1.0v" | "hesper-pro">(initialModel);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState(!!initialMessage || false);
  const [credits, setCredits] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    fetchCredits();
    checkSubscription();
  }, [session]);

  useEffect(() => {
    externalOnModelChange?.(selectedModel);
  }, [selectedModel, externalOnModelChange]);

  const fetchCredits = async () => {
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      setCredits(0);
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
        setCredits(0);
      }
    } catch (err) {
      toast.error("Failed to fetch credits");
      setCredits(0);
    }
  };

  const checkSubscription = () => {
    const subscription = localStorage.getItem("subscription_status");
    setIsSubscribed(subscription === "active");
  };

  const getModelLimits = (modelId: string) => {
    if (modelId === "hesper-1.0v") {
      return isSubscribed ? "100 messages/day" : "30 messages/day";
    } else if (modelId === "hesper-pro") {
      return isSubscribed ? "50 messages/day" : "3 messages/day";
    }
    return "";
  };

  const limitPro = isSubscribed ? 50 : 3;
  const limitV1 = isSubscribed ? 100 : 30;
  const remainingPro = Math.max(0, Math.min(credits, limitPro));
  const remainingV1 = Math.max(0, Math.min(credits, limitV1));

  const models = [
    {
      id: "hesper-1.0v" as const,
      name: "Hesper 1.0v",
      icon: Zap,
      description: "Fast responses, general AI assistance",
      limits: getModelLimits("hesper-1.0v"),
      badge: "Free"
    },
    {
      id: "hesper-pro" as const,
      name: "Hesper Pro", 
      icon: Brain,
      description: "Advanced reasoning & research capabilities",
      limits: getModelLimits("hesper-pro"),
      badge: "Pro"
    }
  ];

  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setChatMode(true);

    try {
      const res = await fetch("/api/hesper/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, model: selectedModel }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get response");
      }

      const data = await res.json();

      // Handle both array and object
      const aiContent = Array.isArray(data) ? (data as string[])[0] : (data as { message?: string }).message;
      const aiMessage: Message = { role: "assistant", content: aiContent || "No response" };
      setMessages((prev) => [...prev, aiMessage]);

      // Refresh credits after response
      fetchCredits();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleActionButtonClick = (action: string) => {
    setInputValue(action);
    sendMessage(action);
  };

  const handleBackToHome = () => {
    setChatMode(false);
    setMessages([]);
    setInputValue("");
    onBack?.();
  };

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
      return;
    }
    localStorage.removeItem("bearer_token");
    await refetch();
    toast.success("Signed out successfully");
  };

  const isMobile = window.innerWidth < 768; // Simple mobile check

  if (!chatMode) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:px-6 font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-medium bg-gradient-to-r from-purple-600 via-pink-500 to-teal-500 bg-clip-text text-transparent">
              Hesper
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {!session?.user && (
              <Link
                href="/sign-in"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 md:px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* Main Content - Home View */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-[900px] flex flex-col items-center justify-center">
            <div className="text-center mb-10 w-full">
              <h1 className="font-['Google_Sans'] font-normal text-5xl sm:text-[56px] leading-[1.15] text-foreground/80">
                Meet <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">Hesper,</span>
              </h1>
              <h2 className="font-['Google_Sans'] font-normal text-5xl sm:text-[56px] leading-[1.15] text-foreground/80 mt-1">
                your <span className="bg-gradient-to-r from-[#5f3dc4] via-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">personal AI assistant</span>
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-8 w-full max-w-[768px]">
              {["Help me plan", "Explain something", "Save me time", "Help me write"].map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionButtonClick(action)}
                  className="px-4 py-2 bg-secondary rounded-full text-sm text-secondary-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="w-full max-w-[768px] mb-4">
              <form onSubmit={handleSubmit}>
                <div className="relative flex items-center w-full bg-secondary rounded-full py-1 pl-6 pr-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-300">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask Hesper"
                    className="flex-grow bg-transparent text-base md:text-lg text-foreground placeholder-muted-foreground outline-none border-none py-3"
                    onKeyDown={handleKeyDown}
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
        </div>

        <footer className="w-full max-w-[768px] text-center pb-4 pt-2 mx-auto">
          <p className="text-xs text-muted-foreground">
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">Hesper Terms</a> and the <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">Hesper Privacy Policy</a> apply. Hesper can make mistakes, so double-check it.
          </p>
        </footer>
      </div>
    );
  }

  // Chat Mode Layout
  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <TooltipProvider delayDuration={0}>
        <aside className={`bg-sidebar-background p-2 transition-all duration-300 ease-in-out flex flex-col ${isMobile ? (sidebarOpen ? "fixed inset-y-0 left-0 z-50 w-full" : "hidden") : (sidebarOpen ? "w-[280px]" : "w-[72px]")}`}>
          <div className={`mb-4 flex h-[56px] items-center ${sidebarOpen ? "justify-start ml-1" : "justify-center"}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-12 w-12 rounded-full text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand menu</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className={`flex ${sidebarOpen ? "justify-start" : "justify-center"}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex h-14 items-center justify-start rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent/90 ${sidebarOpen ? "w-auto px-4" : "w-14 justify-center px-0"}`}
                  onClick={handleBackToHome}
                >
                  <Plus className="h-6 w-6" />
                  {sidebarOpen && <span className="ml-4 whitespace-nowrap">New chat</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && <TooltipContent side="right"><p>New chat</p></TooltipContent>}
            </Tooltip>
          </div>

          <div className="mt-6 flex flex-col space-y-2">
            {[
              { icon: Info, label: "About Hesper", href: "/about-hesper" },
              { icon: Smartphone, label: "Hesper App", href: "#" },
              { icon: CreditCard, label: "Subscriptions", href: "/subscriptions" },
              { icon: Building, label: "For Business", href: "#" },
              { icon: CreditCard, label: "Checkout", href: "/checkout" },
            ].map((link, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link href={link.href}>
                    <Button
                      variant="ghost"
                      className={`flex h-12 items-center text-sidebar-foreground transition-all duration-300 hover:bg-sidebar-accent ${sidebarOpen ? "w-full justify-start px-4" : "w-12 justify-center px-0"}`}
                    >
                      <link.icon className="h-5 w-5" />
                      {sidebarOpen && (
                        <span className="ml-3 whitespace-nowrap text-sm font-medium">
                          {link.label}
                        </span>
                      )}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && <TooltipContent side="right"><p>{link.label}</p></TooltipContent>}
              </Tooltip>
            ))}
          </div>

          <div className={`flex-1 transition-opacity ${sidebarOpen ? "animate-in fade-in-0 duration-500" : "opacity-0 pointer-events-none"}`}>
            {sidebarOpen && (
              <div className="mt-8 h-full overflow-y-auto px-2 text-left">
                <h2 className="px-2 text-base font-medium text-foreground mb-4 font-['Google_Sans']">Recent</h2>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-col items-center space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex h-14 items-center rounded-full text-sidebar-foreground transition-all duration-300 hover:bg-sidebar-accent ${sidebarOpen ? "w-full justify-start px-4" : "w-14 justify-center px-0"}`}
                >
                  <Settings className="h-6 w-6" />
                  {sidebarOpen && <span className="ml-4 whitespace-nowrap font-['Google_Sans']">Settings</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && <TooltipContent side="right"><p>Settings</p></TooltipContent>}
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>

      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:px-6 font-sans shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBackToHome} className="h-8 w-8 md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
            <span className="text-[22px] font-medium bg-gradient-to-r from-purple-600 via-pink-500 to-teal-500 bg-clip-text text-transparent">
              Hesper
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-3 py-2 border border-border bg-background text-sm font-normal text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px] md:min-w-[160px]">
                  <currentModel.icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{currentModel.name}</span>
                  <span className="sm:hidden">{currentModel.name.split(' ')[1]}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[280px] md:w-[320px] p-2">
                {models.map((model) => {
                  const isSelected = selectedModel === model.id;
                  return (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`flex flex-col items-start gap-2 p-3 cursor-pointer rounded-md transition-colors ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary'}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <model.icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium flex-1">{model.name}</span>
                        <div className="flex items-center gap-2">
                          {model.badge === "Pro" && <Crown className="h-3 w-3 text-amber-500" />}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${model.badge === "Pro" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                            {model.badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {model.description}
                      </p>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-muted-foreground">
                          {model.limits}
                        </span>
                        {!isSubscribed && (
                          <Link 
                            href="/checkout" 
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Upgrade
                          </Link>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <div className="border-t mt-2 pt-2">
                  <Link 
                    href="/about-hesper"
                    className="flex items-center gap-2 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Learn more about Hesper models
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Link
              href="/subscriptions"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="hidden sm:inline">Subscriptions</span>
            </Link>
            <Link
              href="/checkout"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="hidden sm:inline">Credits:</span> {credits}
            </Link>

            <div className="relative">
              <button
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => {
                  // Toggle usage info - simple inline for brevity
                  toast.info(`Hesper Pro: ${remainingPro} remaining / Hesper 1.0v: ${remainingV1} remaining`);
                }}
              >
                View messages
              </button>
            </div>

            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <span className="max-w-[140px] truncate">{session.user.name || session.user.email}</span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1">
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 md:px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => toast.info("Sign in to continue chatting")}
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* Notification Banner */}
        {showNotification && (
          <div className="w-full bg-yellow-100 border-b border-yellow-200 p-3 flex items-center justify-between">
            <span className="text-sm text-yellow-800">🍌 Images just got better with Nano Banana. Sign in to try</span>
            <Button variant="ghost" size="icon" onClick={() => setShowNotification(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                Hesper is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border flex space-x-2 bg-card shrink-0">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 border border-input rounded-md px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="px-4"
            disabled={!inputValue.trim() || isLoading}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}