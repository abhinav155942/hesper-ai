"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, MessageCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

function float32ToInt16(buffer: Float32Array): Int16Array {
  const len = buffer.length;
  const result = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    result[i] = Int16Array.from([s < 0 ? s * 0x8000 : s * 0x7FFF])[0];
  }
  return result;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function LiveVoiceAI() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string; }[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');
    websocket.onopen = () => setWs(websocket);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ai_text') {
        setMessages(prev => [...prev, { role: 'ai', content: data.text }]);
      } else if (data.type === 'ai_audio') {
        const buffer = base64ToArrayBuffer(data.data);
        audioContextRef.current?.decodeAudioData(buffer.slice(44), (audioBuffer) => { // Skip WAV header
          audioQueueRef.current.push(audioBuffer);
          playNextAudio();
        }); // Assume WAV for simplicity; adjust if raw PCM
      }
    };
    return () => websocket.close();
  }, []);

  const playNextAudio = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) return;
    const audioBuffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = playNextAudio;
    source.start();
    sourceRef.current = source;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SAMPLE_RATE, channelCount: CHANNELS } });
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, CHANNELS, CHANNELS);
      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN || !isRecording) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcmData = float32ToInt16(Float32Array.from(input));
        const buffer = pcmData.buffer;
        const base64Audio = arrayBufferToBase64(buffer);
        ws.send(JSON.stringify({ type: 'audio_chunk', data: base64Audio, mimeType: `audio/L16;rate=${SAMPLE_RATE}`, isEndOfTurn: false }));
      };
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      setIsRecording(true);
      setMessages(prev => [...prev, { role: 'user', content: 'Started speaking...' }]);
    } catch (error) {
      console.error('Mic access denied:', error);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'audio_chunk', isEndOfTurn: true })); // End turn
    }
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-6 border-b border-border">
        <CardTitle className="text-2xl font-medium text-foreground">Live Voice with Hesper</CardTitle>
        <p className="text-muted-foreground">Talk to Hesper in real-time</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-border bg-background">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={startRecording}
            disabled={isRecording}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
          >
            <Mic className="h-4 w-4" />
            <span>Start Voice</span>
          </Button>
          <Button
            onClick={stopRecording}
            disabled={!isRecording}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <StopCircle className="h-4 w-4" />
            <span>Stop</span>
          </Button>
        </div>
      </div>
    </div>
  );
}