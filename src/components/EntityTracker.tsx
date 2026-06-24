/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Plus, Bookmark, Users, MapPin, Sword, ShieldAlert, Sparkles, Filter, X, Upload } from "lucide-react";
import { Entity, EntityType } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface EntityTrackerProps {
  entities: Entity[];
  onAddEntity: (entity: Entity) => void;
  onAddImageToEntity: (entityId: string, base64Image: string) => void;
}

export default function EntityTracker({ entities, onAddEntity, onAddImageToEntity }: EntityTrackerProps) {
  const [selectedType, setSelectedType] = useState<EntityType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<EntityType>("NPC");
  const [newDesc, setNewDesc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newTagsString, setNewTagsString] = useState("");

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesc.trim()) return;

    const tags = newTagsString
      ? newTagsString.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const newEntity: Entity = {
      id: Math.random().toString(36).substring(7),
      campaignId: "phandelver",
      name: newName,
      type: newType,
      description: newDesc,
      firstSessionNumber: 2, // assume current
      lastSpottedSessionNumber: 2,
      tags,
      notes: newNotes,
    };

    onAddEntity(newEntity);

    // Reset Form
    setNewName("");
    setNewDesc("");
    setNewNotes("");
    setNewTagsString("");
    setShowAddForm(false);
  };

  const getIconForType = (type: EntityType) => {
    switch (type) {
      case "NPC":
        return <Users className="h-4 w-4 text-sky-400" />;
      case "Location":
        return <MapPin className="h-4 w-4 text-emerald-400" />;
      case "Item":
        return <Sword className="h-4 w-4 text-amber-400" />;
      case "Quest":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
    }
  };

  const getTypeColor = (type: EntityType) => {
    switch (type) {
      case "NPC":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Location":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Item":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Quest":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
  };

  // Filter & Search logic
  const filteredEntities = entities.filter((e) => {
    const matchesType = selectedType === "ALL" || e.type === selectedType;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div id="entity-tracker-section" className="flex flex-col h-[580px]">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-slate-900/40 border border-slate-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search NPC codex, locations, quests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs pl-9 pr-4 py-2 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Categories Tab list */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          <Filter className="h-3.5 w-3.5 text-slate-500 mr-1 hidden md:block" />
          {(["ALL", "NPC", "Location", "Item", "Quest"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedType(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                selectedType === tab
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {tab === "ALL" ? "All Lore" : `${tab}s`}
            </button>
          ))}
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-slate-800 hover:bg-slate-700 border border-amber-900/50 hover:border-amber-500/40 text-amber-500 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>ADD MANUAL ENTRY</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredEntities.map((entity) => (
              <motion.div
                key={entity.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg hover:shadow-2xl relative overflow-hidden group"
              >
                {/* Background glow effects */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform"></div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeColor(entity.type)}`}>
                      {getIconForType(entity.type)}
                      <span>{entity.type}</span>
                    </span>
                    <div className="flex items-center space-x-2.5">
                      <label className="flex items-center space-x-1 text-[9px] text-slate-400 hover:text-amber-400 cursor-pointer transition-colors" title="Link visual asset">
                        <Upload className="h-2.5 w-2.5" />
                        <span>Link Art</span>
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
                                  onAddImageToEntity(entity.id, reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[9px] text-slate-500 font-mono">
                        S{entity.firstSessionNumber}-{entity.lastSpottedSessionNumber}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors mb-1.5 flex items-center">
                    {entity.name}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3">
                    {entity.description}
                  </p>

                  {/* Entity Images Carousel */}
                  {entity.images && entity.images.length > 0 && (
                    <div className="flex gap-1.5 mb-3 overflow-x-auto py-1">
                      {entity.images.map((img, idx) => (
                        <div key={idx} className="relative h-14 w-14 rounded-lg overflow-hidden border border-slate-800 shrink-0 shadow bg-slate-950">
                          <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  {entity.notes && (
                    <div className="bg-slate-950/50 border border-slate-800/60 rounded p-2 mb-3">
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-0.5">DM Notes:</span>
                      <p className="text-[10px] text-slate-400 italic line-clamp-2">{entity.notes}</p>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {entity.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full hover:text-amber-400 cursor-pointer"
                        onClick={() => setSearchQuery(tag)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredEntities.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <Bookmark className="h-10 w-10 mb-2 text-slate-700 animate-pulse" />
              <p className="text-sm">No lore entities match your filters, master.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedType("ALL"); }}
                className="mt-2 text-xs text-amber-500 underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Form Overlay / Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-100">Add Campaign Entity</h2>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Barthen, Cragmaw Castle, etc."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EntityType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="NPC">NPC</option>
                    <option value="Location">Location</option>
                    <option value="Item">Item</option>
                    <option value="Quest">Quest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tags (Comma Sep)</label>
                  <input
                    type="text"
                    placeholder="e.g. Merchant, Ally, Weapon"
                    value={newTagsString}
                    onChange={(e) => setNewTagsString(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description / Lore</label>
                <textarea
                  placeholder="Summarize what this entity represents..."
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Private DM Notes</label>
                <textarea
                  placeholder="Notes about plans, secrets or locations..."
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  SAVE ENTRY
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
