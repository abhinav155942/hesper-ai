"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Send, Mic, RotateCcw, Copy, ThumbsUp, ThumbsDown, Zap, Brain, ChevronDown, ChevronLeft, Upload, MoreHorizontal, FileDown, MailCheck } from 'lucide-react';
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth-client";

const N8N_WEBHOOK_URL = "/api/hesper/chat";

async function fetchN8nReply(message: string, model: string, history: Array<{role: 'user'|'assistant'; content: string}>, chatId: number | null): Promise<string> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : null;
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message,
        model,
        history,
        chatId
      })
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(errorText || `Webhook error: ${res.status}`);
    }

    let responseText = await res.text();

    // Always try to parse if it looks like JSON
    if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
      try {
        const data = JSON.parse(responseText);
        return (
          data.output || data.reply || data.message || data.text || data.content || responseText);

      } catch {
        // If parsing fails, return as-is
        return responseText;
      }
    }

    return responseText;
  } catch (err: any) {
    throw new Error(err?.message || "Failed to contact chat service");
  }
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  modelName?: string; // freeze display name per message
}

interface ChatInterfaceProps {
  selectedModel: 'hesper-1.0v' | 'hesper-pro';
  onBack: () => void;
  initialMessage?: string;
  chatId?: number; // new: open existing chat
  currentSessionId: string | null;
  onLoadSession: (id: string) => void;
}

export default function ChatInterface({ selectedModel, onBack, initialMessage, currentSessionId, onLoadSession }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inFlightRef = useRef(false);
  const sendingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Parse leads from HTML-ish list blocks produced by the AI
  const parseLeadsFromHtml = (html: string): Array<{ name?: string; email?: string; linkedin?: string }> => {
    if (!html || typeof window === 'undefined') return [];
    // Quick check to avoid unnecessary parsing
    if (!/<ul>/i.test(html) || !/Name:|Email:|LinkedIn:/i.test(html)) return [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
      const lists = Array.from(doc.querySelectorAll('ul'));
      const leads = lists.map((ul) => {
        const li = Array.from(ul.querySelectorAll('li'));
        const obj: { name?: string; email?: string; linkedin?: string } = {};

        // Name
        const nameLi = li.find((n) => /name:/i.test(n.textContent || ''));
        if (nameLi) obj.name = (nameLi.textContent || '').replace(/\s*Name:\s*/i, '').trim();

        // Email
        const emailAnchor = ul.querySelector('a[href^="mailto:"]') as HTMLAnchorElement | null;
        if (emailAnchor) {
          obj.email = emailAnchor.textContent?.trim() || emailAnchor.href.replace(/^mailto:/, '');
        } else {
          const emailLi = li.find((n) => /email:/i.test(n.textContent || ''));
          if (emailLi) obj.email = (emailLi.textContent || '').replace(/\s*Email:\s*/i, '').trim();
        }

        // LinkedIn
        const linkedinAnchor = Array.from(ul.querySelectorAll('a')).find((a) => /linkedin\.com\//i.test(a.href)) as HTMLAnchorElement | undefined;
        if (linkedinAnchor) {
          obj.linkedin = linkedinAnchor.href;
        } else {
          const linkLi = li.find((n) => /linkedin:/i.test(n.textContent || ''));
          if (linkLi) obj.linkedin = (linkLi.textContent || '').replace(/\s*LinkedIn:\s*/i, '').trim();
        }

        return obj;
      }).filter((l) => l.name || l.email || l.linkedin);

      return leads;
    } catch {
      return [];
    }
  };

  const buildHistory = (nextUserContent?: string): Array<{role:'user'|'assistant'; content:string}> => {
    const base = messages.map(m => ({ role: m.type, content: m.content })) as Array<{role:'user'|'assistant'; content:string}>;
    const withNext = nextUserContent ? [...base, { role: 'user', content: nextUserContent }] : base;
    return withNext.slice(-6);
  };

  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      inputRef.current?.focus();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      toast.error(`Microphone error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
    setHasNewMessages(false);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    const increased = messages.length > prevCountRef.current;
    if (isNearBottom) {
      scrollToBottom();
    } else {
      setShowScrollButton(true);
      if (increased) setHasNewMessages(true);
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();

    // Handle initial message with guard for StrictMode double-mounts
    if (initialMessage && messages.length === 0 && !initialized) {
      setInitialized(true);
      handleInitialMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      setShowScrollButton(!atBottom);
      if (atBottom) setHasNewMessages(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (currentSessionId && session?.user && !sessionLoaded) {
      loadSessionFromDB();
    }
  }, [currentSessionId, session]);

  const loadSessionFromDB = async () => {
    const token = localStorage.getItem("bearer_token");
    if (!token) return;

    try {
      const res = await fetch(`/api/chats/${currentSessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const messagesList = data.map((m: any) => ({
          id: m.id.toString(),
          type: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt),
          modelName: selectedModel === 'hesper-pro' ? 'Hesper Pro' : 'Hesper'
        }));
        setMessages(messagesList);
        setSessionLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load session from DB:', error);
    }
  };

  const ensureChat = async (titleHint: string): Promise<number> => {
    if (currentSessionId && session?.user) {
      return Number(currentSessionId);
    }

    if (!session?.user) {
      throw new Error('Authentication required to save chats');
    }

    const token = localStorage.getItem("bearer_token");
    if (!token) {
      throw new Error('No auth token');
    }

    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: titleHint.slice(0, 100) || null })
    });

    if (!res.ok) {
      throw new Error('Failed to create chat');
    }

    const data = await res.json();
    const cid = data.id;
    onLoadSession(cid.toString());
    window.dispatchEvent(new CustomEvent('hesper:chat-sessions-updated'));
    return cid;
  };

  const saveMessage = async (cid: number, role: 'user'|'assistant', content: string) => {
    const token = localStorage.getItem("bearer_token");
    if (!token || !session?.user) return;

    try {
      const res = await fetch(`/api/chats/${cid}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role, content })
      });
      if (!res.ok) {
        console.error('Failed to save message');
      } else {
        window.dispatchEvent(new CustomEvent('hesper:chat-sessions-updated'));
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleInitialMessage = async (message: string) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const currentModelName = selectedModel === 'hesper-pro' ? "Hesper Pro" : "Hesper";
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages([userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      type: 'assistant',
      content: "",
      timestamp: new Date(),
      isTyping: true,
      modelName: currentModelName
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const cid = await ensureChat(message);
      await saveMessage(cid, 'user', message);
      const reply = await fetchN8nReply(message, selectedModel, buildHistory(), cid);
      await saveMessage(cid, 'assistant', reply || "");
      window.dispatchEvent(new CustomEvent('hesper:chat-sessions-updated'));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: reply || "",
        timestamp: new Date(),
        modelName: currentModelName
      };

      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        const lastAssistant = [...withoutTyping].reverse().find((m) => m.type === 'assistant');
        if (lastAssistant && lastAssistant.content.trim() === (reply || "").trim()) {
          return withoutTyping;
        }
        return [...withoutTyping, assistantMessage];
      });
    } catch (error) {
      setMessages([userMessage]);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inFlightRef.current = false;
    }
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;
    if (sendingRef.current) return;
    if (inFlightRef.current) return;
    sendingRef.current = true;
    inFlightRef.current = true;
    const currentModelName = selectedModel === 'hesper-pro' ? 'Hesper Pro' : 'Hesper';

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      type: 'assistant',
      content: "",
      timestamp: new Date(),
      isTyping: true,
      modelName: currentModelName
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const cid = await ensureChat(content);
      await saveMessage(cid, 'user', content.trim());
      const reply = await fetchN8nReply(userMessage.content, selectedModel, buildHistory(userMessage.content), cid);
      await saveMessage(cid, 'assistant', reply || "");
      window.dispatchEvent(new CustomEvent('hesper:chat-sessions-updated'));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: reply || "",
        timestamp: new Date(),
        modelName: currentModelName
      };

      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        const lastAssistant = [...withoutTyping].reverse().find((m) => m.type === 'assistant');
        if (lastAssistant && lastAssistant.content.trim() === (reply || "").trim()) {
          return withoutTyping;
        }
        return [...withoutTyping, assistantMessage];
      });
    } catch (error) {
      setMessages((prev) => prev.filter((m) => !m.isTyping));
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      sendingRef.current = false;
      inFlightRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const generateModelResponse = (userInput: string, model: string): string => {
    if (model === 'hesper-pro') {
      return `*Analyzing your request...*

I understand you're asking about "${userInput}". Let me think through this systematically:

**Research Phase:**
- Analyzing context and implications
- Considering multiple perspectives
- Cross-referencing relevant information

**Reasoning Phase:**
- Evaluating potential approaches
- Weighing pros and cons
- Formulating comprehensive response

**Response:**
This is a thoughtful response from Hesper Pro. I've taken time to research and reason through your query to provide you with the most accurate and helpful information possible. The Pro model allows me to dive deeper into complex topics and provide more nuanced, well-researched answers.

Would you like me to explore any specific aspect of this topic in more detail?`;
    } else {
      return `Thanks for your message! This is a quick response from Hesper. I'm designed to provide fast, helpful responses to your everyday questions and tasks.

Your input: "${userInput}"

I'm here to help with a wide range of tasks including answering questions, helping with writing, providing explanations, and assisting with various everyday needs. Feel free to ask me anything!`;
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages].reverse().find((m) => m.type === 'user');
    if (lastUserMessage) {
      // Remove last assistant response and regenerate
      setMessages((prev) => prev.filter((m) => m.id !== messages[messages.length - 1].id));
      setInputValue(lastUserMessage.content);
      handleSubmit(new Event('submit') as any);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current || isLoading) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const getModelInfo = () => {
    if (selectedModel === 'hesper-pro') {
      return {
        icon: <Brain className="h-4 w-4" />,
        name: "Hesper Pro", // new display name going forward
        description: "Advanced reasoning model"
      };
    } else {
      return {
        icon: <Zap className="h-4 w-4" />,
        name: "Hesper", // changed from "Hesper Core"
        description: "Fast general AI model"
      };
    }
  };

  const modelInfo = getModelInfo();

  // Typing timer upgraded to mm:ss:ms with rAF and a subtle shape-morph icon
  const TypingTimer: React.FC = () => {
    const [elapsedMs, setElapsedMs] = useState(0);
    useEffect(() => {
      let raf = 0;
      const start = performance.now();
      const tick = () => {
        setElapsedMs(performance.now() - start);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, []);

    return (
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
        <span className="relative inline-flex items-center justify-center">
          <span
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[linear-gradient(135deg,var(--color-primary),var(--color-chart-5))] shadow-[0_0_8px_rgba(26,115,232,0.35)] [animation:var(--animate-shape-morph)]"
            aria-hidden
          />
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="sr-only">Assistant is typing</span>
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </span>
      </div>
    );
  };

  // 20-minute waiting timeline shown while awaiting webhook response
  const WaitTimeline: React.FC<{ active: boolean }>= ({ active }) => {
    const DURATION = 20 * 60 * 1000; // 20 minutes
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
      if (!active) return;
      let raf = 0;
      const start = performance.now();
      const tick = () => {
        setElapsed(prev => {
          const now = performance.now();
          const next = now - start;
          return Math.min(next, DURATION);
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [active]);

    if (!active) return null;

    const remaining = Math.max(0, DURATION - elapsed);
    const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
    const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

    const pct = Math.min(100, (elapsed / DURATION) * 100);

    return (
      <div className="px-2 sm:px-4 py-2">
        <div className="rounded-full h-1.5 bg-secondary/80 overflow-hidden">
          <div
            className="h-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-chart-1),var(--color-chart-5))] [animation:var(--animate-timeline-shimmer)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground font-mono">
          <span>waiting for webhook…</span>
          <span>{mm}:{ss} remaining</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col min-h-[100dvh] w-full max-w-4xl mx-auto px-0 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-card">
        <button
          onClick={onBack}
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[36px]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to homepage
        </button>
        
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hidden sm:flex">
          {modelInfo.icon}
          <span className="font-medium truncate">{modelInfo.name}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground truncate">{modelInfo.description}</span>
        </div>
      </div>

      {/* SMTP setup note */}
      <div className="px-3 py-2 text-[11px] sm:text-xs bg-[#FFF3CD] text-[#8A6D3B] border-b border-border">
        ⚠️ Please setup your SMTP in Settings so the AI Agent can send emails.
      </div>

      {/* 20-min timeline while waiting */}
      {/* <WaitTimeline active={isTyping || isLoading} /> */}

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-2 pb-1 scroll-smooth scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        role="log"
        aria-live="polite">
        
        {messages.length === 0 &&
        <div className="text-center py-12">
            <div className="mb-4 mx-auto w-8">
              {modelInfo.icon}
            </div>
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Ask me anything! I'm here to help with questions, tasks, and creative projects.
            </p>
          </div>
        }

        {messages.map((message, idx) =>
        <div key={message.id} className="w-full">
            {idx > 0 && <div className="h-px bg-border my-3 sm:my-4" />}
            {message.type === 'assistant' &&
          <div className="flex items-center gap-1 sm:gap-2 mb-2">
                {modelInfo.icon}
                <span className="text-xs sm:text-sm font-medium text-muted-foreground !w-20 !h-full !whitespace-pre-line">{message.modelName ?? modelInfo.name}</span>
              </div>
          }
            <div className="pb-1 sm:pb-0">
              {message.isTyping ? (
                <div className="flex items-center gap-2" role="status" aria-live="polite">
                  <TypingTimer />
                </div>
              ) : (
                (() => {
                  const leads = message.type === 'assistant' ? parseLeadsFromHtml(message.content) : [];
                  if (leads.length > 0) {
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">Leads found: {leads.length}</div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors min-h-[32px] min-w-[32px] inline-flex items-center justify-center"
                                aria-label="Leads actions"
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Leads actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  const headers = ["name","email","linkedin"];
                                  const escape = (v: string | undefined) => {
                                    const s = (v ?? "").replace(/"/g, '""');
                                    return /[",\n]/.test(s) ? `"${s}"` : s;
                                  };
                                  const rows = leads.map(l => headers.map(h => escape((l as any)[h])));
                                  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  toast.success("CSV exported");
                                }}
                                className="cursor-pointer"
                              >
                                <FileDown className="mr-2 h-4 w-4" /> Export CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const count = leads.filter(l => !!l.email).length;
                                  toast.info(`${count} email${count===1?"":"s"} queued for verification`);
                                }}
                                className="cursor-pointer"
                              >
                                <MailCheck className="mr-2 h-4 w-4" /> Verify emails
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                           {leads.map((lead, i) => (
                             <div key={i} className="rounded-lg border border-border bg-card p-3">
                               {lead.name && <div className="font-medium text-sm mb-1">{lead.name}</div>}
                               <div className="space-y-1 text-sm">
                                 {lead.email && (
                                   <div className="truncate">
                                     <span className="text-muted-foreground mr-1">Email:</span>
                                     <a className="underline" href={`mailto:${lead.email}`}>{lead.email}</a>
                                   </div>
                                 )}
                                 {lead.linkedin && (
                                   <div className="truncate">
                                     <span className="text-muted-foreground mr-1">LinkedIn:</span>
                                     <a className="underline" href={lead.linkedin} target="_blank" rel="noopener noreferrer">
                                       {lead.linkedin.replace(/^https?:\/\//, '')}
                                     </a>
                                   </div>
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                    );
                  }

                  // Fallback: plain text content
                  return (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed !text-black !bg-white !shadow-none !border-double break-words">
                      {message.content}
                    </div>
                  );
                })()
              )}
            </div>

            {message.type === 'assistant' && !message.isTyping &&
          <div className="flex items-center gap-1 sm:gap-2 mt-2 flex-wrap">
                <button
              onClick={() => handleCopy(message.content)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors min-h-[36px] min-w-[36px]"
              title="Copy">

                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
              onClick={handleRegenerate}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Regenerate">

                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Good response">
                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Bad response">
                  <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </button>
              </div>
          }
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton &&
      <button
        onClick={scrollToBottom}
        className="absolute bottom-20 sm:bottom-24 sm:bottom-28 right-2 sm:right-3 sm:right-4 z-10 inline-flex items-center gap-1 sm:gap-2 rounded-full bg-card border border-border px-2 sm:px-3 py-2 shadow hover:bg-secondary transition-colors min-h-[40px]">

          {hasNewMessages ?
        <span className="text-xs text-muted-foreground">New messages</span> :

        <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
        </button>
      }

      {/* Input Area */}
      <div className="p-2 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-1 sm:gap-2 sm:gap-3 bg-secondary rounded-full py-1 pl-3 sm:pl-4 sm:pl-6 pr-1 sm:pr-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 min-h-[44px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask ${modelInfo.name}...`}
              disabled={isLoading}
              className="flex-grow bg-transparent text-base text-foreground placeholder-muted-foreground outline-none border-none py-2 sm:py-3 px-2 sm:px-4 disabled:opacity-50 min-w-0"
              style={{ WebkitAppearance: 'none' }}
            />
            
            <div className="flex items-center gap-0.5 sm:gap-1 sm:gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 sm:p-2.5 rounded-full hover:bg-muted/80 transition-colors min-h-[36px] min-w-[36px] disabled:opacity-50"
                aria-label="Attach file"
              >
                <Upload className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground" />
              </button>
              
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                className={`p-1.5 sm:p-2 sm:p-2.5 rounded-full transition-colors min-h-[36px] min-w-[36px] ${isRecording ? 'bg-destructive/10 text-destructive' : 'hover:bg-muted/80 text-muted-foreground'}`}
                aria-label={isRecording ? "Stop microphone" : "Use microphone"}
              >
                <Mic className={`h-4 sm:h-5 w-4 sm:w-5 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
              
              <button
                type="button"
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="p-1.5 sm:p-2 sm:p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] min-w-[36px]"
                aria-label="Send message"
              >
                <Send className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setInputValue(prev => `${prev} [attached: ${file.name}]`.trim());
                inputRef.current?.focus();
                e.target.value = '';
              }
            }}
          />
        </form>
        
        <div className="text-center mt-2 sm:mt-3 hidden sm:block">
          <p className="text-xs text-muted-foreground">
            {selectedModel === 'hesper-pro' ?
            "Pro model provides deeper analysis and research-backed responses" :
            "Fast responses for everyday questions and tasks"
            }
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            ⚠️ Please setup your SMTP in Settings so the AI Agent can send emails. <a href="/settings" className="underline underline-offset-2">Open Settings</a>
          </p>
        </div>
      </div>
    </div>
  );
}