/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK
let aiClient: GoogleGenAI | null = null;
const isGeminiEnabled = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY !== "";

function getGemini() {
  if (!isGeminiEnabled) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * GENERATES SIMULATED OFFLINE PAYLOADS
 * This ensures that even if API keys are missing or a provider is offline,
 * the campaign analyzer, Q&A companion, and chronicler work with 100% interactive fidelity!
 */
function getSimulatedResponse(provider: string, prompt: string): string {
  const textLower = prompt.toLowerCase();
  const provUpper = provider.toUpperCase();

  // 1. Session Summary / Recap Simulation
  if (textLower.includes("summary") || textLower.includes("recap") || textLower.includes("chronicler")) {
    const sessionMatch = prompt.match(/session:\s*(?:#)?(\d+)/i);
    const sessionNum = sessionMatch ? sessionMatch[1] : "1";
    const titleMatch = prompt.match(/session:\s*(?:#)?\d+\s*-\s*"([^"]+)"/i);
    const sessionTitle = titleMatch ? titleMatch[1] : "The Unfolding Quest";

    return `### Session ${sessionNum} Recap: ${sessionTitle} (Offline Simulation)\n\n` +
      `The party has logged a fresh session chronicle! Analyzed and chronicled using the **${provUpper}** abstract adapter.\n\n` +
      `#### Major Milestones & Events:\n` +
      `*   **Tactical Manoeuvres:** The adventurers mapped the dark caverns and successfully identified a high-voltage threat.\n` +
      `*   **Key Negotiations:** Conversations with local informants revealed crucial paths forward through the frontier mountains.\n` +
      `*   **Cohesive Teamwork:** Dynamic responses from the party members bypassed an active ambush trap.\n\n` +
      `#### Important Revelations:\n` +
      `*   **The Missing Map:** Clues discovered reinforce Gundren Rockseeker's claims of an ancient mine hidden in the peaks.\n` +
      `*   **Mysterious Antagonist:** Whisperings of the "Black Spider" echo among local goblin bands.\n\n` +
      `#### Active Quests / To-Do List:\n` +
      `*   [ ] Find Gundren Rockseeker and recover his maps.\n` +
      `*   [ ] Explore the deeper chambers of the ruins.\n` +
      `*   [ ] Secure safe passage to the frontier trading town.`;
  }

  // 2. Query History Simulation (Chat Q&A)
  if (textLower.includes("query") || textLower.includes("history context") || textLower.includes("chat history")) {
    if (textLower.includes("gundren") || textLower.includes("patron") || textLower.includes("rockseeker")) {
      return `Based on your campaign transcripts analyzed via **${provUpper}**:\n\n` +
        `*   **Gundren Rockseeker** is your primary dwarven explorer patron. He hired you to transport mineral supplies.\n` +
        `*   **Current State:** He was ambushed on the road and taken hostage. Retrieve his map to the legendary **Wave Echo Cave**!`;
    }
    if (textLower.includes("sildar") || textLower.includes("hallwinter") || textLower.includes("alliance")) {
      return `Based on campaign records queried via **${provUpper}**:\n\n` +
        `*   **Sildar Hallwinter** is an experienced human fighter and member of the **Lords' Alliance**.\n` +
        `*   **Details:** You rescued him from a goblin hideout. He is actively searching for his missing colleague, **Iarno Albrek** (last seen near Phandalin).`;
    }
    if (textLower.includes("redbrand") || textLower.includes("glasstaff") || textLower.includes("tresendar")) {
      return `According to the chronicles parsed by **${provUpper}**:\n\n` +
        `*   The **Redbrands** are a local gang of brigands wearing distinctive crimson cloaks who terrorize Phandalin.\n` +
        `*   They operate out of cellars under **Tresendar Manor**.\n` +
        `*   Their wizard leader is **Glasstaff** (known to some as Iarno Albrek).`;
    }

    return `Hello traveler! I am the **${provUpper}** campaign archivist.\n\n` +
      `I have scanned the journals. You can ask me details about **Gundren**, **Sildar**, or the **Redbrands**.\n\n` +
      `*(Note: To enable real live unrestricted AI queries, add the appropriate key to your \`.env\` file or use the secrets panel in AI Studio!)*`;
  }

  // 3. Transcript Analysis Simulation
  const reminders: any[] = [];
  const newEntities: any[] = [];
  let isKeyMention = false;
  let imageShared = { detected: false, context: "", suggestedName: "" };

  // Detect image sharing references in spoken dialogue
  const hasImageKeywords = textLower.includes("map") || textLower.includes("image") || textLower.includes("drawing") || 
                           textLower.includes("picture") || textLower.includes("screen") || textLower.includes("screenshot") || 
                           textLower.includes("battlemap") || textLower.includes("diagram") || textLower.includes("sketch") || 
                           textLower.includes("shared") || textLower.includes("upload") || textLower.includes("drawing");

  if (hasImageKeywords) {
    let context = "A player mentioned sharing a visual document or file in the voice call.";
    let suggestedName = "Shared Campaign Asset";

    if (textLower.includes("map")) {
      context = "The Dungeon Master or a player referred to a tactical map or regional cartography sheet.";
      suggestedName = "Regional Battle Map";
    } else if (textLower.includes("character") || textLower.includes("portrait") || textLower.includes("face")) {
      context = "A player mentioned showing character art, portraiture, or tokens.";
      suggestedName = "Character Art Portrait";
    } else if (textLower.includes("diagram") || textLower.includes("drawing")) {
      context = "The group mentioned viewing a drawing, sketch, or custom diagram.";
      suggestedName = "Hand-drawn Sketch Reference";
    }

    imageShared = {
      detected: true,
      context,
      suggestedName
    };
  }

  // Known entity tags matching
  if (textLower.includes("gundren")) {
    isKeyMention = true;
    reminders.push({
      entityName: "Gundren Rockseeker",
      matchedEntityId: "mock-gundren",
      reminderText: `[${provUpper} Simulation] Gundren is your dwarven patron. He was captured by Cragmaw goblins in Session 1. He has a map to the Lost Wave Echo Cave.`,
      severity: "info"
    });
  }
  if (textLower.includes("sildar")) {
    isKeyMention = true;
    reminders.push({
      entityName: "Sildar Hallwinter",
      matchedEntityId: "mock-sildar",
      reminderText: `[${provUpper} Simulation] Sildar is a human knight of the Lords' Alliance. He was rescued from the goblin caves. He seeks his fellow wizard, Iarno Albrek.`,
      severity: "info"
    });
  }
  if (textLower.includes("glassstaff") || textLower.includes("iarno")) {
    isKeyMention = true;
    reminders.push({
      entityName: "Iarno Albrek (Glasstaff)",
      matchedEntityId: "mock-glasstaff",
      reminderText: `[${provUpper} Simulation] Sildar's missing colleague turned leader of the Redbrands. He has a glass staff and acts as an antagonist in Phandalin.`,
      severity: "warning"
    });
  }
  if (textLower.includes("redbrand")) {
    isKeyMention = true;
    reminders.push({
      entityName: "Redbrands",
      matchedEntityId: "mock-redbrand",
      reminderText: `[${provUpper} Simulation] A ruthless mercenary gang in Phandalin. They hang out at the Sleeping Giant tap house and have a hideout under Tresendar Manor.`,
      severity: "warning"
    });
  }

  // Discovered entity tags matching
  if (textLower.includes("klarg") && !textLower.includes("mock-klarg")) {
    isKeyMention = true;
    newEntities.push({
      name: "Klarg",
      type: "NPC",
      description: `A bugbear leader of the Cragmaw goblins in the cave. Obsessed with his pet wolf, Ripper. Extracted by ${provUpper}.`,
      notes: "Spotted in Cragmaw Hideout. Holds Gundren's supplies."
    });
  }
  if (textLower.includes("wave echo") && !textLower.includes("mock-wave-echo")) {
    isKeyMention = true;
    newEntities.push({
      name: "Wave Echo Cave",
      type: "Location",
      description: `A legendary mine containing the Phandelver's Pact and the Forge of Spells. Extracted by ${provUpper}.`,
      notes: "Gundren's map points here. Lost for centuries."
    });
  }

  const looseEndUpdates: any[] = [];
  const npcUpdates: any[] = [];

  if (textLower.includes("wyvern tor") || textLower.includes("orc") || textLower.includes("raider")) {
    looseEndUpdates.push({
      looseEndId: "loose-1",
      title: "Orc Raiders at Wyvern Tor",
      updateText: `Reports of Orc scouts confirmed. They are harassing travelers near Wyvern Tor. (Parsed via ${provUpper})`,
      isResolved: false
    });
  }
  if (textLower.includes("gundren") || textLower.includes("rescue")) {
    looseEndUpdates.push({
      looseEndId: "loose-2",
      title: "The Lost Mine Entrance (Wave Echo Cave)",
      updateText: `Gundren is confirmed to be held captive in Cragmaw Castle under orders from the Black Spider. (Parsed via ${provUpper})`,
      isResolved: false
    });
  }
  if (textLower.includes("woodcarver") || textLower.includes("mirna") || textLower.includes("family")) {
    looseEndUpdates.push({
      looseEndId: "loose-3",
      title: "The Woodcarver's Missing Family",
      updateText: `Glasstaff is holding Mirna and her family captive in the ruins of Tresendar crypts. (Parsed via ${provUpper})`,
      isResolved: false
    });
  }

  if (textLower.includes("sildar")) {
    npcUpdates.push({
      npcName: "Sildar Hallwinter",
      updateText: `Rescuing Sildar has solidified his trust. He appreciates the party's action against local threats. (Parsed via ${provUpper})`,
      stanceChange: "Allied",
      trustScoreChange: 1
    });
  }
  if (textLower.includes("harbin") || textLower.includes("townmaster")) {
    npcUpdates.push({
      npcName: "Harbin Wester",
      updateText: `Harbin expresses concern and cowardice regarding our confrontation with the Redbrand gang. (Parsed via ${provUpper})`,
      stanceChange: "Wary",
      trustScoreChange: -1
    });
  }
  if (textLower.includes("halia") || textLower.includes("thornton")) {
    npcUpdates.push({
      npcName: "Halia Thornton",
      updateText: `Halia is highly intrigued by our reports on Glasstaff and seems to have her own secret plans. (Parsed via ${provUpper})`,
      stanceChange: "Friendly",
      trustScoreChange: 1
    });
  }

  return JSON.stringify({
    reminders,
    newEntities,
    isKeyMention,
    imageShared,
    looseEndUpdates,
    npcUpdates
  });
}

/**
 * PLUGGABLE AI PROVIDER DISPATCH ENGINE
 * Standardizes calls to Gemini, OpenAI, Claude/Anthropic, or Local.
 * Uses Direct REST Fetch requests for OpenAI and Anthropic to ensure
 * absolute stability and avoid node_modules installation issues.
 */
async function callAIProvider(
  provider: string,
  systemInstruction: string,
  prompt: string,
  schema?: any,
  localEndpoint?: string,
  localModel?: string
): Promise<{ text: string; providerUsed: string; isMock: boolean }> {
  const activeProv = provider ? provider.toLowerCase() : "gemini";

  // --- 1. OPENAI ADAPTER ---
  if (activeProv === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key === "MY_OPENAI_API_KEY" || key === "") {
      return { text: getSimulatedResponse("openai", prompt), providerUsed: "openai-simulation", isMock: true };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          response_format: schema ? { type: "json_object" } : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI responded with status ${response.status}`);
      }

      const data: any = await response.json();
      return { text: data.choices[0]?.message?.content || "{}", providerUsed: "openai", isMock: false };
    } catch (err: any) {
      console.warn("OpenAI API call failed, falling back to simulated output:", err.message);
      return { text: getSimulatedResponse("openai", prompt), providerUsed: "openai-simulation", isMock: true };
    }
  }

  // --- 2. ANTHROPIC CLAUDE ADAPTER ---
  if (activeProv === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key || key === "MY_ANTHROPIC_API_KEY" || key === "") {
      return { text: getSimulatedResponse("anthropic", prompt), providerUsed: "anthropic-simulation", isMock: true };
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 3000,
          system: systemInstruction + (schema ? "\n\nCRITICAL: You must return raw JSON complying strictly with this structure. Do not output conversational text or backticks around the JSON. JSON Structure:\n" + JSON.stringify(schema, null, 2) : ""),
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic responded with status ${response.status}`);
      }

      const data: any = await response.json();
      let text = data.content?.[0]?.text || "{}";
      
      // Clean up markdown block wraps if Claude added them anyway
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0].trim();
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0].trim();
      }

      return { text, providerUsed: "anthropic", isMock: false };
    } catch (err: any) {
      console.warn("Anthropic API call failed, falling back to simulated output:", err.message);
      return { text: getSimulatedResponse("anthropic", prompt), providerUsed: "anthropic-simulation", isMock: true };
    }
  }

  // --- 3. LOCAL LM STUDIO / OLLAMA ADAPTER ---
  if (activeProv === "local") {
    let url = localEndpoint || process.env.LOCAL_API_ENDPOINT || "http://localhost:1234/v1";
    if (!url.endsWith("/chat/completions")) {
      if (url.endsWith("/")) {
        url = url + "chat/completions";
      } else if (url.endsWith("/v1")) {
        url = url + "/chat/completions";
      } else {
        url = url + "/v1/chat/completions";
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second quick-timeout for local responses

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: localModel || "local-model",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          response_format: schema ? { type: "json_object" } : undefined
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Local provider responded with status ${response.status}`);
      }

      const data: any = await response.json();
      let text = data.choices?.[0]?.message?.content || "{}";

      // Clean up markdown blocks if the local model wrapped the JSON
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0].trim();
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0].trim();
      }

      return { text, providerUsed: `local (${localModel || "default"})`, isMock: false };
    } catch (err: any) {
      console.warn(`Local provider connection failed or timed out for ${url}:`, err.message);
      return { text: getSimulatedResponse("local", prompt), providerUsed: "local-simulation", isMock: true };
    }
  }

  // --- 4. GOOGLE GEMINI ADAPTER (Default fallback) ---
  const ai = getGemini();
  if (!ai) {
    return { text: getSimulatedResponse("gemini", prompt), providerUsed: "gemini-simulation", isMock: true };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: schema ? "application/json" : undefined,
        responseSchema: schema || undefined,
      }
    });
    return { text: response.text || "{}", providerUsed: "gemini", isMock: false };
  } catch (err: any) {
    console.warn("Gemini API call failed, falling back to simulated output:", err.message);
    return { text: getSimulatedResponse("gemini", prompt), providerUsed: "gemini-simulation", isMock: true };
  }
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. ANALYZE TRANSCRIPT CHUNK
app.post("/api/analyze-transcript", async (req: express.Request, res: express.Response) => {
  try {
    const { currentSegment, pastTranscripts, knownEntities, provider, localEndpoint, localModel, looseEnds, npcRelationships } = req.body;
    
    if (!currentSegment || !currentSegment.text) {
      return res.status(400).json({ error: "Missing transcript segment content" });
    }

    const textToAnalyze = currentSegment.text;
    const speaker = currentSegment.speaker;

    const systemInstruction = `You are "LoreWeaver", a specialized D&D co-DM assistant.
Analyze the following transcript segment from our campaign voice call:
Speaker: "${speaker}"
Text: "${textToAnalyze}"

Context of what has been discovered so far in this campaign:
Known Entities:
${JSON.stringify(knownEntities?.map((e: any) => ({ id: e.id, name: e.name, type: e.type, description: e.description })) || [], null, 2)}

Active Loose Ends Bulletin (unresolved quests, plot hooks):
${JSON.stringify(looseEnds || [], null, 2)}

NPC Relationships Tracker (party standings, trust, promises):
${JSON.stringify(npcRelationships || [], null, 2)}

Instructions:
1. Identify if the text mentions any already "Known Entities" (names, locations, items, or quest terms). For each match, provide a helpful, concise reminder card explaining who/what they are. If it's a trap, threat, or enemy, mark severity as "warning", otherwise "info".
2. Identify if any *new* NPCs, locations, items, or quests are being introduced or named for the first time in this segment. If so, extract them into 'newEntities' with a name, type ('NPC' | 'Location' | 'Item' | 'Quest'), a descriptive summary, and key notes.
3. Determine if this segment contains an important plot revelation, quest hook, or key character introduction (isKeyMention: true/false).
4. Analyze the spoken words to detect if the speaker is sharing, uploading, or displaying an image, file, battle map, layout, or character picture (e.g. "I am sharing my screen", "here is the map of Tresendar Cellars", "uploading the sketch", "look at my character portrait"). Set 'imageShared' with: { "detected": true, "context": "Detailed description of what image/file was shared", "suggestedName": "A descriptive name" }. If not sharing, set 'detected' to false.
5. Search the transcript for updates to any items listed in the "Active Loose Ends Bulletin". If the party progressed, completed, or got new clues about a listed item, populate the 'looseEndUpdates' list. Each item should have 'looseEndId' (the id of the matched item), 'title', 'updateText' (what happened/what was revealed), and 'isResolved' (boolean indicating if the quest is now fully resolved/finished).
6. Search the transcript for updates to NPC relationships listed in the "NPC Relationships Tracker" or other known NPCs. If the party gains favor, loses trust, threatens, pays, or helps an NPC, populate the 'npcUpdates' list. Each item should have 'npcName' (the name of the NPC), 'updateText' (what happened), 'stanceChange' (one of: 'Allied', 'Friendly', 'Neutral', 'Wary', 'Hostile', or '' if unchanged), and 'trustScoreChange' (a numeric delta, e.g. +1, -1, or 0 if only notes changed).

CRITICAL: Return strictly a valid JSON object matching this schema.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        reminders: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              entityName: { type: Type.STRING },
              matchedEntityId: { type: Type.STRING },
              reminderText: { type: Type.STRING },
              severity: { type: Type.STRING },
            },
            required: ["entityName", "reminderText", "severity"],
          },
        },
        newEntities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ["name", "type", "description", "notes"],
          },
        },
        isKeyMention: { type: Type.BOOLEAN },
        imageShared: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN },
            context: { type: Type.STRING },
            suggestedName: { type: Type.STRING }
          },
          required: ["detected", "context", "suggestedName"]
        },
        looseEndUpdates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              looseEndId: { type: Type.STRING },
              title: { type: Type.STRING },
              updateText: { type: Type.STRING },
              isResolved: { type: Type.BOOLEAN }
            },
            required: ["title", "updateText", "isResolved"]
          }
        },
        npcUpdates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              npcName: { type: Type.STRING },
              updateText: { type: Type.STRING },
              stanceChange: { type: Type.STRING },
              trustScoreChange: { type: Type.NUMBER }
            },
            required: ["npcName", "updateText", "trustScoreChange"]
          }
        }
      },
      required: ["reminders", "newEntities", "isKeyMention", "imageShared"],
    };

    const result = await callAIProvider(provider, systemInstruction, textToAnalyze, schema, localEndpoint, localModel);
    
    try {
      const parsed = JSON.parse(result.text || "{}");
      return res.json({ 
        ...parsed, 
        providerUsed: result.providerUsed, 
        isMock: result.isMock 
      });
    } catch (parseErr) {
      // Emergency recovery if AI outputs invalid JSON
      const simulated = getSimulatedResponse(provider || "gemini", textToAnalyze);
      const parsedSim = JSON.parse(simulated);
      return res.json({
        ...parsedSim,
        providerUsed: `${result.providerUsed}-recovered`,
        isMock: true
      });
    }

  } catch (error: any) {
    console.error("Error analyzing transcript:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. QUERY CAMPAIGN HISTORY
app.post("/api/query-history", async (req: express.Request, res: express.Response) => {
  try {
    const { query, campaignName, sessions, entities, chatHistory, provider, localEndpoint, localModel } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // Format past session logs & entities to provide a complete history context
    const sessionsContext = sessions?.map((s: any) => {
      const summary = s.summary ? `Summary: ${s.summary}` : "";
      const transText = s.transcript?.map((t: any) => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join("\n") || "";
      return `### Session ${s.sessionNumber}: ${s.title}\n${summary}\nTranscript Excerpts:\n${transText}`;
    }).join("\n\n") || "No session history recorded yet.";

    const entitiesContext = entities?.map((e: any) => {
      return `- **${e.name}** (${e.type}): ${e.description}. Notes: ${e.notes}. Tags: ${e.tags?.join(", ")}. First seen: Session ${e.firstSessionNumber}.`;
    }).join("\n") || "No entities recorded yet.";

    const systemInstruction = `You are "LoreWeaver", a expert D&D Campaign Archivist and Virtual Player Assistant.
Your goal is to answer questions about the campaign's history, lore, events, names, and locations using ONLY the recorded transcripts and notes of past sessions.

Campaign Name: "${campaignName}"

--- CAMPAIGN HISTORY CONTEXT ---
PAST SESSIONS LOGS:
${sessionsContext}

DISCOVERED ENTITIES (NPCs, Locations, Items, Quests):
${entitiesContext}
--------------------------------

Instructions:
1. Always base your answers directly on the session logs and discovered entities. Do not invent details not mentioned in the context, but you can speak in a helpful, slightly atmospheric, or companionable tone.
2. Be highly specific: mention WHICH session, who said it, and when, if that information is visible in the logs.
3. Format your answers in clean, readable markdown with bold text, lists, and headers where appropriate.
4. If the question cannot be answered from the logs, politely say so.`;

    const promptText = `User Chat Query: "${query}"\n\nPast Assistant Chat History:\n${JSON.stringify(chatHistory || [])}`;

    const result = await callAIProvider(provider, systemInstruction, promptText, undefined, localEndpoint, localModel);
    return res.json({ 
      text: result.text, 
      providerUsed: result.providerUsed, 
      isMock: result.isMock 
    });

  } catch (error: any) {
    console.error("Error querying campaign history:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. GENERATE SESSION SUMMARY
app.post("/api/generate-summary", async (req: express.Request, res: express.Response) => {
  try {
    const { transcript, sessionNumber, title, provider, localEndpoint, localModel } = req.body;

    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: "Missing transcript" });
    }

    const formattedTranscript = transcript.map((t: any) => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join("\n");

    const systemInstruction = `You are "LoreWeaver", an expert chronicler.
Analyze this transcript of a D&D game session and write an elegant, engaging markdown summary for our campaign logbook.

Session: #${sessionNumber} - "${title}"`;

    const promptText = `TRANSCRIPT:
${formattedTranscript}

Please structure your summary as follows:
1. **A brief cinematic introductory paragraph** summarizing the session's overall mood and core achievement.
2. **Major Milestones & Events**: Bullet points detailing the key encounters, fights, or decisions made.
3. **Important Revelations**: Any lore, secrets, or maps uncovered.
4. **Active Quests / To-Do List**: Unresolved tasks with checkbox syntax (e.g., *   [ ] Find Gundren).

Keep the tone heroic and fitting for a fantasy chronicle. Use bullet points and clean headers.`;

    const result = await callAIProvider(provider, systemInstruction, promptText, undefined, localEndpoint, localModel);
    return res.json({ 
      summary: result.text, 
      providerUsed: result.providerUsed, 
      isMock: result.isMock 
    });

  } catch (error: any) {
    console.error("Error generating summary:", error);
    return res.status(500).json({ error: error.message });
  }
});

// VITE MIDDLEWARE CONFIGURATION
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Key States - Gemini: ${isGeminiEnabled}, OpenAI: ${!!process.env.OPENAI_API_KEY}, Anthropic: ${!!process.env.ANTHROPIC_API_KEY}`);
  });
}

startServer();
