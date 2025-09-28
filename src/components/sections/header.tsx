"use client";

import * as React from "react";
import { ChevronDown, Zap, Brain, Crown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, authClient } from "@/lib/auth-client";

interface HeaderProps {
  onMenuClick?: () => void;
  selectedModel: 'hesper-1.0v' | 'hesper-pro';
  onModelChange: (model: 'hesper-1.0v' | 'hesper-pro') => void;
}

const Header = ({ onMenuClick, selectedModel, onModelChange }: HeaderProps) => {
  const [selectedModelDisplay, setSelectedModelDisplay] = React.useState("Hesper 1.0v");
  const [credits, setCredits] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { data: session, isPending, refetch } = useSession();

  // Update display name when selectedModel changes
  useEffect(() => {
    if (selectedModel === 'hesper-1.0v') {
      setSelectedModelDisplay("Hesper 1.0v");
    } else {
      setSelectedModelDisplay("Hesper Pro");
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchCredits();
    checkSubscription();
  }, []);

  // Trigger unverified users cleanup once per 24h
  useEffect(() => {
    const key = "cleanup_unverified_last_run";
    const last = localStorage.getItem(key);
    const now = Date.now();
    if (!last || now - Number(last) > 24 * 60 * 60 * 1000) {
      fetch("/api/cleanup/unverified", { method: "DELETE" }).finally(() => {
        localStorage.setItem(key, String(now));
      });
    }
  }, []);

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
    // Mock subscription check - replace with actual logic
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
  const CurrentIcon = currentModel.icon;

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
      return;
    }
    localStorage.removeItem("bearer_token");
    await refetch();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 md:px-6 font-sans">
      <div className="flex items-center gap-2">
        <span 
          className="text-[22px] font-medium bg-gradient-to-r from-purple-600 via-pink-500 to-teal-500 bg-clip-text text-transparent"
        >
          Hesper
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-3 py-2 border border-border bg-background text-sm font-normal text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px] md:min-w-[160px]">
              <CurrentIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">{selectedModelDisplay}</span>
              <span className="sm:hidden truncate">{currentModel.name.split(' ')[1]}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px] md:w-[320px] p-2">
            {models.map((model) => {
              const Icon = model.icon;
              const isSelected = selectedModel === model.id;
              
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className={`flex flex-col items-start gap-2 p-3 cursor-pointer rounded-md transition-colors ${
                    isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="font-medium flex-1">{model.name}</span>
                    <div className="flex items-center gap-2">
                      {model.badge === "Pro" && <Crown className="h-3 w-3 text-amber-500" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        model.badge === "Pro" 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-green-100 text-green-700"
                      }`}>
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
          >
            <span className="hidden sm:inline">Sign in</span>
            <span className="sm:inline md:hidden">Sign in</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;