"use client";

import * as React from "react";
import { ChevronDown, Zap, Brain, Crown, Menu, Mic } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from
"@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
  const [usageOpen, setUsageOpen] = useState(false);
  const router = useRouter();

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
  }, [session]);

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

  const checkSubscription = async () => {
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      setIsSubscribed(false);
      return;
    }

    try {
      const res = await fetch("/api/user/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        const now = Date.now();
        const expiry = data.subscriptionExpiry ? new Date(data.subscriptionExpiry).getTime() : null;
        const isActive = (data.subscriptionPlan === "basic" || data.subscriptionPlan === "pro") && (!expiry || expiry > now);
        setIsSubscribed(isActive);
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setIsSubscribed(false);
    }
  };

  const getModelLimits = (modelId: string) => {
    if (modelId === "hesper-1.0v") {
      return isSubscribed ? "100 messages/day" : "30 messages/day";
    } else if (modelId === "hesper-pro") {
      return isSubscribed ? "50 messages/day" : "3 messages/day";
    }
    return "";
  };

  // Numeric limits for remaining calculation
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
  }];


  const currentModel = models.find((m) => m.id === selectedModel) || models[0];
  const CurrentIcon = currentModel.icon;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error?.code) {
      toast.error(error.code);
      return;
    }
    localStorage.removeItem("bearer_token");
    await refetch();
    router.push("/");
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-2 md:px-4 lg:px-6 font-sans">
      <div className="flex items-center gap-1 md:gap-2">
        {onMenuClick &&
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Menu">

            <Menu className="h-4 w-4 text-foreground" />
          </button>
        }
        <span
          className="text-base md:text-lg lg:text-xl xl:text-[22px] font-medium bg-gradient-to-r from-purple-600 via-pink-500 to-teal-500 bg-clip-text text-transparent">

          Hesper
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 md:gap-1.5 lg:gap-2 rounded-md px-2 py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 border border-border bg-background text-xs md:text-sm font-normal text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring min-w-0 md:min-w-[120px] lg:min-w-[140px] xl:min-w-[160px]">
              <CurrentIcon className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 flex-shrink-0" />
              <span className="hidden xs:inline truncate max-w-[80px] md:max-w-[100px]">{selectedModelDisplay}</span>
              <span className="xs:hidden truncate">Model</span>
              <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 opacity-50 ml-auto flex-shrink-0" />
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
                  isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary'}`
                  }>

                  <div className="flex items-center gap-2 w-full">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="font-medium flex-1">{model.name}</span>
                    <div className="flex items-center gap-2">
                      {model.badge === "Pro" && <Crown className="h-3 w-3 text-amber-500" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                      model.badge === "Pro" ?
                      "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"}`
                      }>
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
                    {!isSubscribed &&
                    <Link
                      href="/checkout"
                      className="text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}>

                        Upgrade
                      </Link>
                    }
                  </div>
                </DropdownMenuItem>);

            })}
            
            <div className="border-t mt-2 pt-2">
              <Link
                href="/about-hesper"
                className="flex items-center gap-2 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors">

                Learn more about Hesper models
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isVoiceMode && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-blue-500 animate-pulse">
              <Mic className="h-4 w-4" />
              <span className="hidden md:inline">Voice Mode Active</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You are in voice mode</p>
          </TooltipContent>
        </Tooltip>
      )}

      <div className="flex items-center gap-1 md:gap-2 lg:gap-3 xl:gap-6">
        <Link
          href="/subscriptions"
          className="hidden xl:block text-sm text-muted-foreground hover:text-primary transition-colors">

          Subscriptions
        </Link>
        <Link
          href="/checkout"
          className="hidden xl:block text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">

          <span className="hidden sm:inline">Credits: </span>{credits}
        </Link>

        {/* View messages info button and popover */}
        <div className="relative flex-shrink-0">
          <button
            className="inline-flex h-7 md:h-8 lg:h-9 items-center justify-center rounded-lg border border-border bg-background px-2 md:px-2.5 lg:px-3 text-xs md:text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 whitespace-nowrap"
            onClick={() => setUsageOpen((o) => !o)}
            onMouseEnter={() => setUsageOpen(true)}
            onMouseLeave={() => setUsageOpen(false)}>

            <span className="hidden md:inline">View messages</span>
            <span className="md:hidden text-xs">Usage</span>
          </button>
          {usageOpen &&
          <div className="absolute right-0 mt-2 w-[280px] rounded-lg border border-border bg-popover p-3 text-sm shadow-md z-50">
              <p className="text-muted-foreground mb-1">Usage based on your credits and plan</p>
              <p className="text-foreground">
                Hesper Pro = {remainingPro} messages remaining / Hesper 1.0v = {remainingV1} messages remaining.
              </p>
            </div>
          }
        </div>

        {session?.user ?
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex h-7 md:h-8 lg:h-9 items-center justify-center rounded-lg border border-border bg-background px-2 md:px-2.5 lg:px-3 text-xs md:text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <span className="max-w-[80px] md:max-w-[120px] lg:max-w-[140px] truncate">{session.user.name || session.user.email}</span>
                <ChevronDown className="ml-0.5 md:ml-1 lg:ml-2 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 opacity-60" />
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
          </DropdownMenu> :

        <Link
          href="/sign-in"
          className="inline-flex h-7 md:h-8 lg:h-9 items-center justify-center rounded-lg bg-primary px-2.5 md:px-3 lg:px-4 xl:px-6 text-xs md:text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-shrink-0">

            Sign in
          </Link>
        }
      </div>
    </header>);

};

export default Header;