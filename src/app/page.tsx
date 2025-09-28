"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Header from "@/components/sections/header";
import Sidebar from "@/components/sections/sidebar";
import NotificationBanner from "@/components/sections/notification-banner";
import MainContent from "@/components/sections/main-content";

export default function Page() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <NotificationBanner />
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} />
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <MainContent />
      </div>
    </div>
  );
}