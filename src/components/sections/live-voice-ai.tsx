import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Mic, X, Loader2, Volume2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface LiveVoiceAIProps {
  onBack: () => void;
}

export default function LiveVoiceAI({ onBack }: LiveVoiceAIProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [partialResponse, setPartialResponse] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSttSupported(false);
      setError("Speech recognition not supported in this browser. Please use Chrome or Edge.");
      setIsConnecting(false);
      return;
    }

    if (!window.speechSynthesis) {
      setTtsSupported(false);
      setError("Text-to-speech not supported in this browser.");
      setIsConnecting(false);
      return;
    }

    setSttSupported(true);
    setTtsSupported(true);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    synthesisRef.current = window.speechSynthesis;

    const ws = new WebSocket("ws://localhost:3000/api/voice/chat");
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError("");
      toast.success("Connected to Hesper voice chat");
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      if (event.code !== 1000) { // Normal closure
        setError("Connection closed unexpectedly. Please try again.");
        toast.error("Disconnected from voice chat");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection failed. Check your network and try again.");
      setIsConnecting(false);
      toast.error("Voice chat connection failed");
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "response") {
            if (data.final) {
              setResponse(data.text);
              setPartialResponse("");
              speakText(data.text);
            } else {
              setPartialResponse(prev => prev + (data.text || ''));
            }
          } else if (data.type === "response-end") {
            setIsSpeaking(false);
          } else if (data.type === "error") {
            setError(data.message || "An error occurred during response.");
            toast.error(data.message);
            setIsSpeaking(false);
          } else if (data.type === "connected") {
            // Ignore
          }
        } catch (err) {
          console.error('Parse error:', err);
          setError("Failed to process response. Please try again.");
          setIsSpeaking(false);
        }
      }
    };

    // STT event handlers
    recognition.onstart = () => {
      setIsRecording(true);
      setError("");
      toast.success("Listening...");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setTranscript(final);
      if (final) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'transcript', text: final, source: 'user' }));
          setIsSpeaking(true);
        } else {
          setError("Connection lost. Please reconnect.");
        }
      }
      if (interim) {
        setTranscript(prev => prev + interim);
      }
    };

    recognition.onerror = (event) => {
      console.error('STT error:', event.error);
      setIsRecording(false);
      let errorMsg = "Speech recognition error occurred.";
      switch (event.error) {
        case 'not-allowed':
          errorMsg = "Microphone access denied. Please allow microphone permissions.";
          break;
        case 'no-speech':
          // Silent error, no toast
          return;
        case 'audio-capture':
          errorMsg = "No microphone found or access denied.";
          break;
        case 'network':
          errorMsg = "Network error during speech recognition. Check your connection.";
          break;
        default:
          errorMsg = `Speech recognition error: ${event.error}`;
      }
      setError(errorMsg);
      toast.error(errorMsg);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Auto-restart for continuous listening if needed
      // recognition.start(); // Uncomment for continuous mode, but requires permission handling
    };

    // Timeout for connection
    const timeout = setTimeout(() => {
      if (isConnecting) {
        setError("Connection timeout. Please check your network.");
        setIsConnecting(false);
        toast.error("Connection timed out");
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
      ws.close();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!sttSupported) {
      toast.error("Speech recognition not supported");
      return;
    }
    if (recognitionRef.current) {
      try {
        // Request microphone permission if needed
        await navigator.mediaDevices.getUserMedia({ audio: true }).catch((err) => {
          throw new Error("Microphone permission denied");
        });
        recognitionRef.current.start();
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end-turn' }));
    }
    setError("");
  };

  const speakText = (text: string) => {
    if (!ttsSupported) {
      toast.error("Text-to-speech not supported");
      return;
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onerror = (event) => {
        console.error('TTS error:', event.error);
        setError("Failed to play audio response.");
        toast.error("Failed to play response");
        setIsSpeaking(false);
      };
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synthesisRef.current.speak(utterance);
    }
  };

  const reconnect = () => {
    setError("");
    setIsConnecting(true);
    // Trigger useEffect re-run or manual WS reconnect
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  if (!sttSupported || !ttsSupported) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p>{error}</p>
          <button onClick={onBack} className="mt-4 text-primary hover:underline">Back to chat</button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p>Connecting to Hesper voice chat...</p>
          <button onClick={onBack} className="mt-4 text-primary hover:underline">Back to chat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center items-center p-4 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <button onClick={onBack} className="p-2 text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold text-foreground">Live Hesper Talk</h2>
        <div className="w-8" />
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full max-w-md mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button onClick={reconnect} className="ml-auto text-xs underline">Retry</button>
          </div>
        </div>
      )}

      {/* Mic Button */}
      <div className={`p-4 rounded-lg mb-6 ${isRecording ? 'bg-red-100 border-red-200' : 'bg-muted'}`}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected || isConnecting}
          className={`p-4 rounded-full transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <Mic className="h-6 w-6 animate-pulse" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>
        <p className={`mt-2 text-sm text-center ${
          isRecording ? 'text-red-600' : 'text-muted-foreground'
        }`}>
          {isRecording ? 'Listening...' : isConnected ? 'Tap to talk to Hesper' : 'Connecting...'}
        </p>
      </div>

      {/* Status */}
      {isSpeaking && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground animate-pulse">
          <Volume2 className="h-4 w-4" />
          <span>Hesper is speaking...</span>
        </div>
      )}

      {/* Transcript */}
      <div className="w-full max-w-md space-y-4">
        {transcript && (
          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
            <p className="font-semibold text-blue-800 mb-1">You:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {(partialResponse || response) && (
          <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
            <p className="font-semibold text-green-800 mb-1">Hesper:</p>
            <p className="text-sm">
              {partialResponse || response}
              {partialResponse && <span className="text-xs text-muted-foreground"> (streaming...)</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}