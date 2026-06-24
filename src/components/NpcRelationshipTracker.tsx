/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Heart, 
  ShieldAlert, 
  Coins, 
  Plus, 
  Trash2, 
  Sparkles, 
  Smile, 
  Frown, 
  BellRing,
  HelpCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { NpcRelationship } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface NpcRelationshipTrackerProps {
  relationships: NpcRelationship[];
  onAddRelationship: (item: NpcRelationship) => void;
  onUpdateRelationship: (id: string, updates: Partial<NpcRelationship>) => void;
  onDeleteRelationship: (id: string) => void;
  onClearNewMention: (id: string) => void;
}

export default function NpcRelationshipTracker({
  relationships,
  onAddRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onClearNewMention,
}: NpcRelationshipTrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStance, setSelectedStance] = useState<"ALL" | "Allied" | "Friendly" | "Neutral" | "Wary" | "Hostile">("ALL");
  const [showAddForm, setShowAddForm] = useState(false);

  // New relationship form state
  const [npcName, setNpcName] = useState("");
  const [stance, setStance] = useState<"Allied" | "Friendly" | "Neutral" | "Wary" | "Hostile">("Neutral");
  const [trustScore, setTrustScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [debts, setDebts] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!npcName.trim()) return;

    const newItem: NpcRelationship = {
      id: "manual-rel-" + Date.now(),
      campaignId: "phandelver",
      npcName: npcName.trim(),
      relationship: stance,
      trustScore: trustScore,
      notes: notes.trim(),
      debtsOrPromises: debts.trim(),
    };

    onAddRelationship(newItem);
    setNpcName("");
    setStance("Neutral");
    setTrustScore(0);
    setNotes("");
    setDebts("");
    setShowAddForm(false);
  };

  const filteredItems = relationships.filter((item) => {
    const matchesSearch =
      item.npcName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.debtsOrPromises.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lastUpdatedText && item.lastUpdatedText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStance = selectedStance === "ALL" || item.relationship === selectedStance;

    return matchesSearch && matchesStance;
  });

  const getStanceColor = (stance: "Allied" | "Friendly" | "Neutral" | "Wary" | "Hostile") => {
    switch (stance) {
      case "Allied":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Friendly":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "Neutral":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "Wary":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Hostile":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
  };

  const getTrustLabel = (score: number) => {
    if (score >= 7) return "Loyal Ally";
    if (score >= 3) return "Friendly";
    if (score >= -2 && score <= 2) return "Indifferent";
    if (score >= -6) return "Distrustful";
    return "Mortal Enemy";
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-xl" id="npc-relationship-tracker-container">
      {/* Header Panel */}
      <div className="bg-slate-950/80 px-6 py-5 border-b border-slate-800/80 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <span>NPC RELATIONSHIP TRACKER</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage the party's alignment, trust scores, favors, and outstanding debts with faction leaders and townspeople.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-black tracking-wide flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-rose-950/20"
        >
          <Plus className="h-4 w-4" />
          <span>TRACK NEW NPC</span>
        </button>
      </div>

      {/* Manual Track Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-950/40 border-b border-slate-800"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Begin Tracking NPC Stance</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NPC Name</label>
                  <input
                    type="text"
                    required
                    value={npcName}
                    onChange={(e) => setNpcName(e.target.value)}
                    placeholder="e.g., Sister Garaele"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stance Stance</label>
                  <select
                    value={stance}
                    onChange={(e) => setStance(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="Allied">Allied (Fully Committed)</option>
                    <option value="Friendly">Friendly (Willing to help)</option>
                    <option value="Neutral">Neutral (No stance)</option>
                    <option value="Wary">Wary (Suspicious/Cautious)</option>
                    <option value="Hostile">Hostile (Antagonistic)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Trust Score (-10 to +10)</label>
                  <input
                    type="number"
                    min={-10}
                    max={10}
                    value={trustScore}
                    onChange={(e) => setTrustScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relationship Notes / Memory</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why do they trust/hate us? What history do we share?"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Debts / Promises</label>
                  <textarea
                    value={debts}
                    onChange={(e) => setDebts(e.target.value)}
                    placeholder="We owe them 50gp, or they promised us a favor."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer"
                >
                  START TRACKING
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Panel */}
      <div className="p-4 bg-slate-950/20 border-b border-slate-850 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NPCs and notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Filter Stance:</span>
          <select
            value={selectedStance}
            onChange={(e) => setSelectedStance(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-rose-500 transition-colors"
          >
            <option value="ALL">All Stances</option>
            <option value="Allied">Allied</option>
            <option value="Friendly">Friendly</option>
            <option value="Neutral">Neutral</option>
            <option value="Wary">Wary</option>
            <option value="Hostile">Hostile</option>
          </select>
        </div>
      </div>

      {/* NPCs Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-2">
            <HelpCircle className="h-10 w-10 text-slate-600 animate-pulse" />
            <p className="text-xs">No NPCs tracked under this filter.</p>
            <p className="text-[10px] text-slate-600 italic">Click "TRACK NEW NPC" to log your relationships with the local factions!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layoutId={`rel-${item.id}`}
                className={`relative p-5 rounded-2xl border transition-all duration-300 group ${
                  item.isNewMention 
                    ? "bg-rose-500/10 border-rose-500 animate-pulse shadow-lg shadow-rose-950/30" 
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/60"
                }`}
              >
                {/* Real-time Voice Mention Flasher */}
                {item.isNewMention && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 animate-bounce shadow">
                    <BellRing className="h-2.5 w-2.5 animate-spin" />
                    <span>STANCE UPDATE DETECTED!</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getStanceColor(item.relationship)}`}>
                        {item.relationship}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        Trust: {item.trustScore > 0 ? `+${item.trustScore}` : item.trustScore} ({getTrustLabel(item.trustScore)})
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-100 mt-2.5 tracking-tight">
                      {item.npcName}
                    </h3>

                    {/* Trust Meter Visual Slider */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Hostile (-10)</span>
                        <span>Neutral (0)</span>
                        <span>Allied (+10)</span>
                      </div>
                      <div className="h-2 bg-slate-950 border border-slate-800/60 rounded-full overflow-hidden relative flex items-center">
                        <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-800 z-10"></div>
                        <div 
                          className={`h-full transition-all duration-500 ${
                            item.trustScore > 3 
                              ? "bg-gradient-to-r from-teal-500 to-emerald-500" 
                              : item.trustScore < -3 
                                ? "bg-gradient-to-r from-rose-500 to-red-500"
                                : "bg-gradient-to-r from-slate-500 to-amber-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, ((item.trustScore + 10) / 20) * 100))}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-slate-950/20 border border-slate-850/40 p-3 rounded-xl">
                      <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">Interaction Notes:</span>
                      {item.notes}
                    </p>

                    {item.debtsOrPromises && (
                      <div className="text-xs text-amber-300/90 mt-2 flex items-start space-x-1.5 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl font-medium">
                        <Coins className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[10px] uppercase text-amber-500 block mb-0.5">Debts, Favors & Promises:</span>
                          {item.debtsOrPromises}
                        </div>
                      </div>
                    )}

                    {/* AI Transcribed Mention Details */}
                    {item.lastUpdatedText && (
                      <div className={`mt-3.5 p-2.5 rounded-xl text-[11px] font-medium leading-relaxed ${
                        item.isNewMention 
                          ? "bg-rose-950/40 text-rose-300 border border-rose-500/30" 
                          : "bg-slate-900/60 text-slate-400 border border-slate-850"
                      }`}>
                        <div className="font-bold uppercase tracking-wider text-[8px] text-rose-500/80 mb-0.5 flex items-center">
                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                          Live Session Mention & Sentiment:
                        </div>
                        "{item.lastUpdatedText}"
                        
                        {item.isNewMention && (
                          <button
                            onClick={() => onClearNewMention(item.id)}
                            className="block mt-2 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            ACKNOWLEDGE SENTIMENT UPDATE
                          </button>
                        )}
                      </div>
                    )}

                    {/* Trust and Stance adjustments inside card */}
                    <div className="mt-4 pt-3 border-t border-slate-850 flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Trust:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onUpdateRelationship(item.id, { trustScore: Math.max(-10, item.trustScore - 1) })}
                          className="bg-slate-950 border border-slate-800 hover:bg-slate-800 p-1 rounded text-rose-400 cursor-pointer"
                          title="Decrease trust"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onUpdateRelationship(item.id, { trustScore: Math.min(10, item.trustScore + 1) })}
                          className="bg-slate-950 border border-slate-800 hover:bg-slate-800 p-1 rounded text-emerald-400 cursor-pointer"
                          title="Increase trust"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-500 font-bold uppercase ml-auto">Stance:</span>
                      <select
                        value={item.relationship}
                        onChange={(e) => onUpdateRelationship(item.id, { relationship: e.target.value as any })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-rose-500 transition-colors"
                      >
                        <option value="Allied">Allied</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Wary">Wary</option>
                        <option value="Hostile">Hostile</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteRelationship(item.id)}
                    className="text-slate-600 hover:text-rose-500 transition-colors p-1 self-start cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete permanently"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
