"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [selectedModel, setSelectedModel] = React.useState("Hesper 1.0v");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      // Don't toast in header, just set to 0
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

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-6 font-sans">
      <div className="flex items-center gap-2">
        <span 
          className="text-[22px] font-medium bg-gradient-to-r from-purple-600 via-pink-500 to-teal-500 bg-clip-text text-transparent"
        >
          Hesper
        </span>
        <button
          className="flex items-center gap-1 rounded-md px-3 py-1.5 border border-border bg-background text-sm font-normal text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={() =>
            setSelectedModel((prev) => (prev === "Hesper 1.0v" ? "Hesper pro" : "Hesper 1.0v"))
          }
        >
          {selectedModel}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          Credits: {credits} 💳
        </div>

        <Link
          href="/sign-in"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
};

export default Header;