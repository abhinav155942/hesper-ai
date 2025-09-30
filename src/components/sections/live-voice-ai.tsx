import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Mic, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LiveVoiceAIProps {
  onBack: () => void;
}

export default function LiveVoiceAI({ onBack }: LiveVoiceAIProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Uint8Array[]>([]); // Queue for audio chunks
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

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
      // Clean up audio context on disconnect
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Voice chat connection failed");
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "transcript" && data.source === "ai") {
            setResponse(data.text);
            setIsResponding(false);
          } else if (data.type === "response-end") {
            setIsResponding(false);
          } else if (data.type === "error") {
            toast.error(data.message);
            setIsResponding(false);
          }
        } catch (err) {
          console.error('Parse error:', err);
          setIsResponding(false);
        }
      } else {
        // Binary PCM audio chunk from server (16-bit, 16000Hz, mono)
        const pcmData = new Uint8Array(event.data);
        audioQueueRef.current.push(pcmData);
      }
    };

    return () => {
      ws.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // Clear queue
      audioQueueRef.current = [];
    };
  }, []);

  const startRecording = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const audioContext = audioContextRef.current;
      
      inputRef.current = audioContext.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContext.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer.getChannelData(0);
        if (wsRef.current?.readyState === WebSocket.OPEN && isRecording) {
          const pcmData = new Float32Array(inputBuffer);
          // Convert to 16-bit PCM
          const int16Data = new Int16Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            let sample = pcmData[i] * 0x7FFF;
            if (sample < -0x8000) sample = -0x8000;
            if (sample > 0x7FFF) sample = 0x7FFF;
            int16Data[i] = sample;
          }
          wsRef.current.send(int16Data.buffer);
        }
      };

      inputRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContext.destination); // Optional: local echo

      setIsRecording(true);
      setIsResponding(true); // Expecting response
      toast.success("Recording started. Speak now!");
    } catch (err) {
      console.error('Recording start error:', err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsResponding(false);
    toast.success("Recording stopped");
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end-turn' }));
    }

    // Cleanup audio
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    playQueuedAudio(); // Play any remaining audio

    // Cleanup
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (inputRef.current) {
      inputRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const playQueuedAudio = () => {
    if (audioQueueRef.current.length === 0) return;

    // Create a single buffer from all chunks
    const totalLength = audioQueueRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const fullBuffer = new Uint8Array(totalLength);
    let offset = 0;
    audioQueueRef.current.forEach(chunk => {
      fullBuffer.set(chunk, offset);
      offset += chunk.length;
    });

    // Create AudioBuffer for 16-bit PCM, mono, 16000Hz
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const audioBuffer = audioContext.createBuffer(1, totalLength / 2, 16000); // /2 for int16
    const channelData = audioBuffer.getChannelData(0);

    // Convert Uint8Array (little-endian int16) to Float32
    for (let i = 0; i < totalLength; i += 2) {
      const int16 = (fullBuffer[i + 1] << 8) | fullBuffer[i]; // Little-endian
      channelData[i / 2] = int16 / 0x8000; // Normalize to -1 to 1
    }

    // Play
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    audioSourceRef.current = source;

    // Clear queue
    audioQueueRef.current = [];
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
          {isResponding && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Listening...</span>
            </div>
          )}
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