"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button, Textarea, Card, CardHeader, CardContent, CardTitle, Badge } from "@/components/ui";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  stateUpdate?: Record<string, unknown> | null;
}

interface ChatPanelProps {
  tool: "storyboard" | "image-prompt";
  currentState: Record<string, unknown>;
  onStateUpdate: (update: Record<string, unknown>) => void;
}

// Icons
const IconSend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const IconSparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconLoader = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const EXAMPLE_PROMPTS = {
  storyboard: [
    "Create a romantic meet-cute at a bookstore between two college students",
    "Design a thriller chase scene through a rainy Tokyo night",
    "A heartwarming reunion between a soldier and their dog",
    "An astronaut discovering alien ruins on Mars",
  ],
  "image-prompt": [
    "A portrait of a jazz musician in a smoky club at night",
    "A fashion model in futuristic Tokyo streetwear",
    "A chef plating a dish in a high-end restaurant kitchen",
    "An athlete mid-sprint at the Olympics with dramatic lighting",
  ],
};

function formatMessageContent(content: string): string {
  // Remove the JSON blocks from display, keep just the text
  return content.replace(/```json\s*[\s\S]*?\s*```/g, "").trim();
}

export function ChatPanel({ tool, currentState, onStateUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedUpdates, setAppliedUpdates] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/tools/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          tool,
          currentState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        stateUpdate: data.stateUpdate,
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please make sure the Gemini API key is configured and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const applyUpdate = (index: number, update: Record<string, unknown>) => {
    onStateUpdate(update);
    setAppliedUpdates((prev) => new Set([...prev, index]));
  };

  const clearChat = () => {
    setMessages([]);
    setAppliedUpdates(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-[#f5d67b]">
                <IconSparkles />
              </div>
              <div>
                <CardTitle>AI Assistant</CardTitle>
                <div className="text-sm text-white/50">
                  Describe your vision and I&apos;ll help fill out the form
                </div>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <IconTrash /> Clear
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f5d67b]/10 border border-[#f5d67b]/20 mb-4">
                    <IconSparkles />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Describe your {tool === "storyboard" ? "storyboard" : "image"} idea
                  </h3>
                  <p className="text-sm text-white/50 max-w-md mx-auto">
                    Tell me what you want to create and I&apos;ll help you fill out the form fields with appropriate values.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                    Try these examples
                  </div>
                  <div className="grid gap-2">
                    {EXAMPLE_PROMPTS[tool].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(prompt)}
                        className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#f5d67b]/30 transition-all text-sm text-white/70 hover:text-white"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-[#f5d67b] text-black"
                          : "bg-white/5 border border-white/10 text-white/90"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {formatMessageContent(msg.content)}
                      </div>
                      
                      {/* State update button */}
                      {msg.role === "assistant" && msg.stateUpdate && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          {appliedUpdates.has(idx) ? (
                            <div className="flex items-center gap-2 text-xs text-green-400">
                              <IconCheck /> Applied to form
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => applyUpdate(idx, msg.stateUpdate!)}
                              className="w-full"
                            >
                              <IconSparkles /> Apply to form
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 text-white/50">
                        <IconLoader />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-white/10 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Describe your ${tool === "storyboard" ? "storyboard" : "image"} idea...`}
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="self-end"
              >
                {isLoading ? <IconLoader /> : <IconSend />}
              </Button>
            </form>
            <div className="mt-2 flex items-center justify-between text-xs text-white/40">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <Badge variant="secondary">Powered by Gemini</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

