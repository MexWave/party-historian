/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, Calendar, ChevronRight, FileText, Sparkles, CheckSquare, Clock, AlertCircle, Upload, Image as ImageIcon, Plus } from "lucide-react";
import { Session, TranscriptSegment, Campaign, AIProviderType } from "../types";
import { motion } from "motion/react";

interface SessionHistoryProps {
  campaign: Campaign;
  sessions: Session[];
  activeTranscript: TranscriptSegment[];
  onSessionArchived: (newSession: Session) => void;
  onClearActiveTranscript: () => void;
  aiProvider: AIProviderType;
  onAddImageToSession: (sessionId: string, base64Image: string) => void;
  localEndpoint?: string;
  localModel?: string;
}

export default function SessionHistory({
  campaign,
  sessions,
  activeTranscript,
  onSessionArchived,
  onClearActiveTranscript,
  aiProvider,
  onAddImageToSession,
  localEndpoint,
  localModel,
}: SessionHistoryProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || "");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState("");

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleEndAndCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTranscript.length === 0) {
      setCompileError("Cannot compile an empty session, adventurer. Record some transcript lines first!");
      return;
    }

    setIsCompiling(true);
    setCompileError(null);

    const nextNumber = sessions.length + 1;
    const title = newSessionTitle.trim() || `Session ${nextNumber} - Chronicles`;

    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: activeTranscript,
          sessionNumber: nextNumber,
          title,
          provider: aiProvider,
          localEndpoint,
          localModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile session recap from server.");
      }

      const result = await response.json();

      const newSession: Session = {
        id: Math.random().toString(36).substring(7),
        campaignId: campaign.id,
        sessionNumber: nextNumber,
        title,
        date: new Date().toISOString().split("T")[0],
        summary: result.summary,
        transcript: [...activeTranscript],
      };

      onSessionArchived(newSession);
      setSelectedSessionId(newSession.id);
      onClearActiveTranscript();
      setNewSessionTitle("");
    } catch (err: any) {
      console.error(err);
      setCompileError("Failed to compile summary: " + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  // Basic markdown renderer for session recaps
  const renderSummaryMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h4 key={index} className="text-sm font-bold text-amber-400 mt-4 mb-2">{trimmed.replace("###", "").trim()}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={index} className="text-base font-bold text-amber-500 mt-5 mb-2.5 border-b border-slate-800 pb-1">{trimmed.replace("##", "").trim()}</h3>;
      }
      if (trimmed.startsWith("#")) {
        return <h2 key={index} className="text-lg font-extrabold text-amber-500 mt-6 mb-3">{trimmed.replace("#", "").trim()}</h2>;
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const itemText = trimmed.substring(2);
        return (
          <li key={index} className="text-slate-300 ml-5 list-disc py-0.5 text-xs leading-relaxed">
            {parseBoldText(itemText)}
          </li>
        );
      }
      if (trimmed.startsWith("[ ]") || trimmed.startsWith("- [ ]") || trimmed.startsWith("* [ ]")) {
        const itemText = trimmed.replace(/^.*\[\s\]\s*/, "");
        return (
          <div key={index} className="flex items-start space-x-2 py-0.5 ml-4">
            <CheckSquare className="h-3.5 w-3.5 text-slate-600 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-400 line-through-none">{parseBoldText(itemText)}</span>
          </div>
        );
      }
      if (trimmed.startsWith("[x]") || trimmed.startsWith("- [x]") || trimmed.startsWith("* [x]")) {
        const itemText = trimmed.replace(/^.*\[x\]\s*/, "");
        return (
          <div key={index} className="flex items-start space-x-2 py-0.5 ml-4">
            <CheckSquare className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-500 line-through decoration-slate-700">{parseBoldText(itemText)}</span>
          </div>
        );
      }
      if (!trimmed) {
        return <div key={index} className="h-2"></div>;
      }
      return (
        <p key={index} className="text-slate-300 text-xs leading-relaxed mb-2">
          {parseBoldText(line)}
        </p>
      );
    });
  };

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
    <div id="session-history-section" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[580px]">
      {/* Session Catalog Sidebar */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-amber-500" />
            Session Archives
          </h3>

          <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between group cursor-pointer ${
                  selectedSessionId === session.id
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                    : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80"
                }`}
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-slate-100 block group-hover:text-amber-400 truncate">
                    #{session.sessionNumber} - {session.title}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {session.date}
                  </span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Compile Session Form */}
        <div className="border-t border-slate-800 pt-4 mt-4">
          <div className="flex items-center space-x-1.5 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <h4 className="text-xs font-bold text-slate-200">Compile Active Session</h4>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Ready to end? Write down what you discussed and compile active voice transcripts into the permanent log book.
          </p>

          {compileError && (
            <div className="mb-2 p-1.5 bg-red-950/40 border border-red-900/50 rounded text-[10px] text-red-400 flex items-start space-x-1">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{compileError}</span>
            </div>
          )}

          <form onSubmit={handleEndAndCompile} className="space-y-2">
            <input
              type="text"
              placeholder="e.g. Redbrand Hideout raid"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-[11px] px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-600"
              required
            />
            <button
              type="submit"
              disabled={isCompiling}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isCompiling ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-950"></div>
                  <span>Chronicle Writing...</span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>END & COMPILE RECAP</span>
                </>
              )}
            </button>
          </form>
          <div className="mt-2 text-[9px] text-slate-500 italic text-center">
            {activeTranscript.length} lines waiting in queue
          </div>
        </div>
      </div>

      {/* Main Recap & Log Viewer */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
        {/* Selected Session Recap */}
        {activeSession ? (
          <div className="flex flex-col bg-slate-900/30 border border-slate-800 rounded-xl p-5 overflow-y-auto shadow-inner h-full">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  Session #{activeSession.sessionNumber} Recap
                </span>
                <h3 className="text-sm font-semibold text-slate-100">
                  {activeSession.title}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center space-x-1 bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                <Calendar className="h-3 w-3 text-amber-500 mr-1" />
                {activeSession.date}
              </span>
            </div>

            {/* Session Linked Art Images Gallery */}
            <div className="mb-4 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 shrink-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <ImageIcon className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Chronicle Imagery & Maps ({activeSession.images?.length || 0})
                </span>
                <label className="flex items-center space-x-1 text-[9px] text-slate-400 hover:text-amber-500 cursor-pointer transition-colors" title="Link visual asset retrospectively">
                  <Upload className="h-3 w-3 text-amber-500" />
                  <span>Retrospective Link</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            onAddImageToSession(activeSession.id, reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {activeSession.images && activeSession.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {activeSession.images.map((img, idx) => (
                    <div key={idx} className="relative h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow">
                      <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">No illustrations or maps linked to this chronicle log yet.</p>
              )}
            </div>

            <div className="space-y-1 prose prose-invert max-w-none">
              {renderSummaryMarkdown(activeSession.summary)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-slate-800 rounded-xl h-full p-8 text-center text-slate-500">
            <BookOpen className="h-10 w-10 text-slate-700 mb-2 animate-pulse" />
            <p className="text-xs">No session has been selected or recorded yet, master.</p>
          </div>
        )}

        {/* Selected Session Transcript Logs */}
        <div className="flex flex-col bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl h-full overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center space-x-2">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-100">Recorded Transcript</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {activeSession?.transcript?.length > 0 ? (
              activeSession.transcript.map((seg) => (
                <div
                  key={seg.id}
                  className={`p-2.5 rounded border text-xs ${
                    seg.isKeyMention
                      ? "bg-amber-950/20 border-amber-800/40"
                      : "bg-slate-850/40 border-slate-800/80"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${seg.isKeyMention ? "text-amber-400" : "text-slate-300"}`}>
                      {seg.speaker}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">{seg.timestamp}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{seg.text}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs italic">
                No transcripts archived for this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
