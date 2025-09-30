"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, ArrowLeft } from 'lucide-react';

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

export default function LiveVoiceAI({ onBack, initialMessage = '' }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [connectionError, setConnectionError] = useState('');
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      cleanup();
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const websocket = new WebSocket('ws://localhost:3001');
      
      websocket.onopen = () => {
        setIsConnected(true);
        setConnectionError('');
        console.log('Connected to live voice chat');
      };
      
      websocket.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          
          if (type === 'serverMessage') {
            handleServerMessage(data);
          } else if (type === 'error') {
            console.error('Server error:', data);
            setConnectionError(`Error: ${data}`);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };
      
      websocket.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from live voice chat');
      };
      
      wsRef.current = websocket;
    } catch (err) {
      console.error('Failed to connect:', err);
      setConnectionError('Failed to connect to server');
    }
  };

  const handleServerMessage = (message) => {
    if (message.serverContent?.modelTurn?.parts) {
      const parts = message.serverContent.modelTurn.parts;
      let textContent = '';
      
      for (const part of parts) {
        if (part.text) {
          textContent += part.text;
        }
        if (part.inlineData) {
          const audioData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          audioChunksRef.current.push(audioData);
          playAudio(audioData, mimeType);
        }
      }
      
      if (textContent) {
        setCurrentText((prev) => prev + textContent);
      }
    }
    
    if (message.serverContent?.turnComplete) {
      if (currentText) {
        setMessages((prev) => [...prev, { role: 'ai', content: currentText }]);
        setCurrentText('');
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      streamRef.current = stream;
      
      // Create audio context for processing
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE
      });
      
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create script processor for PCM data
      const processor = audioContext.createScriptProcessor(4096, CHANNELS, CHANNELS);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (!isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToInt16(inputData);
        const base64Audio = arrayBufferToBase64(pcm16.buffer);
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            base64Audio,
            format: `audio/L16;rate=${SAMPLE_RATE}`
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Microphone access error:', err);
      setConnectionError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'endTurn' }));
    }
    
    console.log('Recording stopped');
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playAudio = async (base64Audio, mimeType) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Parse the mime type to get audio format details
      const format = parseMimeType(mimeType);
      const arrayBuffer = base64ToArrayBuffer(base64Audio);
      
      // Convert PCM to AudioBuffer
      const audioBuffer = pcmToAudioBuffer(arrayBuffer, format, audioContext);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  const parseMimeType = (mimeType) => {
    const [type, ...params] = mimeType.split(';').map(s => s.trim());
    const format = {
      sampleRate: 24000,
      channels: 1,
      bitsPerSample: 16
    };
    
    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') {
        format.sampleRate = parseInt(value, 10);
      }
    }
    
    return format;
  };

  const pcmToAudioBuffer = (arrayBuffer, format, audioContext) => {
    const { sampleRate, channels, bitsPerSample } = format;
    const dataView = new DataView(arrayBuffer);
    const numSamples = arrayBuffer.byteLength / (bitsPerSample / 8);
    
    const audioBuffer = audioContext.createBuffer(channels, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      channelData[i] = int16 / 32768.0;
    }
    
    return audioBuffer;
  };

  const float32ToInt16 = (buffer) => {
    const l = buffer.length;
    const int16Buffer = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Buffer;
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const cleanup = () => {
    if (isRecording) {
      stopRecording();
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-slate-800 shadow-sm border border-slate-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {currentText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white text-slate-800 shadow-sm border border-slate-200">
                <p className="text-sm leading-relaxed">{currentText}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {connectionError && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{connectionError}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border-t border-slate-200 p-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <button
            onClick={toggleRecording}
            disabled={!isConnected}
            className={`p-6 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : isConnected
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isRecording ? <StopCircle size={32} /> : <Mic size={32} />}
          </button>
          
          <p className="text-sm text-slate-600">
            {!isConnected && 'Connecting to server...'}
            {isConnected && !isRecording && 'Press microphone to start talking'}
            {isRecording && 'Listening... Press to stop'}
          </p>
        </div>
      </div>
    </div>
  );
}