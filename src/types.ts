/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Campaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastPlayedAt: string;
}

export interface Session {
  id: string;
  campaignId: string;
  title: string;
  sessionNumber: number;
  date: string;
  summary: string; // Markdown summary of the session
  transcript: TranscriptSegment[];
  images?: string[]; // Base64 data URLs or standard image URLs linked to this session
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: string; // MM:SS format or real timestamp
  isKeyMention?: boolean;
}

export type EntityType = 'NPC' | 'Location' | 'Item' | 'Quest';

export interface Entity {
  id: string;
  campaignId: string;
  name: string;
  type: EntityType;
  description: string;
  firstSessionNumber: number;
  lastSpottedSessionNumber: number;
  tags: string[];
  notes: string;
  lastSpottedTimestamp?: string;
  images?: string[]; // Base64 data URLs or standard image URLs linked to this entity
}

export type AIProviderType = 'gemini' | 'openai' | 'anthropic' | 'local';

export interface LooseEndItem {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  status: 'unresolved' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  dateAdded: string;
  lastUpdatedText?: string;
  isNewMention?: boolean; // True when updated from live transcript, causes a brief highlights / flash
}

export interface NpcRelationship {
  id: string;
  campaignId: string;
  npcName: string;
  npcId?: string; // Optional link to Entity
  relationship: 'Allied' | 'Friendly' | 'Neutral' | 'Wary' | 'Hostile';
  trustScore: number; // -10 to +10 scale
  notes: string;
  debtsOrPromises: string;
  lastUpdatedText?: string;
  isNewMention?: boolean; // True when updated from live transcript, causes a brief highlights / flash
}

export interface AIProviderConfig {
  provider: AIProviderType;
  openaiKey?: string;
  anthropicKey?: string;
  localEndpoint?: string;
}

export interface ImagePromptNotification {
  id: string;
  detectedText: string;
  suggestedName: string;
  context: string;
  timestamp: string;
  sessionNumber: number;
  dismissed: boolean;
  resolved: boolean;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  matchedEntities?: string[]; // IDs of entities referenced in this message
}

export interface CampaignData {
  campaign: Campaign;
  sessions: Session[];
  entities: Entity[];
  messages: AssistantMessage[];
}
