/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Play,
  Send,
  AlertCircle,
  Bookmark,
  Sparkles,
  Volume2,
  HelpCircle,
  Users,
  Radio,
  Activity,
  VolumeX,
  Settings,
  Pause,
  RefreshCw,
  Disc,
  Terminal,
  Check,
  Link,
  Cpu,
  Layers,
  Video,
  Wifi,
  WifiOff,
  BookOpen,
  Info,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { TranscriptSegment, Entity, Campaign, AIProviderType, ImagePromptNotification, LooseEndItem, NpcRelationship } from "../types";
import { VOICE_SIMULATIONS } from "../data";
import { motion, AnimatePresence } from "motion/react";

const CALL_DIALOGUES = [
  { speaker: "DM (Dungeon Master)", text: "The heavy iron-bound doors of Tresendar Manor creak open. A draft of damp cold air and rotting wood pours out." },
  { speaker: "Elwyn (Rogue)", text: "I stick to the shadows on the left, keeping my hand crossbow drawn. Aria, can you see any magical traps?" },
  { speaker: "Aria (Wizard)", text: "I cast Detect Magic. A faint glow of abjuration magic hums around the copper mosaic on the floor!" },
  { speaker: "Gorgon (Barbarian)", text: "Traps are for cowards! I stomp right over the copper mosaic to see what is on the pedestal." },
  { speaker: "DM (Dungeon Master)", text: "As Gorgon steps forward, the mosaic flashes! A thunderous shockwave erupts. Roll a Constitution saving throw, Gorgon!" },
  { speaker: "Gorgon (Barbarian)", text: "That is a... 18 total! My barbarian rage makes me tough." },
  { speaker: "DM (Dungeon Master)", text: "You resist the brunt of it, taking only 4 thunder damage. But the sound has alerted the guards! Three Redbrand ruffians burst through the curtains." },
  { speaker: "Elwyn (Rogue)", text: "I shoot the lead ruffian from hiding! Sneak attack! Sildar said these bandits are ruthless, let's clean them out." },
  { speaker: "Aria (Wizard)", text: "I'll upload and share this battlemap of the manor layout on your screens so we can plan our tactical positions." },
  { speaker: "DM (Dungeon Master)", text: "The Redbrand yells, 'Intruders in the manor! Alert the Wizard!' before Elwyn's bolt drops him." }
];

interface AudioSessionProps {
  campaign: Campaign;
  knownEntities: Entity[];
  onNewEntitiesExtracted: (newEntities: any[]) => void;
  onTranscriptAdded: (segment: TranscriptSegment) => void;
  currentTranscript: TranscriptSegment[];
  aiProvider: AIProviderType;
  onImageSharedDetected: (contextText: string, suggestedName: string) => void;
  notifications: ImagePromptNotification[];
  onResolveNotification: (id: string, base64Image?: string) => void;
  onDismissNotification: (id: string) => void;
  activeSessionImages: string[];
  localEndpoint?: string;
  localModel?: string;
  looseEnds?: LooseEndItem[];
  npcRelationships?: NpcRelationship[];
  onLooseEndsUpdatesDetected?: (updates: any[]) => void;
  onNpcUpdatesDetected?: (updates: any[]) => void;
  onTriggerTabFlash?: (tab: string) => void;
}

export default function AudioSession({
  campaign,
  knownEntities,
  onNewEntitiesExtracted,
  onTranscriptAdded,
  currentTranscript,
  aiProvider,
  onImageSharedDetected,
  notifications,
  onResolveNotification,
  onDismissNotification,
  activeSessionImages,
  localEndpoint,
  localModel,
  looseEnds = [],
  npcRelationships = [],
  onLooseEndsUpdatesDetected,
  onNpcUpdatesDetected,
  onTriggerTabFlash,
}: AudioSessionProps) {
  const [isListening, setIsListening] = useState(false);
  const [manualText, setManualText] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("Aria (Wizard)");
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<"connectors" | "call" | "reminders">("connectors");

  const [inputSource, setInputSource] = useState<"mic" | "call">("call");
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [callVolume, setCallVolume] = useState(80);

  // Modular Connector Configurations
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>("c1");
  const [connectors, setConnectors] = useState([
    {
      id: "c1",
      name: "Web Speech API (Local Mic)",
      type: "web-speech" as const,
      description: "Direct client-side ingestion using standard browser audio input.",
      status: "disconnected" as "disconnected" | "connecting" | "connected" | "error",
      logs: ["[System] Ready to capture native browser audio stream."]
    },
    {
      id: "c2",
      name: "Google Meet Core SDK",
      type: "google-meet" as const,
      description: "Ingest media streams via Google Workspace Add-on WebSocket bridge.",
      status: "disconnected" as "disconnected" | "connecting" | "connected" | "error",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      clientId: "983028102-googleusercontent.com",
      logs: ["[System] Google Meet integration module initialized. Ready for connection."]
    },
    {
      id: "c3",
      name: "MS Teams Bot Link",
      type: "ms-teams" as const,
      description: "Real-time speech ingestion utilizing Microsoft Graph Cloud Communications API.",
      status: "disconnected" as "disconnected" | "connecting" | "connected" | "error",
      clientId: "4b92cde2-5012-4cf0-8da1-90a2be2918df",
      tenantId: "dc102910-410a-11e9-b210-d663bd190c10",
      logs: ["[System] MS Teams bot gateway initialized. Ready to hook."]
    },
    {
      id: "c4",
      name: "Discord Audio Gateway",
      type: "discord" as const,
      description: "Ingests voice feeds directly from Discord server voice channels via Discord Bot SDK.",
      status: "disconnected" as "disconnected" | "connecting" | "connected" | "error",
      botToken: "MTE0OTM4NT...masked_token",
      logs: ["[System] Discord Gateway pipeline registered. Waiting for channel hook."]
    }
  ]);

  const [participants, setParticipants] = useState([
    { id: "p1", name: "You (Mic)", role: "Mic Input", isMuted: false, isSpeaking: false, color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
    { id: "p2", name: "Aria (Wizard)", role: "Party Member", isMuted: false, isSpeaking: false, color: "border-purple-500 text-purple-400 bg-purple-500/10" },
    { id: "p3", name: "Gorgon (Barbarian)", role: "Party Member", isMuted: false, isSpeaking: false, color: "border-red-500 text-red-400 bg-red-500/10" },
    { id: "p4", name: "Elwyn (Rogue)", role: "Party Member", isMuted: false, isSpeaking: false, color: "border-sky-500 text-sky-400 bg-sky-500/10" },
    { id: "p5", name: "DM (Dungeon Master)", role: "Game Master", isMuted: false, isSpeaking: false, color: "border-amber-500 text-amber-400 bg-amber-500/10" },
  ]);

  // Synchronize participants when connector swaps
  useEffect(() => {
    if (selectedConnectorId === "c1") {
      setParticipants([
        { id: "p1", name: "You (Mic)", role: "Mic Input", isMuted: false, isSpeaking: false, color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
        { id: "p2", name: "Aria (Wizard)", role: "Party Member", isMuted: false, isSpeaking: false, color: "border-purple-500 text-purple-400 bg-purple-500/10" },
        { id: "p3", name: "Gorgon (Barbarian)", role: "Party Member", isMuted: false, isSpeaking: false, color: "border-red-500 text-red-400 bg-red-500/10" },
        { id: "p4", name: "Elwyn (Rogue)", role: "Party Member", isMuted: false, isSpeaking: false, color: "border-sky-500 text-sky-400 bg-sky-500/10" },
        { id: "p5", name: "DM (Dungeon Master)", role: "Game Master", isMuted: false, isSpeaking: false, color: "border-amber-500 text-amber-400 bg-amber-500/10" },
      ]);
      setSelectedSpeaker("Aria (Wizard)");
    } else if (selectedConnectorId === "c2") {
      setParticipants([
        { id: "p1", name: "DM (Google Meet Bot)", role: "Game Master", isMuted: false, isSpeaking: false, color: "border-amber-500 text-amber-400 bg-amber-500/10" },
        { id: "p2", name: "Sarah Connor (Meet)", role: "Fighter", isMuted: false, isSpeaking: false, color: "border-purple-500 text-purple-400 bg-purple-500/10" },
        { id: "p3", name: "David Miller (Meet)", role: "Cleric", isMuted: false, isSpeaking: false, color: "border-sky-500 text-sky-400 bg-sky-500/10" },
        { id: "p4", name: "Jennifer Lopez (Meet)", role: "Bard", isMuted: false, isSpeaking: false, color: "border-rose-500 text-rose-400 bg-rose-500/10" },
      ]);
      setSelectedSpeaker("Sarah Connor (Meet)");
    } else if (selectedConnectorId === "c3") {
      setParticipants([
        { id: "p1", name: "Teams Lead (DM)", role: "Game Master", isMuted: false, isSpeaking: false, color: "border-amber-500 text-amber-400 bg-amber-500/10" },
        { id: "p2", name: "Alex Johnson (Teams)", role: "Rogue", isMuted: false, isSpeaking: false, color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
        { id: "p3", name: "John Smith (Teams)", role: "Paladin", isMuted: false, isSpeaking: false, color: "border-indigo-500 text-indigo-400 bg-indigo-500/10" },
        { id: "p4", name: "Emily Watson (Teams)", role: "Druid", isMuted: false, isSpeaking: false, color: "border-teal-500 text-teal-400 bg-teal-500/10" },
      ]);
      setSelectedSpeaker("Alex Johnson (Teams)");
    } else if (selectedConnectorId === "c4") {
      setParticipants([
        { id: "p1", name: "Discord DM", role: "Game Master", isMuted: false, isSpeaking: false, color: "border-amber-500 text-amber-400 bg-amber-500/10" },
        { id: "p2", name: "ShadowSlayer99 (Rogue)", role: "Assassination Specialist", isMuted: false, isSpeaking: false, color: "border-red-500 text-red-400 bg-red-500/10" },
        { id: "p3", name: "ElvenGrace (Wizard)", role: "Evocation Spellcaster", isMuted: false, isSpeaking: false, color: "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10" },
        { id: "p4", name: "TavernKeep (Discord)", role: "Music & Logging Bot", isMuted: false, isSpeaking: false, color: "border-slate-500 text-slate-400 bg-slate-500/10" },
      ]);
      setSelectedSpeaker("ShadowSlayer99 (Rogue)");
    }
  }, [selectedConnectorId]);

  // Connect integration flow with simulation stage log triggers
  const handleConnectConnector = (id: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: "connecting" } : c));
    
    const target = connectors.find(c => c.id === id);
    if (!target) return;

    const steps = [
      `[OAuth] Handshaking secure verification with authority... OK`,
      `[Gateway] Connecting live audio WebSocket: wss://api.partyhistorian.com/v1/stream?connectorId=${id}`,
      `[Gateway] WebSocket handshake succeeded. Socket connected.`,
      `[Codec] Active stream codec negotiated: Opus High Definition (48kHz)`,
      `[Ingress] Synchronized voice feeds for: ${
        id === "c2" ? "Sarah Connor, David Miller, Jennifer Lopez, DM" : 
        id === "c3" ? "Alex Johnson, John Smith, Emily Watson, DM" : 
        "ShadowSlayer99, ElvenGrace, TavernKeep, DM"
      }`,
      `[System] Connector state set to ACTIVE. Listening for D&D spoken lore...`
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setConnectors(prev => prev.map(c => {
          if (c.id === id) {
            const nextLogs = [...(c.logs || []), step];
            const isLast = index === steps.length - 1;
            return {
              ...c,
              logs: nextLogs,
              status: isLast ? "connected" : "connecting"
            };
          }
          return c;
        }));
      }, (index + 1) * 350);
    });
  };

  const handleDisconnectConnector = (id: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: "disconnected" as const,
          logs: [...(c.logs || []), `[System] Connection gracefully closed. Ingress stream terminated.`]
        };
      }
      return c;
    }));
  };

  const handleUpdateConnectorParam = (id: string, field: string, value: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const triggerSpeakerActive = (speakerName: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        const isMatch =
          p.name.toLowerCase().includes(speakerName.split(" ")[0].toLowerCase()) ||
          speakerName.toLowerCase().includes(p.name.split(" ")[0].toLowerCase());
        if (isMatch) {
          return { ...p, isSpeaking: true };
        }
        return p;
      })
    );
    setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          const isMatch =
            p.name.toLowerCase().includes(speakerName.split(" ")[0].toLowerCase()) ||
            speakerName.toLowerCase().includes(p.name.split(" ")[0].toLowerCase());
          if (isMatch) {
            return { ...p, isSpeaking: false };
          }
          return p;
        })
      );
    }, 2500);
  };

  // Continuous simulation timer
  useEffect(() => {
    let interval: any = null;
    if (isAutoplayRunning) {
      interval = setInterval(async () => {
        // Map original dialogue speakers to active connector participant names!
        const originalItem = CALL_DIALOGUES[simIndex];
        let speakerName = originalItem.speaker;
        
        if (originalItem.speaker.toLowerCase().includes("dm")) {
          const matched = participants.find(p => p.role.toLowerCase().includes("master") || p.name.toLowerCase().includes("dm"));
          if (matched) speakerName = matched.name;
        } else if (originalItem.speaker.toLowerCase().includes("elwyn")) {
          const matched = participants.find(p => p.name.toLowerCase().includes("elwyn") || p.name.toLowerCase().includes("alex") || p.name.toLowerCase().includes("sarah") || p.name.toLowerCase().includes("shadow"));
          if (matched) speakerName = matched.name;
        } else if (originalItem.speaker.toLowerCase().includes("aria")) {
          const matched = participants.find(p => p.name.toLowerCase().includes("aria") || p.name.toLowerCase().includes("grace") || p.name.toLowerCase().includes("emily") || p.name.toLowerCase().includes("jennifer"));
          if (matched) speakerName = matched.name;
        } else {
          const matched = participants.find(p => p.name.toLowerCase().includes("gorgon") || p.name.toLowerCase().includes("david") || p.name.toLowerCase().includes("john"));
          if (matched) speakerName = matched.name;
        }

        await processTranscriptLine(speakerName, originalItem.text);
        
        // Cycle index
        setSimIndex(prev => (prev + 1) % CALL_DIALOGUES.length);
      }, 7000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoplayRunning, simIndex, knownEntities, participants]);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript list
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentTranscript]);


  // Web Speech API Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = async (event: any) => {
        const resultIndex = event.resultIndex;
        const speechText = event.results[resultIndex][0].transcript;

        if (speechText && speechText.trim()) {
          await processTranscriptLine(selectedSpeaker, speechText);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        if (e.error === "not-allowed") {
          setApiError("Microphone permission denied. Open app in new tab and grant permissions, or use preloaded simulations below.");
        }
        setIsListening(false);
      };

      rec.onend = () => {
        // Automatically restart if it was intended to stay active
        if (isListening) {
          try {
            rec.start();
          } catch (err) {
            console.error(err);
          }
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [isListening, selectedSpeaker]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setApiError(null);
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setApiError("Web Speech API is not supported in this browser. Please use the simulator or manual text entry.");
        return;
      }
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  // Call Express Backend to analyze spoken text with Gemini
  const processTranscriptLine = async (speaker: string, text: string) => {
    triggerSpeakerActive(speaker);
    setIsAnalyzing(true);
    setApiError(null);

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newSegment: TranscriptSegment = {
      id: Math.random().toString(36).substring(7),
      speaker,
      text,
      timestamp,
    };

    try {
      const response = await fetch("/api/analyze-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSegment: newSegment,
          knownEntities,
          provider: aiProvider,
          localEndpoint,
          localModel,
          looseEnds,
          npcRelationships,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process transcript with server.");
      }

      const result = await response.json();
      
      // Update transcript with key mention styling
      if (result.isKeyMention) {
        newSegment.isKeyMention = true;
        onTriggerTabFlash?.("assistant");
        onTriggerTabFlash?.("sessions");
      }

      onTranscriptAdded(newSegment);

      // Trigger Alert Reminders immediately on the side
      if (result.reminders && result.reminders.length > 0) {
        result.reminders.forEach((r: any) => {
          const alertId = Math.random().toString(36).substring(7);
          setActiveReminders((prev) => [
            ...prev,
            { id: alertId, ...r, timestamp },
          ]);

          // Auto-remove alert after 10 seconds
          setTimeout(() => {
            setActiveReminders((prev) => prev.filter((item) => item.id !== alertId));
          }, 12000);
        });
      }

      // Add newly extracted entities
      if (result.newEntities && result.newEntities.length > 0) {
        onNewEntitiesExtracted(result.newEntities);
        onTriggerTabFlash?.("codex");
      }

      // Detect if an image has been shared
      if (result.imageShared && result.imageShared.detected) {
        onImageSharedDetected(result.imageShared.context, result.imageShared.suggestedName);
        onTriggerTabFlash?.("audio");
      }

      // Handle Loose Ends Bulletin updates detected in voice
      if (result.looseEndUpdates && result.looseEndUpdates.length > 0) {
        onLooseEndsUpdatesDetected?.(result.looseEndUpdates);
      }

      // Handle NPC relationship/sentiment updates detected in voice
      if (result.npcUpdates && result.npcUpdates.length > 0) {
        onNpcUpdatesDetected?.(result.npcUpdates);
      }

    } catch (err: any) {
      console.error(err);
      setApiError("Backend Server unreachable or Gemini error: " + err.message);
      // Fallback add anyway to keep UI highly operational
      onTranscriptAdded(newSegment);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    const text = manualText;
    setManualText("");
    await processTranscriptLine(selectedSpeaker, text);
  };

  const triggerSimulation = async (text: string) => {
    let speaker = participants[0]?.name || "DM (Dungeon Master)";
    let cleanText = text;

    const hasSildar = text.toLowerCase().includes("sildar");
    const hasGaraele = text.toLowerCase().includes("sister garaele");
    const hasGoblin = text.toLowerCase().includes("goblin") || text.toLowerCase().includes("black spider");

    if (hasSildar) {
      const dm = participants.find(p => p.role.toLowerCase().includes("master") || p.role.toLowerCase().includes("host") || p.name.toLowerCase().includes("dm"));
      if (dm) speaker = dm.name;
    } else if (hasGaraele) {
      const rogue = participants.find(p => p.name.toLowerCase().includes("elwyn") || p.name.toLowerCase().includes("alex") || p.name.toLowerCase().includes("sarah") || p.name.toLowerCase().includes("shadow"));
      if (rogue) speaker = rogue.name;
    } else if (hasGoblin) {
      const wiz = participants.find(p => p.name.toLowerCase().includes("aria") || p.name.toLowerCase().includes("grace") || p.name.toLowerCase().includes("emily") || p.name.toLowerCase().includes("jennifer"));
      if (wiz) speaker = wiz.name;
    } else {
      const activeParts = participants.filter(p => !p.isMuted);
      if (activeParts.length > 0) {
        speaker = activeParts[Math.floor(Math.random() * activeParts.length)].name;
      }
    }
    await processTranscriptLine(speaker, cleanText);
  };

  return (
    <div id="audio-session-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Transcription Shell */}
      <div className="lg:col-span-2 flex flex-col bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[580px]">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <span className={`absolute top-0 right-0 h-3.5 w-3.5 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-emerald-500"}`}></span>
              <span className={`absolute top-0 right-0 h-3.5 w-3.5 rounded-full ${isListening ? "bg-red-500" : "bg-emerald-500"}`}></span>
              <div className="p-2 bg-slate-800 rounded-lg">
                <Volume2 className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center">
                Live Campaign Audio Listener
                <Sparkles className="h-4 w-4 ml-1.5 text-yellow-500" />
              </h2>
              <p className="text-xs text-slate-400">
                {isListening ? "Listening on microphone call in real-time..." : "Ready to listen or simulate session calls"}
              </p>
            </div>
          </div>

          <button
            id="toggle-mic-btn"
            onClick={toggleListening}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-xs tracking-wider transition-all cursor-pointer ${
              isListening
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-950"
                : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
            <span>{isListening ? "DISCONNECT CALL" : "START MIC LISTENER"}</span>
          </button>
        </div>

        {/* Queued Image Attachments Tray */}
        {activeSessionImages && activeSessionImages.length > 0 && (
          <div className="bg-emerald-950/25 border-b border-slate-800 px-4 py-2 flex items-center space-x-3 shrink-0">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center shrink-0">
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Queued Assets ({activeSessionImages.length}):
            </span>
            <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
              {activeSessionImages.map((img, index) => (
                <div key={index} className="h-7 w-12 rounded border border-emerald-800/40 overflow-hidden shrink-0 shadow bg-slate-950">
                  <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <span className="text-[9px] text-slate-500 italic hidden sm:inline">Will be linked to session chronicle upon compilation.</span>
          </div>
        )}

        {/* Live Transcript View */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
          {/* Real-time Voice Image Share Prompts */}
          {notifications.filter(n => !n.dismissed).map(notif => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={notif.id}
              className={`p-3.5 rounded-xl border ${
                notif.resolved
                  ? "bg-emerald-950/20 border-emerald-800/40"
                  : "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/40 shadow-lg shadow-amber-950/20"
              } space-y-2.5 relative overflow-hidden`}
            >
              <div className="absolute top-2 right-2 z-10">
                {!notif.resolved && (
                  <button
                    onClick={() => onDismissNotification(notif.id)}
                    className="text-slate-500 hover:text-slate-300 p-1 text-xs font-bold cursor-pointer"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg shrink-0 ${notif.resolved ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"}`}>
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${notif.resolved ? "text-emerald-400" : "text-amber-400"} flex items-center`}>
                    {notif.resolved ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                        Campaign Asset Linked Successfully!
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500 animate-pulse" />
                        Image Share Detected in Call Dialogue
                      </>
                    )}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {notif.context}
                  </p>
                </div>
              </div>

              {!notif.resolved && (
                <div className="flex items-center space-x-2 pl-11">
                  <label className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center space-x-1 shadow-md">
                    <Upload className="h-3 w-3" />
                    <span>UPLOAD & LINK NOW</span>
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
                              onResolveNotification(notif.id, reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={() => onDismissNotification(notif.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    DISMISS
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {currentTranscript.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
              <HelpCircle className="h-12 w-12 text-slate-600 animate-pulse" />
              <p className="text-sm text-slate-400 max-w-sm">
                No transcription captured yet. Speak using your microphone, type a D&D statement, or trigger one of the high-fidelity dialogue simulations below!
              </p>
            </div>
          ) : (
            currentTranscript.map((segment) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={segment.id}
                className={`p-3 rounded-lg border transition-all ${
                  segment.isKeyMention
                    ? "bg-amber-950/20 border-amber-800/50 shadow-inner"
                    : "bg-slate-800/30 border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${segment.isKeyMention ? "text-amber-400" : "text-slate-300"}`}>
                    {segment.speaker}
                  </span>
                  <span className="text-[10px] text-slate-500">{segment.timestamp}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{segment.text}</p>
                {segment.isKeyMention && (
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-amber-500">
                    <Sparkles className="h-3 w-3" />
                    <span>Party Historian indexed a key campaign revelation</span>
                  </div>
                )}
              </motion.div>
            ))
          )}
          {isAnalyzing && (
            <div className="flex items-center space-x-2 text-xs text-amber-500 italic p-2 bg-slate-800/10 border border-slate-800/40 rounded-lg">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-amber-500"></div>
              <span>Party Historian is analyzing campaign audio with Gemini...</span>
            </div>
          )}
        </div>

        {/* Input Interface */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800">
          {apiError && (
            <div className="mb-3 p-2 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-400 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleManualSend} className="flex space-x-2">
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-amber-500 max-w-[130px] truncate"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Type player dialogues manually (e.g. 'We met Sildar at the inn')"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 px-3 py-2 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-amber-500 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Side Column: Pluggable Integrations, Presets & Alerts */}
      <div className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[580px]">
        {/* Sidebar Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 shrink-0">
          <button
            onClick={() => setActiveSideTab("connectors")}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSideTab === "connectors"
                ? "bg-slate-800 text-amber-400 border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>CONNECTORS</span>
          </button>
          <button
            onClick={() => setActiveSideTab("call")}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSideTab === "call"
                ? "bg-slate-800 text-amber-400 border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-3 w-3" />
            <span>CALL FEEDS</span>
          </button>
          <button
            onClick={() => setActiveSideTab("reminders")}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all relative cursor-pointer ${
              activeSideTab === "reminders"
                ? "bg-slate-800 text-amber-400 border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bookmark className="h-3 w-3" />
            <span>LORE ALERTS</span>
            {activeReminders.length > 0 && (
              <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
            )}
            {activeReminders.length > 0 && (
              <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeSideTab === "connectors" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  Pluggable Audio Ingress Sources
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {connectors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConnectorId(c.id)}
                      className={`flex flex-col text-left p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedConnectorId === c.id
                          ? "bg-slate-800/80 border-amber-500 shadow-md shadow-amber-950/20"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-[10px] font-bold ${selectedConnectorId === c.id ? "text-amber-400" : "text-slate-300"}`}>
                          {c.type === "web-speech" ? "Browser Mic" : c.type === "google-meet" ? "Google Meet" : c.type === "ms-teams" ? "MS Teams" : "Discord"}
                        </span>
                        {c.status === "connected" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-500 line-clamp-2 leading-relaxed">
                        {c.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Connector Settings */}
              {(() => {
                const conn = connectors.find(c => c.id === selectedConnectorId);
                if (!conn) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={conn.id}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <Settings className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                          {conn.name} Ingress Config
                        </span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        conn.status === "connected" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                      }`}>
                        {conn.status.toUpperCase()}
                      </span>
                    </div>

                    {conn.type === "web-speech" && (
                      <div className="text-[10px] text-slate-400 space-y-2 leading-relaxed">
                        <p>No external credentials needed! Standard client-side Web Speech API is used to capture direct speech streams.</p>
                        <div className="p-2 bg-slate-900/40 rounded border border-slate-850 text-slate-500 italic">
                          Perfect for real-time play around the table with standard microphones.
                        </div>
                      </div>
                    )}

                    {conn.type === "google-meet" && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Google Meet Code / URL
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={conn.meetingUrl || ""}
                              onChange={(e) => handleUpdateConnectorParam(conn.id, "meetingUrl", e.target.value)}
                              placeholder="meet.google.com/abc-defg-hij"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                            <Link className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            GCP OAuth Client ID
                          </label>
                          <input
                            type="text"
                            value={conn.clientId || ""}
                            onChange={(e) => handleUpdateConnectorParam(conn.id, "clientId", e.target.value)}
                            placeholder="oauth_client_id.apps.googleusercontent.com"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-[9px] truncate"
                          />
                        </div>
                      </div>
                    )}

                    {conn.type === "ms-teams" && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Microsoft App ID (Client ID)
                          </label>
                          <input
                            type="text"
                            value={conn.clientId || ""}
                            onChange={(e) => handleUpdateConnectorParam(conn.id, "clientId", e.target.value)}
                            placeholder="00000000-0000-0000-0000-000000000000"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-[9px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Office 365 Tenant ID
                          </label>
                          <input
                            type="text"
                            value={conn.tenantId || ""}
                            onChange={(e) => handleUpdateConnectorParam(conn.id, "tenantId", e.target.value)}
                            placeholder="00000000-0000-0000-0000-000000000000"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-[9px]"
                          />
                        </div>
                      </div>
                    )}

                    {conn.type === "discord" && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Discord Bot Token
                          </label>
                          <input
                            type="password"
                            value={conn.botToken || ""}
                            onChange={(e) => handleUpdateConnectorParam(conn.id, "botToken", e.target.value)}
                            placeholder="MTE0OTM4NTM4...token"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-[9px]"
                          />
                        </div>
                        <div className="p-2 bg-slate-900/40 border border-slate-850 rounded text-[9px] text-slate-500 leading-normal">
                          Configures a registered Discord bot connected via WebSockets to feed raw audio buffers directly to our speech ingestion engine.
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      {conn.status === "connected" ? (
                        <button
                          onClick={() => handleDisconnectConnector(conn.id)}
                          className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded text-[10px] font-bold border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/20 transition-all cursor-pointer"
                        >
                          <WifiOff className="h-3 w-3" />
                          <span>DISCONNECT GATEWAY</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectConnector(conn.id)}
                          disabled={conn.status === "connecting"}
                          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            conn.status === "connecting"
                              ? "bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
                              : "bg-amber-500 text-slate-950 hover:bg-amber-600 font-bold shadow"
                          }`}
                        >
                          {conn.status === "connecting" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>CONNECTING...</span>
                            </>
                          ) : (
                            <>
                              <Wifi className="h-3 w-3" />
                              <span>CONNECT INTEGRATION</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expandable Deployment Blueprints */}
                    <details className="group border border-slate-800 bg-slate-900/20 rounded-lg overflow-hidden transition-all">
                      <summary className="flex justify-between items-center p-2 text-[9px] font-bold text-slate-400 uppercase tracking-wide cursor-pointer hover:bg-slate-800/40">
                        <div className="flex items-center space-x-1">
                          <Cpu className="h-3 w-3 text-amber-500" />
                          <span>Developer Deployment Notes</span>
                        </div>
                        <span className="transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="p-2 border-t border-slate-850 space-y-1.5 text-[9px] text-slate-400 leading-relaxed">
                        <p>
                          To implement physically in your own app:
                        </p>
                        <div className="bg-slate-950 p-1.5 rounded font-mono text-[8px] text-emerald-400 overflow-x-auto space-y-1">
                          <div>// Server-Side Event Listener Blueprint</div>
                          <div>app.post("/api/integrations/voice-webhook", async (req, res) =&gt; &#123;</div>
                          <div>&nbsp;&nbsp;const &#123; speakerName, audioData &#125; = req.body;</div>
                          <div>&nbsp;&nbsp;const transcript = await whisperSpeechToText(audioData);</div>
                          <div>&nbsp;&nbsp;const analysis = await gemini.analyze(transcript);</div>
                          <div>&nbsp;&nbsp;broadcastToWebsockets(&#123; speakerName, text: transcript &#125;);</div>
                          <div>&nbsp;&nbsp;res.json(&#123; ok: true &#125;);</div>
                          <div>&#125;);</div>
                        </div>
                        <p>
                          Our API layer is fully decoupled so any platform emitting formatted JSON speech segments can plug and play seamlessly!
                        </p>
                      </div>
                    </details>

                    {/* Monospace debug logs terminal */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-1 flex items-center font-mono">
                        <Terminal className="h-3 w-3 mr-1" />
                        Live Stream Debugger Logs
                      </span>
                      <div className="bg-slate-950 border border-slate-900 rounded-lg p-2 font-mono text-[8.5px] text-emerald-400 space-y-1 max-h-24 overflow-y-auto leading-normal">
                        {conn.logs.map((log, i) => (
                          <div key={i} className="whitespace-pre-wrap">{log}</div>
                        ))}
                        {conn.status === "connecting" && (
                          <div className="text-amber-400 animate-pulse">● Waiting for authorization socket payload...</div>
                        )}
                        {conn.status === "connected" && (
                          <div className="text-emerald-500 flex items-center space-x-1 text-[8px]">
                            <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping"></span>
                            <span>● STREAMING ACTIVE (24kb/s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          ) : activeSideTab === "call" ? (
            <>
              {/* Audio Source Selector */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Audio Ingestion Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInputSource("mic")}
                    className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                      inputSource === "mic"
                        ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <Mic className="h-3 w-3" />
                    <span>My Mic Only</span>
                  </button>
                  <button
                    onClick={() => setInputSource("call")}
                    className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                      inputSource === "call"
                        ? "bg-amber-500/10 border-amber-500/60 text-amber-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <Radio className="h-3 w-3" />
                    <span>Entire Call Feed</span>
                  </button>
                </div>
              </div>

              {/* Call Automation Controller */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center font-mono">
                    <Disc className={`h-3.5 w-3.5 mr-1.5 text-amber-500 ${isAutoplayRunning ? "animate-spin" : ""}`} />
                    Live Call Autoplay Sim
                  </span>
                  <span className="text-[9px] text-slate-500">Continuous Dialogue</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                  Toggle autoplay to simulate incoming voices from multiple participants speaking in sequence.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsAutoplayRunning(!isAutoplayRunning)}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      isAutoplayRunning
                        ? "bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30"
                        : "bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse"
                    }`}
                  >
                    {isAutoplayRunning ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>PAUSE AUTO-FEED</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>START AUTOPLAY SIM</span>
                      </>
                    )}
                  </button>
                  {isAutoplayRunning && (
                    <div className="flex items-center justify-center px-2 bg-slate-900 border border-slate-800 rounded text-amber-500 animate-pulse">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Call Participants List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Call Participants ({participants.length})
                  </span>
                  <span className="text-[9px] text-emerald-500 flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                    Voice connected
                  </span>
                </div>

                <div className="space-y-1.5">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all bg-slate-950/40 ${
                        p.isSpeaking
                          ? "border-amber-500 bg-amber-500/5 animate-pulse"
                          : "border-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${p.color}`}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 flex items-center">
                            {p.name}
                            {p.isSpeaking && (
                              <span className="ml-1.5 text-[9px] text-amber-400 font-mono animate-pulse uppercase tracking-widest">
                                SPEAKING
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-500">{p.role}</div>
                        </div>
                      </div>

                      {/* Speaking Equalizer waves */}
                      <div className="flex items-center space-x-1.5">
                        {p.isSpeaking ? (
                          <div className="flex items-end space-x-0.5 h-3">
                            <span className="w-0.5 bg-amber-400 h-1 rounded-full animate-bounce"></span>
                            <span className="w-0.5 bg-amber-400 h-3 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-0.5 bg-amber-400 h-2 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        ) : (
                          <div className="flex items-end space-x-0.5 h-3 opacity-20">
                            <div className="w-0.5 bg-slate-600 h-1"></div>
                            <div className="w-0.5 bg-slate-600 h-1"></div>
                            <div className="w-0.5 bg-slate-600 h-1"></div>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setParticipants(prev =>
                              prev.map(part => (part.id === p.id ? { ...part, isMuted: !part.isMuted } : part))
                            );
                          }}
                          className={`p-1 rounded text-slate-500 hover:text-slate-300 transition-colors hover:bg-slate-800 cursor-pointer`}
                          title={p.isMuted ? "Unmute participant" : "Mute participant"}
                        >
                          {p.isMuted ? <VolumeX className="h-3 w-3 text-red-500" /> : <Volume2 className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Voice Simulator presets */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">
                  Manual Call Presets (Click to Play)
                </span>
                <div className="space-y-1.5">
                  {VOICE_SIMULATIONS.map((sim, index) => (
                    <button
                      key={index}
                      onClick={() => triggerSimulation(sim.transcript)}
                      className="w-full text-left bg-slate-800/20 hover:bg-slate-800/60 border border-slate-800 hover:border-amber-950/40 p-2 rounded-lg text-[11px] transition-all flex justify-between items-center group cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-300 block group-hover:text-amber-400 truncate">
                          {sim.title}
                        </span>
                        <span className="text-[9px] text-slate-500 italic block truncate">
                          "{sim.transcript}"
                        </span>
                      </div>
                      <Play className="h-3.5 w-3.5 text-amber-500 group-hover:scale-125 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3 h-full flex flex-col justify-between">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence>
                  {activeReminders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-lg p-4">
                      <Sparkles className="h-8 w-8 text-slate-600 mb-2" />
                      <span>No active alerts right now. Speak or type about Gundren, Sildar, Glasstaff, Agatha, or Tresendar Manor to see real-time lore context!</span>
                    </div>
                  ) : (
                    activeReminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`p-3 rounded-lg border text-xs shadow-md relative overflow-hidden ${
                          reminder.severity === "warning"
                            ? "bg-red-950/20 border-red-800/40 text-red-200"
                            : "bg-amber-950/20 border-amber-800/40 text-amber-100"
                        }`}
                      >
                        <div className="absolute top-0 right-0 h-full w-1 bg-amber-500"></div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold uppercase tracking-wider flex items-center">
                            <Sparkles className="h-3 w-3 mr-1 text-amber-500 animate-pulse" />
                            {reminder.entityName}
                          </span>
                          <span className="text-[9px] text-slate-400">{reminder.timestamp}</span>
                        </div>
                        <p className="leading-relaxed text-slate-300 text-[11px]">{reminder.reminderText}</p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
              <div className="p-2 border border-slate-800 bg-slate-950/40 rounded text-[10px] text-slate-500 leading-relaxed italic text-center">
                Lore alerts appear instantly based on AI speech analysis.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
