/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Sparkles, AlertCircle, HelpCircle, User, Bot, HelpCircle as HelpIcon } from "lucide-react";
import { AssistantMessage, Session, Entity, Campaign, AIProviderType } from "../types";
import { motion } from "motion/react";

interface LoreAssistantProps {
  campaign: Campaign;
  sessions: Session[];
  entities: Entity[];
  messages: AssistantMessage[];
  onAddMessage: (msg: AssistantMessage) => void;
  aiProvider: AIProviderType;
  localEndpoint?: string;
  localModel?: string;
}

const PRESET_QUESTIONS = [
  "What happened to Gundren Rockseeker?",
  "Who is Sildar Hallwinter looking for?",
  "What do we know about Glasstaff and the Redbrands?",
  "Where is the Redbrand hideout located?"
];

export default function LoreAssistant({
  campaign,
  sessions,
  entities,
  messages,
  onAddMessage,
  aiProvider,
  localEndpoint,
  localModel,
}: LoreAssistantProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const query = textOverride || inputText;
    if (!query.trim() || isLoading) return;

    setInputText("");
    setApiError(null);

    // 1. Add User Message to log
    const userMsg: AssistantMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    onAddMessage(userMsg);

    setIsLoading(true);

    try {
      // 2. Query History Server-Side (Gemini API)
      const response = await fetch("/api/query-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          campaignName: campaign.name,
          sessions,
          entities,
          chatHistory: messages,
          provider: aiProvider,
          localEndpoint,
          localModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Party Historian server responded with an error.");
      }

      const result = await response.json();

      // 3. Add Assistant Response to log
      const assistantMsg: AssistantMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      onAddMessage(assistantMsg);

    } catch (err: any) {
      console.error(err);
      setApiError("Error asking assistant: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to convert simple markdown characters in model outputs to gorgeous styled JSX
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return <h4 key={index} className="text-sm font-bold text-amber-400 mt-3 mb-1">{trimmed.replace("###", "").trim()}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={index} className="text-base font-bold text-amber-500 mt-4 mb-1.5">{trimmed.replace("##", "").trim()}</h3>;
      }
      if (trimmed.startsWith("#")) {
        return <h2 key={index} className="text-lg font-extrabold text-amber-500 mt-5 mb-2">{trimmed.replace("#", "").trim()}</h2>;
      }

      // Bullet items
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const itemText = trimmed.substring(2);
        return (
          <li key={index} className="text-slate-300 ml-4 list-disc pl-1 py-0.5 text-xs leading-relaxed">
            {parseBoldText(itemText)}
          </li>
        );
      }

      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s/, "");
        return (
          <li key={index} className="text-slate-300 ml-4 list-decimal pl-1 py-0.5 text-xs leading-relaxed">
            {parseBoldText(itemText)}
          </li>
        );
      }

      // Empty space
      if (!trimmed) {
        return <div key={index} className="h-2"></div>;
      }

      // Standard text line
      return (
        <p key={index} className="text-slate-300 text-xs leading-relaxed mb-1">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Helper to parse double asterisks **bold** in string line
  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-amber-300 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="lore-assistant-section" className="flex flex-col bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[580px]">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <MessageSquare className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center">
              Campaign History Assistant
              <Sparkles className="h-4 w-4 ml-1.5 text-yellow-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">
              Query past transcript records, NPC lore, or campaign timelines
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dialogue Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 max-w-[85%] ${
                msg.role === "user" ? "self-end flex-row-reverse space-x-reverse" : "self-start"
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  msg.role === "user" ? "bg-slate-800" : "bg-slate-900 border border-amber-900/40"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-slate-300" />
                ) : (
                  <Bot className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-amber-600/10 border border-amber-600/20 text-slate-100 rounded-tr-none"
                    : "bg-slate-900/30 border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                <div className="flex justify-between items-center mb-1 space-x-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {msg.role === "user" ? "Player" : "Party Historian"}
                  </span>
                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                </div>
                
                <div className="space-y-1">
                  {msg.role === "user" ? (
                    <p className="text-xs text-slate-100">{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3 max-w-[80%] self-start">
              <div className="p-2 bg-slate-900 border border-amber-900/40 rounded-lg shrink-0">
                <Bot className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
              <div className="p-3 bg-slate-900/30 border border-slate-800 text-slate-200 rounded-lg rounded-tl-none">
                <div className="flex items-center space-x-2 text-xs text-amber-500 italic">
                  <div className="animate-bounce delay-75 h-1.5 w-1.5 bg-amber-500 rounded-full"></div>
                  <div className="animate-bounce delay-150 h-1.5 w-1.5 bg-amber-500 rounded-full"></div>
                  <div className="animate-bounce delay-300 h-1.5 w-1.5 bg-amber-500 rounded-full"></div>
                  <span>Consulting campaign archive tapes...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Queries Right Rail (Desktop Only) */}
        <div className="hidden md:flex flex-col w-52 bg-slate-950/60 border-l border-slate-800/80 p-4 shrink-0">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
            <HelpIcon className="h-3.5 w-3.5 mr-1 text-amber-500" />
            Suggested Prompts
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {PRESET_QUESTIONS.map((q, index) => (
              <button
                key={index}
                onClick={() => handleSubmit(undefined, q)}
                disabled={isLoading}
                className="w-full text-left bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-800/50 p-2 rounded text-[10px] text-slate-300 hover:text-amber-400 transition-all leading-relaxed cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-500 text-center italic">
            Answers are parsed instantly from past game logs.
          </div>
        </div>
      </div>

      {/* Input Tray */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800">
        {apiError && (
          <div className="mb-2 p-2 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-400 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)} className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask anything about past events, items, npc dialogues..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 px-3 py-2 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>ASK</span>
          </button>
        </form>
      </div>
    </div>
  );
}
