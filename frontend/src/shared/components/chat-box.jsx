import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, X, Minimize2, Maximize2 } from "lucide-react";
import { Button, Input, Card, CardContent } from "@/shared/components/ui-elements";

export function ChatBox({ customTestId, candidateId, role, senderId, defaultOpen = false, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${customTestId}/${candidateId}?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch chat logs", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [customTestId, candidateId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const payload = {
      customTestId,
      candidateId,
      senderRole: role,
      senderId,
      message: newMessage.trim(),
    };

    try {
      setNewMessage("");
      setMessages((prev) => [...prev, { ...payload, created_at: new Date().toISOString() }]);

      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to post message", err);
    }
  };

  if (!isOpen) {
    if (role === "candidate" && messages.length === 0) return null;

    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50 flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6" />
        {role === "candidate" && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white"></span>
          </span>
        )}
      </button>
    );
  }

  return (
    <Card className={`fixed right-6 z-50 shadow-2xl transition-all duration-300 flex flex-col ${isMinimized ? "bottom-6 h-14 w-72" : "bottom-6 h-[450px] w-80 sm:w-96"}`}>
      <div
        className="bg-primary text-white p-3 rounded-t-xl flex justify-between items-center cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          <MessageSquare className="w-4 h-4" />
          {role === "recruiter" ? `Chat with ${candidateId}` : "Ask Recruiter"}
        </div>
        <div className="flex gap-2 text-primary-foreground/80">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white transition-colors">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); if (onClose) onClose(); }} className="hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <CardContent className="flex-grow p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex flex-col gap-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground mt-20 opacity-70">
                No messages yet. Send a message to start!
              </p>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_role === role;
                return (
                  <div key={i} className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                    <span className="text-[10px] text-muted-foreground mb-0.5 ml-1 mr-1">{msg.sender_id}</span>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-white dark:bg-slate-800 border shadow-sm rounded-bl-sm"}`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
          <div className="p-3 border-t bg-background rounded-b-xl">
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow bg-secondary/50 text-sm h-9"
              />
              <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </Card>
  );
}
