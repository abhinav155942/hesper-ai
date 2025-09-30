"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import ChatInterface from "@/components/chat/chat-interface";

export default function LiveVoicePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const recognitionRef = useRef(null);
  const chatRef = useRef(null); // Ref to trigger chat input/send in ChatInterface

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent('/live-voice')}`);
    }
  }, [session, isPending, router]);

  if (isPending || !session?.user) {
    return <div className="flex items-center justify-center h-screen text-foreground">Loading...</div>;
  }

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Voice input not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.success("Listening... Speak now!");
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0];
        if (result.isFinal) {
          final += result.transcript;
        } else {
          interim += result.transcript;
        }
      }

      setTranscript(interim);
      if (final) {
        const fullFinal = finalTranscript + final;
        setFinalTranscript(fullFinal);
        setTranscript('');

        // Send to chat via ref
        if (chatRef.current) {
          chatRef.current.sendVoiceMessage(fullFinal).then(sent => {
            if (sent) {
              setFinalTranscript('');
            } else {
              toast.error('Failed to send voice message');
            }
          });
        }
      }
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      toast.error(`Voice error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-medium text-foreground">Live Voice Talk with Hesper</h1>
        <button
          onClick={toggleRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            isRecording
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          {isRecording ? 'Stop Listening' : 'Start Voice Chat'}
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          ref={chatRef}
          selectedModel="hesper-pro"
          initialMessage=""
          voiceMode={true}
          onVoiceInput={(msg) => console.log('Voice input processed:', msg)} // Optional logging
        />
      </div>
      {transcript && (
        <div className="p-2 bg-muted text-sm text-foreground/80 border-t border-border">
          Listening: {transcript}
        </div>
      )}
    </div>
  );
}