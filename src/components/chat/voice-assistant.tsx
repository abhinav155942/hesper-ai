"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Processing audio...");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const response = await fetch("/api/gemini/live", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio: base64Audio,
            config: {
              model: "gemini-2.0-flash-exp",
            },
          }),
        });

        const data = await response.json();

        if (data.success && data.text) {
          addMessage("user", "[Voice input]");
          addMessage("assistant", data.text);
          
          if (audioEnabled) {
            speakText(data.text);
          }
        } else {
          toast.error(data.error || "Failed to process audio");
        }
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendTextMessage = async () => {
    if (!textInput.trim()) return;

    const userMessage = textInput;
    setTextInput("");
    addMessage("user", userMessage);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/gemini/live", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: userMessage,
          config: {
            model: "gemini-2.0-flash-exp",
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.text) {
        addMessage("assistant", data.text);
        
        if (audioEnabled) {
          speakText(data.text);
        }
      } else {
        toast.error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast.error("Failed to speak response");
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [
      ...prev,
      { role, content, timestamp: new Date() },
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-foreground">
            Gemini Live Voice
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Talk naturally with AI assistant
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="flex items-center gap-2"
        >
          {audioEnabled ? (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline">Audio Off</span>
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start recording or type a message to begin</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="space-y-3 border-t pt-4">
        {/* Text Input */}
        <div className="flex gap-2">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message or use voice..."
            className="min-h-[60px] resize-none"
            disabled={isProcessing || isRecording}
          />
          <Button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isProcessing || isRecording}
            size="icon"
            className="h-[60px]"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Voice Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isSpeaking}
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="flex items-center gap-2 min-w-[140px]"
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </Button>

          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <VolumeX className="w-5 h-5" />
              Stop Speaking
            </Button>
          )}
        </div>

        {/* Status Indicators */}
        {(isRecording || isProcessing || isSpeaking) && (
          <div className="text-center text-sm text-muted-foreground">
            {isRecording && (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording...
              </span>
            )}
            {isProcessing && (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            )}
            {isSpeaking && (
              <span className="flex items-center justify-center gap-2">
                <Volume2 className="w-4 h-4" />
                Speaking...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}