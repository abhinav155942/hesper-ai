"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Mic } from 'lucide-react';
import { toast } from "sonner";

export default function MainContent() {
  const [credits, setCredits] = useState(0);
  const actionButtons = [
  "Help me plan",
  "Explain something",
  "Save me time",
  "Help me write"];


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

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-[900px] flex-grow flex flex-col items-center justify-center pt-16 sm:pt-0">
        
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
          {actionButtons.map((action, index) =>
          <button
            key={index}
            className="px-4 py-2 bg-secondary rounded-full text-sm text-secondary-foreground hover:bg-accent transition-colors">

              {action}
            </button>
          )}
        </div>

        <div className="w-full max-w-[768px] mb-4">
          <div className="relative flex items-center w-full bg-secondary rounded-full py-1 pl-6 pr-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-300">
            <input
              type="text"
              placeholder="Ask Hesper"
              className="flex-grow bg-transparent text-base md:text-lg text-foreground placeholder-muted-foreground outline-none border-none py-3" />

            <button className="p-2 rounded-full hover:bg-muted/80 transition-colors" aria-label="Use microphone">
              <Mic className="h-6 w-6 text-foreground/80" />
            </button>
          </div>
        </div>

      </div>
      
      <footer className="w-full max-w-[768px] text-center pb-4 pt-2">
        <p className="text-xs text-muted-foreground">
          <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">Hesper Terms</a> and the <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">Hesper Privacy Policy</a> apply. Hesper can make mistakes, so double-check it.
        </p>
      </footer>
    </div>);

}