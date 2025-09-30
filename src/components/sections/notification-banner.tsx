"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-3 text-center text-yellow-800 text-sm md:text-base">
      <div className="flex items-center justify-center gap-2 max-w-[1200px] mx-auto">
        <span role="img" aria-label="Banana emoji">🍌</span>
        <span className="flex-1">Images just got better with Nano Banana. Sign in to try</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 p-1 hover:bg-yellow-200 rounded-full transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}