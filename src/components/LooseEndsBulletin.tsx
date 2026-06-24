/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Sparkles, 
  Filter, 
  BellRing,
  HelpCircle
} from "lucide-react";
import { LooseEndItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LooseEndsBulletinProps {
  looseEnds: LooseEndItem[];
  onAddLooseEnd: (item: LooseEndItem) => void;
  onToggleLooseEndStatus: (id: string) => void;
  onDeleteLooseEnd: (id: string) => void;
  onClearNewMention: (id: string) => void;
}

export default function LooseEndsBulletin({
  looseEnds,
  onAddLooseEnd,
  onToggleLooseEndStatus,
  onDeleteLooseEnd,
  onClearNewMention,
}: LooseEndsBulletinProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<"ALL" | "high" | "medium" | "low">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "unresolved" | "resolved">("unresolved");
  const [showAddForm, setShowAddForm] = useState(false);

  // New item form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"high" | "medium" | "low">("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: LooseEndItem = {
      id: "manual-loose-" + Date.now(),
      campaignId: "phandelver",
      title: title.trim(),
      description: description.trim(),
      status: "unresolved",
      severity: severity,
      dateAdded: new Date().toISOString().split("T")[0],
    };

    onAddLooseEnd(newItem);
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setShowAddForm(false);
  };

  const filteredItems = looseEnds.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lastUpdatedText && item.lastUpdatedText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = selectedSeverity === "ALL" || item.severity === selectedSeverity;
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-xl" id="loose-ends-bulletin-container">
      {/* Header Panel */}
      <div className="bg-slate-950/80 px-6 py-5 border-b border-slate-800/80 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>THE LOOSE ENDS BULLETIN</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track unresolved plot hooks, forgotten promises, and active quest threads.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black tracking-wide flex items-center space-x-2 transition-all shadow-md shadow-amber-950/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>ADD LOOSE END</span>
        </button>
      </div>

      {/* Manual Addition Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-950/40 border-b border-slate-800"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Log Unresolved Campaign Hook</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title / Hook Name</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., The Weird Goblet in Cragmaw Castle"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="high">High (Immediate Thread)</option>
                    <option value="medium">Medium (Side Quest/Promise)</option>
                    <option value="low">Low (Trifling Detail/Loot Mystery)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description & Context</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Who asked us to do this? What happens if we ignore it? What gold or item was promised?"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
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
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer"
                >
                  LOG HOOK
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
            placeholder="Search loose ends..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-3 w-3 text-slate-500" />
          
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="ALL">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Bulletins Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-2">
            <HelpCircle className="h-10 w-10 text-slate-600 animate-pulse" />
            <p className="text-xs">No loose ends match your filter criteria.</p>
            <p className="text-[10px] text-slate-600 italic">Try searching for something else or log a new hook thread above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layoutId={`loose-${item.id}`}
                className={`relative p-4 rounded-xl border transition-all duration-300 group ${
                  item.isNewMention 
                    ? "bg-amber-500/10 border-amber-500 animate-pulse shadow-lg shadow-amber-950/30" 
                    : item.status === "resolved"
                      ? "bg-slate-950/20 border-slate-850 opacity-60"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/60"
                }`}
              >
                {/* Real-time Update Flasher Badge */}
                {item.isNewMention && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 animate-bounce shadow">
                    <BellRing className="h-2.5 w-2.5 animate-spin" />
                    <span>UPDATED IN VOICE!</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onToggleLooseEndStatus(item.id)}
                    className="mt-0.5 text-slate-500 hover:text-amber-500 cursor-pointer shrink-0 transition-colors"
                    title={item.status === "resolved" ? "Mark as unresolved" : "Mark as resolved"}
                  >
                    {item.status === "resolved" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-600 hover:text-amber-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getSeverityBadge(item.severity)}`}>
                        {item.severity}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono flex items-center">
                        <Clock className="h-3 w-3 mr-0.5" />
                        Added: {item.dateAdded}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold mt-1.5 transition-all ${
                      item.status === "resolved" 
                        ? "line-through text-slate-500" 
                        : item.isNewMention 
                          ? "text-amber-400" 
                          : "text-slate-200 group-hover:text-amber-400"
                    }`}>
                      {item.title}
                    </h4>

                    <p className={`text-xs mt-1 leading-relaxed ${item.status === "resolved" ? "text-slate-600" : "text-slate-300"}`}>
                      {item.description}
                    </p>

                    {/* AI Transcribed Mention / Update Context details */}
                    {item.lastUpdatedText && (
                      <div className={`mt-3 p-2.5 rounded-lg text-[11px] font-medium leading-relaxed ${
                        item.isNewMention 
                          ? "bg-amber-950/40 text-amber-300 border border-amber-500/30" 
                          : "bg-slate-900/60 text-slate-400 border border-slate-850"
                      }`}>
                        <div className="font-bold uppercase tracking-wider text-[8px] text-amber-500/80 mb-0.5 flex items-center">
                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                          Voice Call Discovery / Progress:
                        </div>
                        "{item.lastUpdatedText}"
                        
                        {item.isNewMention && (
                          <button
                            onClick={() => onClearNewMention(item.id)}
                            className="block mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            ACKNOWLEDGE UPDATE
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteLooseEnd(item.id)}
                    className="text-slate-600 hover:text-rose-500 transition-colors p-1 self-start cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete item permanently"
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
