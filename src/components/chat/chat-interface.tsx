import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  selectedModel?: "hesper-1.0v" | "hesper-pro";
  onBack: () => void;
  initialMessage?: string;
  key?: number;
}

export default function ChatInterface({
  selectedModel = "hesper-1.0v",
  onBack,
  initialMessage = "",
  key: chatKey,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessage ? [{ role: "user" as const, content: initialMessage }] : []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialMessage && chatKey !== undefined) {
      // Simulate sending initial message if provided
      const sendInitial = async () => {
        if (initialMessage.trim()) {
          await sendMessage(initialMessage);
        }
      };
      sendInitial();
    }
  }, [chatKey, initialMessage]);

  useEffect(() => {
    fetchCredits();
    inputRef.current?.focus();
  }, []);

  const fetchCredits = async () => {
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      toast.error("Please log in to view credits");
      return;
    }

    try {
      const res = await fetch("/api/user/credits", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to fetch credits");
      }
    } catch (err) {
      toast.error("Failed to fetch credits");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = { role: "user" as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const token = localStorage.getItem("bearer_token");
    if (!token) {
      toast.error("Please log in to send messages");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/hesper/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          model: selectedModel,
          history: messages, // Send conversation history
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          toast.error("Insufficient credits. Please purchase more.");
        } else if (response.status === 401) {
          toast.error("Please log in to send messages");
        } else {
          const err = await response.json();
          toast.error(err.error || "Failed to get response");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const aiMessage: Message = { role: "assistant" as const, content: data.response || "No response received" };
      setMessages((prev) => [...prev, aiMessage]);
      fetchCredits(); // Refresh credits after successful message
    } catch (err) {
      console.error(err);
      toast.error("Error sending message");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Header with back button and credits */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground">
          Credits: {credits}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Start a conversation by sending a message below.
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.3s]"></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Hesper is typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="sm" disabled={!inputValue.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={isLoading} className="h-10 w-10 p-0">
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}