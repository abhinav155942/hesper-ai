"use client";

import { useState } from "react";
import { HomeClient } from "./home-client";
import LiveVoiceAI from "./LiveVoiceAI";

export function MainClient() {
  const [showLive, setShowLive] = useState(false);

  return (
    <>
      {!showLive ? (
        <HomeClient />
      ) : (
        <LiveVoiceAI />
      )}
      {/* Toggle button can be added to HomeClient if needed */}
    </>
  );
}