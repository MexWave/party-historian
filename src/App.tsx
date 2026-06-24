/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Volume2,
  BookOpen,
  MessageSquare,
  Users,
  Compass,
  LayoutGrid,
  Plus,
  RefreshCw,
  FolderKanban,
  FileText,
  Clock,
  Dices,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { Campaign, Session, Entity, TranscriptSegment, AssistantMessage, CampaignData, AIProviderType, ImagePromptNotification, LooseEndItem, NpcRelationship } from "./types";
import { DEFAULT_CAMPAIGN_DATA, DEFAULT_LOOSE_ENDS, DEFAULT_NPC_RELATIONSHIPS } from "./data";
import AudioSession from "./components/AudioSession";
import LoreAssistant from "./components/LoreAssistant";
import EntityTracker from "./components/EntityTracker";
import SessionHistory from "./components/SessionHistory";
import LooseEndsBulletin from "./components/LooseEndsBulletin";
import NpcRelationshipTracker from "./components/NpcRelationshipTracker";

export default function App() {
  // Campaign State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string>("phandelver");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  
  // Current Live active session state (pre-archived transcript lines)
  const [activeTranscript, setActiveTranscript] = useState<TranscriptSegment[]>([]);

  // Pluggable AI integration state
  const [selectedAiProvider, setSelectedAiProvider] = useState<AIProviderType>("gemini");
  const [localEndpoint, setLocalEndpoint] = useState<string>("http://localhost:1234/v1");
  const [localModel, setLocalModel] = useState<string>("local-model");

  // Linked session images for the upcoming compiled session
  const [activeSessionImages, setActiveSessionImages] = useState<string[]>([]);

  // Real-time voice image share alerts/notifications queue
  const [notifications, setNotifications] = useState<ImagePromptNotification[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<"audio" | "assistant" | "codex" | "sessions" | "looseends" | "npcrelations">("audio");
  
  // Loose Ends & NPC Relationships states
  const [looseEnds, setLooseEnds] = useState<LooseEndItem[]>([]);
  const [npcRelationships, setNpcRelationships] = useState<NpcRelationship[]>([]);

  // Tab Flashing alerts state
  const [tabFlash, setTabFlash] = useState<{
    audio: boolean;
    assistant: boolean;
    codex: boolean;
    sessions: boolean;
    looseends: boolean;
    npcrelations: boolean;
  }>({
    audio: false,
    assistant: false,
    codex: false,
    sessions: false,
    looseends: false,
    npcrelations: false,
  });
  
  // Create campaign dialog
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");

  // Load from local storage or set default data on initial load
  useEffect(() => {
    const savedCampaigns = localStorage.getItem("loreweaver_campaigns");
    const savedActiveId = localStorage.getItem("loreweaver_active_campaign_id");

    if (savedCampaigns && savedActiveId) {
      setCampaigns(JSON.parse(savedCampaigns));
      setActiveCampaignId(savedActiveId);
      loadCampaignSubData(savedActiveId);
    } else {
      // Setup default D&D data
      const defaultCampaign = DEFAULT_CAMPAIGN_DATA.campaign;
      setCampaigns([defaultCampaign]);
      setActiveCampaignId(defaultCampaign.id);
      
      localStorage.setItem("loreweaver_campaigns", JSON.stringify([defaultCampaign]));
      localStorage.setItem("loreweaver_active_campaign_id", defaultCampaign.id);

      setSessions(DEFAULT_CAMPAIGN_DATA.sessions);
      setEntities(DEFAULT_CAMPAIGN_DATA.entities);
      setMessages(DEFAULT_CAMPAIGN_DATA.messages);

      saveCampaignSubData(defaultCampaign.id, DEFAULT_CAMPAIGN_DATA.sessions, DEFAULT_CAMPAIGN_DATA.entities, DEFAULT_CAMPAIGN_DATA.messages);
    }

    // Load active transcript queue
    const savedActiveTranscript = localStorage.getItem("loreweaver_active_transcript");
    if (savedActiveTranscript) {
      setActiveTranscript(JSON.parse(savedActiveTranscript));
    }

    // Load provider preference
    const savedProvider = localStorage.getItem("loreweaver_ai_provider");
    if (savedProvider) {
      setSelectedAiProvider(savedProvider as AIProviderType);
    }

    // Load local endpoint and model settings
    const savedLocalEndpoint = localStorage.getItem("loreweaver_local_endpoint");
    if (savedLocalEndpoint) {
      setLocalEndpoint(savedLocalEndpoint);
    }
    const savedLocalModel = localStorage.getItem("loreweaver_local_model");
    if (savedLocalModel) {
      setLocalModel(savedLocalModel);
    }

    // Load upcoming session attached images
    const savedActiveImages = localStorage.getItem("loreweaver_active_images");
    if (savedActiveImages) {
      setActiveSessionImages(JSON.parse(savedActiveImages));
    }

    // Load real-time image upload notifications
    const savedNotifications = localStorage.getItem("loreweaver_notifications");
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // Save active transcript to local storage on changes
  useEffect(() => {
    localStorage.setItem("loreweaver_active_transcript", JSON.stringify(activeTranscript));
  }, [activeTranscript]);

  // Save AI Provider on changes
  useEffect(() => {
    localStorage.setItem("loreweaver_ai_provider", selectedAiProvider);
  }, [selectedAiProvider]);

  // Save local AI configs
  useEffect(() => {
    localStorage.setItem("loreweaver_local_endpoint", localEndpoint);
  }, [localEndpoint]);

  useEffect(() => {
    localStorage.setItem("loreweaver_local_model", localModel);
  }, [localModel]);

  // Save active session images queue
  useEffect(() => {
    localStorage.setItem("loreweaver_active_images", JSON.stringify(activeSessionImages));
  }, [activeSessionImages]);

  // Save voice notifications state
  useEffect(() => {
    localStorage.setItem("loreweaver_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const loadCampaignSubData = (campaignId: string) => {
    const sessionsKey = `loreweaver_sessions_${campaignId}`;
    const entitiesKey = `loreweaver_entities_${campaignId}`;
    const messagesKey = `loreweaver_messages_${campaignId}`;
    const looseEndsKey = `loreweaver_looseends_${campaignId}`;
    const npcKey = `loreweaver_npc_relationships_${campaignId}`;

    const savedSessions = localStorage.getItem(sessionsKey);
    const savedEntities = localStorage.getItem(entitiesKey);
    const savedMessages = localStorage.getItem(messagesKey);
    const savedLooseEnds = localStorage.getItem(looseEndsKey);
    const savedNpc = localStorage.getItem(npcKey);

    if (savedSessions) setSessions(JSON.parse(savedSessions));
    else setSessions([]);

    if (savedEntities) setEntities(JSON.parse(savedEntities));
    else setEntities([]);

    if (savedMessages) setMessages(JSON.parse(savedMessages));
    else setMessages([]);

    if (savedLooseEnds) {
      setLooseEnds(JSON.parse(savedLooseEnds));
    } else {
      if (campaignId === "phandelver") {
        setLooseEnds(DEFAULT_LOOSE_ENDS);
        localStorage.setItem(looseEndsKey, JSON.stringify(DEFAULT_LOOSE_ENDS));
      } else {
        setLooseEnds([]);
      }
    }

    if (savedNpc) {
      setNpcRelationships(JSON.parse(savedNpc));
    } else {
      if (campaignId === "phandelver") {
        setNpcRelationships(DEFAULT_NPC_RELATIONSHIPS);
        localStorage.setItem(npcKey, JSON.stringify(DEFAULT_NPC_RELATIONSHIPS));
      } else {
        setNpcRelationships([]);
      }
    }
  };

  const saveCampaignSubData = (
    campaignId: string,
    currentSessions: Session[],
    currentEntities: Entity[],
    currentMessages: AssistantMessage[],
    currentLooseEnds?: LooseEndItem[],
    currentNpcRelationships?: NpcRelationship[]
  ) => {
    localStorage.setItem(`loreweaver_sessions_${campaignId}`, JSON.stringify(currentSessions));
    localStorage.setItem(`loreweaver_entities_${campaignId}`, JSON.stringify(currentEntities));
    localStorage.setItem(`loreweaver_messages_${campaignId}`, JSON.stringify(currentMessages));
    if (currentLooseEnds) {
      localStorage.setItem(`loreweaver_looseends_${campaignId}`, JSON.stringify(currentLooseEnds));
    }
    if (currentNpcRelationships) {
      localStorage.setItem(`loreweaver_npc_relationships_${campaignId}`, JSON.stringify(currentNpcRelationships));
    }
  };

  // Switch Campaigns
  const handleCampaignSwitch = (campaignId: string) => {
    setActiveCampaignId(campaignId);
    localStorage.setItem("loreweaver_active_campaign_id", campaignId);
    loadCampaignSubData(campaignId);
    setActiveTab("audio");
  };

  // Add new Campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    const newCampaign: Campaign = {
      id: Math.random().toString(36).substring(7),
      name: newCampaignName,
      description: newCampaignDesc || "Explore magical worlds and weave epic stories.",
      createdAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
    };

    const updatedList = [...campaigns, newCampaign];
    setCampaigns(updatedList);
    localStorage.setItem("loreweaver_campaigns", JSON.stringify(updatedList));

    // Switch to new empty campaign
    setActiveCampaignId(newCampaign.id);
    localStorage.setItem("loreweaver_active_campaign_id", newCampaign.id);

    setSessions([]);
    setEntities([]);
    setMessages([
      {
        id: "wel-msg",
        role: "assistant",
        content: `Welcome to **${newCampaignName}**, hero! I am ready to chronicle your custom voice calls and help you recall campaign history. Start typing or record.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    saveCampaignSubData(newCampaign.id, [], [], [
      {
        id: "wel-msg",
        role: "assistant",
        content: `Welcome to **${newCampaignName}**, hero! I am ready to chronicle your custom voice calls and help you recall campaign history. Start typing or record.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setNewCampaignName("");
    setNewCampaignDesc("");
    setShowCreateCampaign(false);
    setActiveTab("audio");
  };

  // Add message from Lore Assistant
  const handleAddMessage = (newMsg: AssistantMessage) => {
    const updated = [...messages, newMsg];
    setMessages(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, updated);
  };

  // Add Entities extracted in audio session
  const handleNewEntitiesExtracted = (newExtracted: any[]) => {
    const updatedEntities = [...entities];
    let addedAny = false;

    newExtracted.forEach((ext) => {
      // Check if entity with same name already exists (case-insensitive)
      const exists = updatedEntities.some((e) => e.name.toLowerCase() === ext.name.toLowerCase());
      if (!exists) {
        const entity: Entity = {
          id: Math.random().toString(36).substring(7),
          campaignId: activeCampaignId,
          name: ext.name,
          type: ext.type,
          description: ext.description,
          firstSessionNumber: sessions.length + 1,
          lastSpottedSessionNumber: sessions.length + 1,
          tags: ext.tags || [ext.type.toLowerCase()],
          notes: ext.notes || "Auto-extracted during voice call analysis.",
        };
        updatedEntities.push(entity);
        addedAny = true;
      }
    });

    if (addedAny) {
      setEntities(updatedEntities);
      saveCampaignSubData(activeCampaignId, sessions, updatedEntities, messages);
    }
  };

  const handleAddEntity = (manualEntity: Entity) => {
    const updated = [...entities, manualEntity];
    setEntities(updated);
    saveCampaignSubData(activeCampaignId, sessions, updated, messages);
  };

  const handleTranscriptAdded = (segment: TranscriptSegment) => {
    setActiveTranscript((prev) => [...prev, segment]);
  };

  // --- LOOSE ENDS HANDLERS ---
  const handleAddLooseEnd = (newItem: LooseEndItem) => {
    const updated = [...looseEnds, newItem];
    setLooseEnds(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, updated, npcRelationships);
  };

  const handleToggleLooseEndStatus = (id: string) => {
    const updated = looseEnds.map((item) => {
      if (item.id === id) {
        return { ...item, status: item.status === "resolved" ? "unresolved" : "resolved" as any };
      }
      return item;
    });
    setLooseEnds(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, updated, npcRelationships);
  };

  const handleDeleteLooseEnd = (id: string) => {
    const updated = looseEnds.filter((item) => item.id !== id);
    setLooseEnds(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, updated, npcRelationships);
  };

  const handleClearLooseEndNewMention = (id: string) => {
    const updated = looseEnds.map((item) => {
      if (item.id === id) {
        return { ...item, isNewMention: false };
      }
      return item;
    });
    setLooseEnds(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, updated, npcRelationships);
  };

  const handleLooseEndsUpdatesDetected = (updates: any[]) => {
    let changed = false;
    const updated = looseEnds.map((item) => {
      // Try to find matching update by ID or looseEndId or Title
      const match = updates.find(
        (u) => u.looseEndId === item.id || item.title.toLowerCase().includes(u.title?.toLowerCase() || "")
      );
      if (match) {
        changed = true;
        return {
          ...item,
          lastUpdatedText: match.updateText,
          isNewMention: true, // triggers visual flash on card!
          status: match.isResolved ? "resolved" as any : item.status,
        };
      }
      return item;
    });

    if (changed) {
      setLooseEnds(updated);
      saveCampaignSubData(activeCampaignId, sessions, entities, messages, updated, npcRelationships);
      // Flash the "looseends" tab!
      setTabFlash((prev) => ({ ...prev, looseends: true }));
    }
  };

  // --- NPC RELATIONSHIPS HANDLERS ---
  const handleAddRelationship = (newItem: NpcRelationship) => {
    const updated = [...npcRelationships, newItem];
    setNpcRelationships(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, looseEnds, updated);
  };

  const handleUpdateRelationship = (id: string, fields: Partial<NpcRelationship>) => {
    const updated = npcRelationships.map((item) => {
      if (item.id === id) {
        return { ...item, ...fields };
      }
      return item;
    });
    setNpcRelationships(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, looseEnds, updated);
  };

  const handleDeleteRelationship = (id: string) => {
    const updated = npcRelationships.filter((item) => item.id !== id);
    setNpcRelationships(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, looseEnds, updated);
  };

  const handleClearNpcNewMention = (id: string) => {
    const updated = npcRelationships.map((item) => {
      if (item.id === id) {
        return { ...item, isNewMention: false };
      }
      return item;
    });
    setNpcRelationships(updated);
    saveCampaignSubData(activeCampaignId, sessions, entities, messages, looseEnds, updated);
  };

  const handleNpcUpdatesDetected = (updates: any[]) => {
    let changed = false;
    const updated = npcRelationships.map((item) => {
      const match = updates.find(
        (u) => item.npcName.toLowerCase().includes(u.npcName?.toLowerCase() || "") || u.npcName?.toLowerCase().includes(item.npcName.toLowerCase())
      );
      if (match) {
        changed = true;
        const newTrust = Math.min(10, Math.max(-10, item.trustScore + (match.trustScoreChange || 0)));
        return {
          ...item,
          lastUpdatedText: match.updateText,
          isNewMention: true, // triggers visual flash on card!
          relationship: match.stanceChange && ['Allied', 'Friendly', 'Neutral', 'Wary', 'Hostile'].includes(match.stanceChange) 
            ? match.stanceChange as any 
            : item.relationship,
          trustScore: newTrust,
        };
      }
      return item;
    });

    if (changed) {
      setNpcRelationships(updated);
      saveCampaignSubData(activeCampaignId, sessions, entities, messages, looseEnds, updated);
      // Flash the "npcrelations" tab!
      setTabFlash((prev) => ({ ...prev, npcrelations: true }));
    }
  };

  const handleTriggerTabFlash = (tab: string) => {
    setTabFlash((prev) => ({ ...prev, [tab]: true }));
  };

  const handleSessionArchived = (newSession: Session) => {
    const sessionWithImages: Session = {
      ...newSession,
      images: activeSessionImages.length > 0 ? [...activeSessionImages] : []
    };
    const updatedSessions = [...sessions, sessionWithImages];
    setSessions(updatedSessions);
    saveCampaignSubData(activeCampaignId, updatedSessions, entities, messages);
    setActiveSessionImages([]); // Reset active session image attachment queue
  };

  // Image Linkage & Provider Helpers
  const handleAddImageToSession = (sessionId: string, base64Image: string) => {
    const updatedSessions = sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          images: s.images ? [...s.images, base64Image] : [base64Image]
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    saveCampaignSubData(activeCampaignId, updatedSessions, entities, messages);
  };

  const handleAddImageToEntity = (entityId: string, base64Image: string) => {
    const updatedEntities = entities.map((e) => {
      if (e.id === entityId) {
        return {
          ...e,
          images: e.images ? [...e.images, base64Image] : [base64Image]
        };
      }
      return e;
    });
    setEntities(updatedEntities);
    saveCampaignSubData(activeCampaignId, sessions, updatedEntities, messages);
  };

  const handleImageSharedDetected = (contextText: string, suggestedName: string) => {
    const newNotif: ImagePromptNotification = {
      id: Math.random().toString(36).substring(7),
      detectedText: contextText,
      suggestedName: suggestedName,
      context: `Spoken dialogue indicates that an image or map was shared ("${contextText}"). Would you like to upload and link this visual asset to Session #${sessions.length + 1}'s chronicle log?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      sessionNumber: sessions.length + 1,
      dismissed: false,
      resolved: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleResolveNotification = (id: string, base64Image?: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, resolved: true } : n))
    );
    if (base64Image) {
      setActiveSessionImages((prev) => [...prev, base64Image]);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );
  };

  const currentCampaign = campaigns.find((c) => c.id === activeCampaignId) || campaigns[0];

  const handleResetDemo = () => {
    if (confirm("Reset local campaign state back to initial default values? This will wipe custom changes.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 font-sans relative overflow-hidden">
      {/* Decorative cosmic stars background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

      {/* WINDOW SHELL HEADER (Windows App UI Style) */}
      <header className="bg-slate-900 border-b border-slate-800 flex justify-between items-center px-4 py-3 z-10 shadow-lg shrink-0">
        <div className="flex items-center space-x-3">
          {/* Decorative D20 Logo */}
          <div className="p-1.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg shadow-md shadow-amber-950 flex items-center justify-center">
            <Dices className="h-5 w-5 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-serif font-bold tracking-wider text-amber-500">Party Historian</span>
              <span className="text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400 font-semibold uppercase tracking-widest">
                v1.2.0 Win-Preview
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Virtual Campaign Assistant & D&D Voice call monitor
            </p>
          </div>
        </div>

        {/* Campaign Selection Drawer */}
        <div className="flex items-center space-x-3">
          {/* AI Provider selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2 py-1.5 rounded-lg" title="AI Provider Select">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <select
              value={selectedAiProvider}
              onChange={(e) => setSelectedAiProvider(e.target.value as any)}
              className="bg-transparent border-none text-xs text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="gemini" className="bg-slate-900 text-slate-200">AI: Google Gemini</option>
              <option value="openai" className="bg-slate-900 text-slate-200">AI: OpenAI GPT-4</option>
              <option value="anthropic" className="bg-slate-900 text-slate-200">AI: Anthropic Claude</option>
              <option value="local" className="bg-slate-900 text-slate-200">AI: Local (LM Studio/Ollama)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1.5 rounded-lg">
            <FolderKanban className="h-4 w-4 text-slate-500 ml-1" />
            <select
              value={activeCampaignId}
              onChange={(e) => handleCampaignSwitch(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-300 px-2 py-0.5 font-bold focus:outline-none"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateCampaign(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-800 p-2 rounded-lg cursor-pointer flex items-center transition-all hover:scale-105"
            title="Create Custom Campaign Board"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={handleResetDemo}
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-lg cursor-pointer flex items-center transition-all hover:text-amber-500"
            title="Reset Board"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Static Windows Window Controls for Authentic UI aesthetic */}
          <div className="hidden sm:flex items-center space-x-1.5 pl-4 border-l border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-amber-500 transition-colors" title="Minimize"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-emerald-500 transition-colors" title="Maximize"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-red-500 transition-colors" title="Close Workspace"></div>
          </div>
        </div>
      </header>

      {/* LOCAL AI PROVIDER CONFIGURATION PANEL */}
      {selectedAiProvider === "local" && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center gap-4 text-xs shrink-0 z-10 shadow-inner">
          <div className="flex items-center space-x-2 text-amber-500 font-bold shrink-0">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="tracking-wide uppercase text-[10px]">Local Model Configuration</span>
          </div>
          <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
            <span className="text-slate-400 font-medium whitespace-nowrap">API Endpoint:</span>
            <input
              type="text"
              value={localEndpoint}
              onChange={(e) => setLocalEndpoint(e.target.value)}
              placeholder="e.g., http://localhost:1234/v1"
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono text-xs w-full max-w-[280px] focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="flex items-center space-x-2 flex-1 min-w-[180px]">
            <span className="text-slate-400 font-medium whitespace-nowrap">Model Name:</span>
            <input
              type="text"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder="e.g., local-model"
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono text-xs w-full max-w-[200px] focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="text-[10px] text-slate-500 shrink-0 italic">
            LM Studio / Ollama active? If connection fails/timeouts, simulated offline fallback logic will trigger.
          </div>
        </div>
      )}

      {/* MAIN CONTAINER PANEL */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6 z-10 flex flex-col justify-between">
        {/* Campaign Info Card */}
        {currentCampaign && (
          <div className="mb-6 bg-gradient-to-r from-slate-900/60 to-slate-900/20 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shrink-0">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100 flex items-center">
                  {currentCampaign.name}
                  <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                    Active Board
                  </span>
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl mt-0.5">
                  {currentCampaign.description}
                </p>
              </div>
            </div>

            {/* Micro Stats */}
            <div className="flex space-x-4 shrink-0 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sessions</span>
                <span className="text-sm font-black text-amber-500">{sessions.length}</span>
              </div>
              <div className="w-px bg-slate-850 h-8 self-center"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Entities</span>
                <span className="text-sm font-black text-amber-500">{entities.length}</span>
              </div>
              <div className="w-px bg-slate-850 h-8 self-center"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unsaved Log Lines</span>
                <span className="text-sm font-black text-amber-500">{activeTranscript.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="flex border-b border-slate-800/80 mb-6 gap-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("audio");
              setTabFlash((prev) => ({ ...prev, audio: false }));
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide flex items-center space-x-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "audio"
                ? "bg-slate-900 border-amber-500 text-amber-400"
                : tabFlash.audio
                ? "border-amber-500 text-amber-300 bg-amber-500/10 animate-pulse font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>VOICE CALL LISTENER</span>
            {activeTranscript.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 text-[9px] rounded-full">
                {activeTranscript.length}
              </span>
            )}
            {tabFlash.audio && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("assistant");
              setTabFlash((prev) => ({ ...prev, assistant: false }));
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide flex items-center space-x-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "assistant"
                ? "bg-slate-900 border-amber-500 text-amber-400"
                : tabFlash.assistant
                ? "border-amber-500 text-amber-300 bg-amber-500/10 animate-pulse font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>HISTORIAN COMPANION</span>
            {tabFlash.assistant && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("codex");
              setTabFlash((prev) => ({ ...prev, codex: false }));
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide flex items-center space-x-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "codex"
                ? "bg-slate-900 border-amber-500 text-amber-400"
                : tabFlash.codex
                ? "border-amber-500 text-amber-300 bg-amber-500/10 animate-pulse font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>CAMPAIGN CODEX</span>
            <span className="bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 text-[9px] rounded-full">
              {entities.length}
            </span>
            {tabFlash.codex && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("sessions");
              setTabFlash((prev) => ({ ...prev, sessions: false }));
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide flex items-center space-x-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "sessions"
                ? "bg-slate-900 border-amber-500 text-amber-400"
                : tabFlash.sessions
                ? "border-amber-500 text-amber-300 bg-amber-500/10 animate-pulse font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>SESSION CHRONICLES</span>
            <span className="bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 text-[9px] rounded-full">
              {sessions.length}
            </span>
            {tabFlash.sessions && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("looseends");
              setTabFlash((prev) => ({ ...prev, looseends: false }));
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide flex items-center space-x-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "looseends"
                ? "bg-slate-900 border-amber-500 text-amber-400"
                : tabFlash.looseends
                ? "border-rose-500 text-rose-300 bg-rose-500/10 animate-pulse font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>LOOSE ENDS</span>
            <span className="bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 text-[9px] rounded-full">
              {looseEnds.filter((i) => i.status === "unresolved").length}
            </span>
            {tabFlash.looseends && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("npcrelations");
              setTabFlash((prev) => ({ ...prev, npcrelations: false }));
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide flex items-center space-x-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "npcrelations"
                ? "bg-slate-900 border-amber-500 text-amber-400"
                : tabFlash.npcrelations
                ? "border-emerald-500 text-emerald-300 bg-emerald-500/10 animate-pulse font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>NPC STANDINGS</span>
            <span className="bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 text-[9px] rounded-full">
              {npcRelationships.length}
            </span>
            {tabFlash.npcrelations && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
          </button>
        </div>

        {/* TAB WORKSPACE INNER PANELS */}
        <div className="flex-1 min-h-[580px] mb-4">
          {activeTab === "audio" && (
            <AudioSession
              campaign={currentCampaign}
              knownEntities={entities}
              onNewEntitiesExtracted={handleNewEntitiesExtracted}
              onTranscriptAdded={handleTranscriptAdded}
              currentTranscript={activeTranscript}
              aiProvider={selectedAiProvider}
              onImageSharedDetected={handleImageSharedDetected}
              notifications={notifications}
              onResolveNotification={handleResolveNotification}
              onDismissNotification={handleDismissNotification}
              activeSessionImages={activeSessionImages}
              localEndpoint={localEndpoint}
              localModel={localModel}
              looseEnds={looseEnds}
              npcRelationships={npcRelationships}
              onLooseEndsUpdatesDetected={handleLooseEndsUpdatesDetected}
              onNpcUpdatesDetected={handleNpcUpdatesDetected}
              onTriggerTabFlash={handleTriggerTabFlash}
            />
          )}

          {activeTab === "assistant" && (
            <LoreAssistant
              campaign={currentCampaign}
              sessions={sessions}
              entities={entities}
              messages={messages}
              onAddMessage={handleAddMessage}
              aiProvider={selectedAiProvider}
              localEndpoint={localEndpoint}
              localModel={localModel}
            />
          )}

          {activeTab === "codex" && (
            <EntityTracker 
              entities={entities} 
              onAddEntity={handleAddEntity} 
              onAddImageToEntity={handleAddImageToEntity}
            />
          )}

          {activeTab === "sessions" && (
            <SessionHistory
              campaign={currentCampaign}
              sessions={sessions}
              activeTranscript={activeTranscript}
              onSessionArchived={handleSessionArchived}
              onClearActiveTranscript={() => setActiveTranscript([])}
              aiProvider={selectedAiProvider}
              onAddImageToSession={handleAddImageToSession}
              localEndpoint={localEndpoint}
              localModel={localModel}
            />
          )}

          {activeTab === "looseends" && (
            <LooseEndsBulletin
              looseEnds={looseEnds}
              onAddLooseEnd={handleAddLooseEnd}
              onToggleLooseEndStatus={handleToggleLooseEndStatus}
              onDeleteLooseEnd={handleDeleteLooseEnd}
              onClearNewMention={handleClearLooseEndNewMention}
            />
          )}

          {activeTab === "npcrelations" && (
            <NpcRelationshipTracker
              relationships={npcRelationships}
              onAddRelationship={handleAddRelationship}
              onUpdateRelationship={handleUpdateRelationship}
              onDeleteRelationship={handleDeleteRelationship}
              onClearNewMention={handleClearNpcNewMention}
            />
          )}
        </div>
      </main>

      {/* DIALOG BOX: CREATE CUSTOM CAMPAIGN BOARD */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 mb-1">
              <Plus className="h-5 w-5 text-amber-500" />
              <span>Create New Campaign Board</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Set up a blank chronicle board to record your own homebrew campaign sessions from scratch.
            </p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Critical Role: Wildemount"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Campaign Backdrop / Description</label>
                <textarea
                  placeholder="Describe the setting, main conflict, and context..."
                  rows={3}
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaign(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  CREATE BOARD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER BAR (Windows System Status Bar Style) */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2 shrink-0">
        <div className="flex items-center space-x-3.5">
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            SYSTEM: ONLINE
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center">
            <Volume2 className="h-3.5 w-3.5 text-slate-500 mr-1" />
            MIC GAIN: OK
          </span>
          <span className="text-slate-700">|</span>
          <span>CAMP_ID: <span className="font-mono text-slate-300">{activeCampaignId}</span></span>
        </div>
        <div className="flex items-center space-x-3.5">
          <span className="text-slate-500 font-semibold tracking-wider">
            {selectedAiProvider === "gemini" && "GOOGLE GEMINI 3.5 LORE ENGINE"}
            {selectedAiProvider === "openai" && "OPENAI GPT-4 LORE ENGINE"}
            {selectedAiProvider === "anthropic" && "ANTHROPIC CLAUDE 3.5 LORE ENGINE"}
            {selectedAiProvider === "local" && "LOCAL DEVELOPER LORE ENGINE"}
          </span>
          <span className="text-slate-700">|</span>
          <span className="font-mono text-slate-300 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            UTC: 2026-06-24
          </span>
        </div>
      </footer>
    </div>
  );
}
