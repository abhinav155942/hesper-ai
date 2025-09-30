"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle } from 'lucide-react';

interface Message {
  type: 'user' | 'ai';
  content: string;
}

const SAMPLE_RATE = 16000;
const CHUNK_SIZE = 4096;

function float32ToInt16(buffer: Float32Array): Int16Array {
  const len = buffer.length;
  const result = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return result;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');
  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    bitsPerSample: 16,
  };
  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }
  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') options.sampleRate = parseInt(value, 10);
  }
  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): ArrayBuffer {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const writeString = (str: string, offset: number) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString('RIFF', 0);
  view.setUint32(4, 36 + dataLength, true);
  writeString('WAVE', 8);
  writeString('fmt ', 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString('data', 36);
  view.setUint32(40, dataLength, true);

  return buffer;
}

function convertToWav(rawData: string[], mimeType: string): ArrayBuffer {
  const options = parseMimeType(mimeType);
  const dataLength = rawData.reduce((a, b) => a + b.length * 3 / 4, 0) * 4 / 3; // approx base64 to bytes
  const wavHeader = createWavHeader(dataLength, options);
  const audioData = rawData.map(data => base64ToArrayBuffer(data));
  const buffer = new Uint8Array(wavHeader);
  audioData.forEach(chunk => buffer.set(new Uint8Array(chunk), buffer.length));
  return buffer.buffer;
}

export default function LiveVoiceAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [processor, setProcessor] = useState<ScriptProcessorNode | null>(null);
  const [audioParts, setAudioParts] = useState<string[]>([]);
  const [currentMimeType, setCurrentMimeType] = useState<string>('');
  const aiMessageRef = useRef<string>('');

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');
    websocket.onopen = () => console.log('Connected to backend');
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'text') {
        aiMessageRef.current += data.data;
        setMessages(prev => [...prev.slice(0, -1), { type: 'ai', content: aiMessageRef.current }]);
      } else if (data.type === 'audio') {
        setAudioParts(prev => [...prev, data.data]);
        setCurrentMimeType(data.mimeType);
      } else if (data.type === 'turn-complete') {
        if (audioParts.length > 0 && audioContext) {
          const fullBase64 = audioParts.join('');
          const wavBuffer = convertToWav(audioParts, currentMimeType);
          audioContext.decodeAudioData(wavBuffer.slice(44)).then(decodedData => {
            const buffer = audioContext!.createBuffer(1, decodedData.length, SAMPLE_RATE);
            buffer.copyToChannel(decodedData.getChannelData(0), 0);
            const playSource = audioContext.createBufferSource();
            playSource.buffer = buffer;
            playSource.connect(audioContext.destination);
            playSource.start();
          });
          setAudioParts([]);
        }
        aiMessageRef.current = '';
        setMessages(prev => [...prev, { type: 'ai', content: aiMessageRef.current }]);
      } else if (data.type === 'error') {
        console.error('Error:', data.data);
        setMessages(prev => [...prev, { type: 'ai', content: `Error: ${data.data}` }]);
      }
    };
    websocket.onerror = (error) => console.error('WebSocket error:', error);
    websocket.onclose = () => console.log('Disconnected from backend');
    setWs(websocket);

    return () => websocket.close();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      const context = new AudioContext({ sampleRate: SAMPLE_RATE });
      const audioSource = context.createMediaStreamSource(stream);
      const scriptProcessor = context.createScriptProcessor(CHUNK_SIZE, 1, 1);

      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecording || !ws) return;
        const inputBuffer = event.inputBuffer.getChannelData(0);
        const int16Buffer = float32ToInt16(new Float32Array(inputBuffer));
        const base64Data = arrayBufferToBase64(int16Buffer.buffer);
        ws.send(JSON.stringify({ type: 'audio', data: base64Data }));
      };

      audioSource.connect(scriptProcessor);
      scriptProcessor.connect(context.destination);

      setMediaStream(stream);
      setAudioContext(context);
      setSource(audioSource);
      setProcessor(scriptProcessor);
      setIsRecording(true);
      setMessages(prev => [...prev, { type: 'user', content: 'Started talking...' }]);
    } catch (err) {
      console.error('Error starting recording:', err);
      setMessages(prev => [...prev, { type: 'ai', content: `Error: ${err.message}` }]);
    }
  };

  const stopRecording = () => {
    if (processor) processor.disconnect();
    if (source) source.disconnect();
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) audioContext.close();
    setIsRecording(false);
    setMessages(prev => prev.filter(m => m.content !== 'Started talking...'));
    if (ws) ws.send(JSON.stringify({ type: 'stop' })); // optional
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-orange-500">
        <CardHeader>
          <CardTitle className="text-center text-orange-400">Live Voice AI Chat with Gemini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-96 overflow-y-auto space-y-2 p-2 bg-gray-800 rounded">
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-2 rounded ${msg.type === 'user' ? 'bg-blue-600 ml-auto max-w-xs' : 'bg-green-600'}`}>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={startRecording}
              disabled={isRecording}
              className="bg-orange-500 hover:bg-orange-600 flex items-center space-x-2"
            >
              <Mic className="h-4 w-4" />
              <span>Start Talking</span>
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
        </CardContent>
      </Card>
    </div>
  );
}