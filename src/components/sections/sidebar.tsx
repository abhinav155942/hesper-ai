"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, Plus, Settings, Info, Smartphone, CreditCard, Building } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  onNewChat?: () => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, isMobile, onNewChat }: SidebarProps) {
  let sidebarClasses = "bg-card p-2 transition-all duration-300 ease-in-out overflow-y-auto";
  const hClasses = isMobile ? "h-screen" : "h-full";
  const wClasses = sidebarOpen ? (isMobile ? "w-full" : "w-[280px]") : "w-[72px]";
  
  sidebarClasses += ` ${hClasses}`;
  sidebarClasses += ` ${wClasses}`;

  if (isMobile) {
    if (sidebarOpen) {
      sidebarClasses += " fixed inset-y-0 left-0 z-50 flex flex-col";
    } else {
      sidebarClasses += " hidden";
    }
  } else {
    sidebarClasses += " flex flex-col";
  }

  const navigationLinks = [
    { icon: Info, label: "About Hesper", href: "/about-hesper" },
    { icon: Smartphone, label: "Hesper App", href: "#" },
    { icon: CreditCard, label: "Subscriptions", href: "#" },
    { icon: Building, label: "For Business", href: "#" },
    { icon: CreditCard, label: "Checkout", href: "/checkout" },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={sidebarClasses}>
        <div
          className={`mb-3 sm:mb-4 flex h-[56px] items-center ${
            sidebarOpen ? "justify-start ml-1" : "justify-center"
          } min-h-[44px]`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-12 w-12 rounded-full text-sidebar-foreground hover:bg-sidebar-accent min-h-[44px] min-w-[44px]"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle sidebar</span>
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
                className={`flex h-14 items-center justify-start rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent/90 ${
                  sidebarOpen
                    ? "w-auto px-4"
                    : "w-14 justify-center px-0"
                }`}
                onClick={onNewChat}
              >
                <Plus className="h-6 w-6" />
                {sidebarOpen && (
                  <span className="ml-4 whitespace-nowrap">New chat</span>
                )}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                <p>New chat</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col space-y-2">
          {navigationLinks.map((link, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Link 
                  href={link.href}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={`flex h-12 items-center text-sidebar-foreground transition-all duration-300 hover:bg-sidebar-accent min-h-[44px] ${
                      sidebarOpen
                        ? "w-full justify-start px-3 sm:px-4"
                        : "w-12 justify-center px-0"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {sidebarOpen && (
                      <span className="ml-2 sm:ml-3 whitespace-nowrap text-sm font-medium truncate">
                        {link.label}
                      </span>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">
                  <p>{link.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>

        <div
          className={`flex-1 transition-opacity ${
            sidebarOpen
              ? "animate-in fade-in-0 duration-500"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {sidebarOpen && (
            <div className="mt-8 h-full overflow-y-auto px-2 text-left">
              <h2 className="px-2 text-base font-medium text-foreground mb-4 font-['Google_Sans']">
                Recent
              </h2>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col items-center space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`flex h-14 items-center rounded-full text-sidebar-foreground transition-all duration-300 hover:bg-sidebar-accent ${
                  sidebarOpen
                    ? "w-full justify-start px-4"
                    : "w-14 justify-center px-0"
                }`}
              >
                <Settings className="h-6 w-6" />
                {sidebarOpen && (
                  <span className="ml-4 whitespace-nowrap font-['Google_Sans']">
                    Settings
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}