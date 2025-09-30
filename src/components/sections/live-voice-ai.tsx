import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Mic, X } from "lucide-react";
import { toast } from "sonner";

interface LiveVoiceAIProps {
  onBack: () => void;
}

export default function LiveVoiceAI({ onBack }: LiveVoiceAIProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/api/voice/chat");
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      toast.success("Connected to voice chat");
    };

    ws.onclose = () => {
      setIsConnected(false);
      toast.error("Disconnected from voice chat");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Voice chat connection failed");
    };

    ws.onmessage = (event) => {
      // Handle incoming messages: could be STT transcript or TTS audio
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transcript") {
          setTranscript(data.text);
        } else if (data.type === "response") {
          setResponse(data.text);
          // Handle audio if sent
          if (data.audio) {
            const audioBlob = new Blob([data.audio], { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
          }
        }
      } catch (err) {
        // If not JSON, might be binary audio
        const audioBlob = new Blob([event.data], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus"
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then(buffer => {
            wsRef.current?.send(JSON.stringify({
              type: "audio",
              data: Array.from(new Uint8Array(buffer))
            }));
          });
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(250); // Send chunks every 250ms
      setIsRecording(true);
      toast.success("Recording started. Speak now!");
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
      // Send end signal
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "end-audio" }));
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p>Connecting to voice chat...</p>
          <button onClick={onBack} className="mt-4 text-blue-500">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center items-center p-4">
      <div className="flex items-center justify-between w-full max-w-md mb-8">
        <button onClick={onBack} className="p-2">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold">Live Voice Chat</h2>
        <div />
      </div>

      <div className="w-full max-w-md space-y-4 text-center">
        <div className={`p-4 rounded-lg ${isRecording ? "bg-red-100" : "bg-gray-100"}`}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full ${isRecording ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}
          >
            <Mic className="h-6 w-6" />
          </button>
          <p className="mt-2">{isRecording ? "Recording..." : "Tap to speak"}</p>
        </div>

        {transcript && (
          <div className="bg-blue-50 p-3 rounded">
            <p className="font-semibold">You:</p>
            <p>{transcript}</p>
          </div>
        )}

        {response && (
          <div className="bg-green-50 p-3 rounded">
            <p className="font-semibold">Hesper:</p>
            <p>{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}