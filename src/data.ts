/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CampaignData, LooseEndItem, NpcRelationship } from "./types";

export const DEFAULT_LOOSE_ENDS: LooseEndItem[] = [
  {
    id: "loose-1",
    campaignId: "phandelver",
    title: "Orc Raiders at Wyvern Tor",
    description: "Townmaster Harbin Wester mentioned that orc raiders are threatening travelers near Wyvern Tor. Sildar wants us to deal with them.",
    status: "unresolved",
    severity: "medium",
    dateAdded: "2026-06-22"
  },
  {
    id: "loose-2",
    campaignId: "phandelver",
    title: "The Lost Mine Entrance (Wave Echo Cave)",
    description: "Find Gundren Rockseeker to recover his map detailing the secret location of Wave Echo Cave.",
    status: "unresolved",
    severity: "high",
    dateAdded: "2026-06-20"
  },
  {
    id: "loose-3",
    campaignId: "phandelver",
    title: "The Woodcarver's Missing Family",
    description: "The Redbrands murdered the local woodcarver Thendar. His wife Mirna and her two children went missing shortly after. Locals suspect they were taken by the gang.",
    status: "unresolved",
    severity: "high",
    dateAdded: "2026-06-22"
  }
];

export const DEFAULT_NPC_RELATIONSHIPS: NpcRelationship[] = [
  {
    id: "rel-1",
    campaignId: "phandelver",
    npcName: "Sildar Hallwinter",
    npcId: "sildar",
    relationship: "Allied",
    trustScore: 8,
    notes: "Deeply grateful for rescuing him from the goblin hideout. Staying at the Townmaster's Hall. Supports our effort to clear out the Redbrands.",
    debtsOrPromises: "Promised 50 gp for locating Iarno Albrek, and 500 gp if we rescue Gundren and recover the Wave Echo Cave map."
  },
  {
    id: "rel-2",
    campaignId: "phandelver",
    npcName: "Harbin Wester",
    relationship: "Neutral",
    trustScore: 0,
    notes: "The Townmaster of Phandalin. Extremely cowardly banker who insists the Redbrands are just a harmless local mercenary crew.",
    debtsOrPromises: "Offered a 100 gp bounty if we defeat the Orc raiders at Wyvern Tor."
  },
  {
    id: "rel-3",
    campaignId: "phandelver",
    npcName: "Halia Thornton",
    relationship: "Wary",
    trustScore: -2,
    notes: "Runs the Miner's Exchange. Calculating and ambitious. She dislikes the Redbrands, but Sildar suspects she wants to take over their operation for her own cartel.",
    debtsOrPromises: "None so far, but offered to trade information if we eliminate Glasstaff."
  }
];

export const DEFAULT_CAMPAIGN_DATA: CampaignData = {
  campaign: {
    id: "phandelver",
    name: "The Lost Mine of Phandelver",
    description: "A legendary search for the Wave Echo Cave, rich in magical ore, currently threatened by goblins, a ruthless bandit gang, and a mysterious villain known as the Black Spider.",
    createdAt: "2026-06-20T10:00:00Z",
    lastPlayedAt: "2026-06-24T12:00:00Z",
  },
  sessions: [
    {
      id: "session-1",
      campaignId: "phandelver",
      sessionNumber: 1,
      title: "Goblin Arrows & The Cragmaw Caves",
      date: "2026-06-20",
      summary: `### Session #1 Recap: The Journey Begins

Our adventurers departed Neverwinter escorting a wagon load of mining provisions purchased by their patron, **Gundren Rockseeker**. Gundren traveled ahead with a human companion, **Sildar Hallwinter**.

#### Key Milestones:
*   **The Ambush on the Road:** Two miles down the Triboar Trail, the party found the dead horses of Gundren and Sildar. Four goblins ambushed the party from the brush. The fight was swift, and the party defeated the goblins, capturing one who named himself **Droop**.
*   **Tracking the Goblins:** The party found a goblin trail leading north into the woods and decided to pursue it, leaving the wagon secured.
*   **Infiltrating the Cragmaw Hideout:** The party reached a cave mouth from which a stream flowed. They overcame two goblins on watch and slipped inside. They bypassed a set of water flood traps that the goblins attempted to trigger.
*   **The Bugbear's Lair:** In the final chamber of the cave system, the party confronted **Klarg**, a bugbear chieftain who answered to the goblin king. In a brutal clash, Klarg was slain, along with his pet wolf, Ripper.
*   **Sildar Rescued:** The party discovered and rescued **Sildar Hallwinter**, who was being held hostage in the adjacent room. Sildar revealed that Gundren was taken by other goblins to **Cragmaw Castle** on orders of someone called **The Black Spider**.

#### Discoveries & Revelations:
*   **Wave Echo Cave Map:** Gundren was carrying a map to the Lost Wave Echo Cave, which has now been taken to Cragmaw Castle.
*   **Iarno Albrek's Disappearance:** Sildar revealed he was travelling to Phandalin to find **Iarno Albrek**, a member of the Lords' Alliance who went missing several months ago.

#### Active Quests:
*   [ ] Find Gundren Rockseeker and recover the Wave Echo Cave map.
*   [ ] Escort the wagon of supplies safely to Barthen's Provisions in Phandalin.
*   [ ] Locate Sildar's missing classmate, Iarno Albrek.`,
      transcript: [
        { id: "s1t1", speaker: "DM", text: "You see two dead horses blocking the trail. They have black-feathered arrows sticking out of them.", timestamp: "02:15" },
        { id: "s1t2", speaker: "Gorgon (Barbarian)", text: "I pull out my greataxe and look closely at the saddlebags. Wait, are those Gundren's horses?", timestamp: "02:45" },
        { id: "s1t3", speaker: "DM", text: "Yes, Gorgon. You recognize the leatherwork. They belong to Gundren Rockseeker and Sildar Hallwinter. Suddenly, rustling noises come from the trees!", timestamp: "03:10" },
        { id: "s1t4", speaker: "Aria (Wizard)", text: "Goblins! Look out behind you! I cast Mage Armor immediately.", timestamp: "03:32", isKeyMention: true },
        { id: "s1t5", speaker: "DM", text: "Gorgon slays the last goblin with a horizontal sweep. You find a trail leading north into the thicket.", timestamp: "15:40" },
        { id: "s1t6", speaker: "Sildar", text: "Thank the gods you arrived. They were... they were going to feed me to the wolves. The bugbear Klarg said they had orders from the Black Spider.", timestamp: "45:10" },
        { id: "s1t7", speaker: "Aria (Wizard)", text: "Who is the Black Spider? And where is Gundren Rockseeker?", timestamp: "45:35", isKeyMention: true },
        { id: "s1t8", speaker: "Sildar", text: "Gundren was captured by a separate goblin raiding party. They took him and his map of Wave Echo Cave to Cragmaw Castle. He is in grave danger.", timestamp: "46:12", isKeyMention: true }
      ]
    },
    {
      id: "session-2",
      campaignId: "phandalver",
      sessionNumber: 2,
      title: "Trouble in Phandalin",
      date: "2026-06-22",
      summary: `### Session #2 Recap: Arrival in Phandalin

The party, accompanied by the injured **Sildar Hallwinter**, escorted the wagon safely into the frontier town of **Phandalin**. They settled their delivery at Barthen's Provisions and visited the Stonehill Inn.

#### Key Milestones:
*   **The Town Scene:** The town was nervous. The party learned that a local gang called the **Redbrands** has been extorting merchants, threatening locals, and recently murdered a woodcarver named Thendar.
*   **The Tavern confrontation:** While visiting the Sleeping Giant tap house (a known Redbrand hangout), the party was confronted by four Redbrand ruffians wearing dirty red cloaks. The party retaliated, killing three and capturing one.
*   **The Glasstaff Lead:** From the captured ruffian, the party learned that the Redbrands operate out of a hideout directly beneath **Tresendar Manor**, the ancient ruins overlooking the town. Their leader is a wizard named **Glasstaff**, so called because of his translucent magical glass staff. Sildar suspects Glasstaff might actually be the missing wizard, **Iarno Albrek**.

#### Discoveries & Revelations:
*   **Sister Garaele's Quest:** The elf cleric Garaele asked the party to seek the banshee Agatha in Conyberry to ask about a legendary spellbook.
*   **Harbin Wester's Cowardice:** The Townmaster Harbin Wester refused to take action against the Redbrands, claiming they are 'just a small mercenary guild' maintaining order.

#### Active Quests:
*   [x] Escort the wagon of supplies safely to Phandalin.
*   [ ] Infiltrate the Redbrand Hideout beneath Tresendar Manor and confront Glasstaff.
*   [ ] Learn the identity of Glasstaff (is he Iarno Albrek?).
*   [ ] Seek out the Banshee Agatha on behalf of Sister Garaele.`,
      transcript: [
        { id: "s2t1", speaker: "Elwyn (Rogue)", text: "We walk into Barthen's Provisions. Barthen, here is your supply wagon. That will be 50 gold pieces as agreed.", timestamp: "04:20" },
        { id: "s2t2", speaker: "DM", text: "Elwyn, Barthen pays you and looks relieved. He says 'Thank the gods. Redbrand ruffians have been shaking everyone down lately. Just yesterday, they killed poor Thendar the woodcarver.'", timestamp: "05:15" },
        { id: "s2t3", speaker: "Aria (Wizard)", text: "Who are these Redbrands? Do they have a base here in Phandalin?", timestamp: "06:10" },
        { id: "s2t4", speaker: "DM", text: "Yes, they hang around the Sleeping Giant tavern. They are led by a powerful wizard who calls himself Glasstaff. He carries a glowing glass staff.", timestamp: "07:30", isKeyMention: true },
        { id: "s2t5", speaker: "Sildar", text: "Glasstaff? A wizard in Phandalin? I fear this might be my missing colleague, Iarno Albrek. Sildar looks extremely worried.", timestamp: "12:15", isKeyMention: true },
        { id: "s2t6", speaker: "Gorgon (Barbarian)", text: "If we go to the Sleeping Giant tap house, can we crack some heads?", timestamp: "18:40" },
        { id: "s2t7", speaker: "DM", text: "You confront them. A ruffian sneers, 'You under ruins of Tresendar Manor? Glasstaff will turn you into ashes!' before falling unconscious.", timestamp: "35:10", isKeyMention: true }
      ]
    }
  ],
  entities: [
    {
      id: "gundren",
      campaignId: "phandelver",
      name: "Gundren Rockseeker",
      type: "NPC",
      description: "Dwarven explorer and mining entrepreneur. Hired the party to escort mining provisions. He holds a map to the Lost Wave Echo Cave.",
      firstSessionNumber: 1,
      lastSpottedSessionNumber: 1,
      tags: ["Patron", "Captive", "Dwarf"],
      notes: "Captured by Cragmaw goblins on the High Road. Believed to be held at Cragmaw Castle on orders of 'The Black Spider'. Has two brothers, Tharden and Nundro."
    },
    {
      id: "sildar",
      campaignId: "phandelver",
      name: "Sildar Hallwinter",
      type: "NPC",
      description: "Retired human knight and agent of the Lords' Alliance. Rescued by the party from the goblin caves.",
      firstSessionNumber: 1,
      lastSpottedSessionNumber: 2,
      tags: ["Ally", "Knight", "QuestGiver"],
      notes: "Staying at the Townmaster's Hall. Offered a 50 gp reward to find his colleague Iarno Albrek. Offered 500 gp if they find Gundren and the map."
    },
    {
      id: "phandalin",
      campaignId: "phandelver",
      name: "Phandalin",
      type: "Location",
      description: "Frontier town built on the ruins of a historic settlement. Troubled by lawlessness and the Redbrand mercenary gang.",
      firstSessionNumber: 2,
      lastSpottedSessionNumber: 2,
      tags: ["Town", "SafeZone"],
      notes: "Contains Stonehill Inn, Barthen's Provisions, Townmaster's Hall, and Phandalin Shrine."
    },
    {
      id: "tresendar",
      campaignId: "phandelver",
      name: "Tresendar Manor",
      type: "Location",
      description: "Ruined estate sitting on the eastern hill overlooking Phandalin.",
      firstSessionNumber: 2,
      lastSpottedSessionNumber: 2,
      tags: ["Dungeon", "Ruins"],
      notes: "Contains a basement vault system used as the headquarters of the Redbrand gang and Glasstaff."
    },
    {
      id: "glasstaff",
      campaignId: "phandelver",
      name: "Glasstaff (Iarno Albrek)",
      type: "NPC",
      description: "Leader of the Redbrand gang, described as a wizard wearing dirty robes who carries a magical translucent glass staff.",
      firstSessionNumber: 2,
      lastSpottedSessionNumber: 2,
      tags: ["Villain", "Wizard"],
      notes: "Highly suspected by Sildar to be Iarno Albrek, the wizard emissary of the Lords' Alliance who defected. Operates out of Tresendar Manor basement."
    },
    {
      id: "wave-echo-map",
      campaignId: "phandelver",
      name: "Wave Echo Cave Map",
      type: "Item",
      description: "A hand-drawn map detailing the secret location of the entrance to Wave Echo Cave.",
      firstSessionNumber: 1,
      lastSpottedSessionNumber: 1,
      tags: ["QuestItem", "Legendary"],
      notes: "Stolen from Gundren Rockseeker. Currently in possession of King Grol at Cragmaw Castle."
    },
    {
      id: "quest-rescue-gundren",
      campaignId: "phandelver",
      name: "Rescue Gundren Rockseeker",
      type: "Quest",
      description: "Gundren is captured. Sildar says he's being held in Cragmaw Castle, which is hidden deep within the Neverwinter Wood.",
      firstSessionNumber: 1,
      lastSpottedSessionNumber: 2,
      tags: ["MainQuest", "Active"],
      notes: "Must find the castle or get its coordinates from a Cragmaw goblin. Harbin Wester or local hunters might know the way."
    }
  ],
  messages: [
    {
      id: "m1",
      role: "assistant",
      content: "Well met, adventurer. I am **Party Historian**, your virtual campaign companion. I will listen to your game sessions, automatically document your achievements, map NPC lore, and alert you with vital lore reminders when they are mentioned in real-time. Ask me anything about the history of Phandelver!",
      timestamp: "12:00 PM"
    }
  ]
};

// Preset simulations for users to trigger!
export const VOICE_SIMULATIONS = [
  {
    title: "Mentioning Sildar & Iarno Albrek",
    transcript: "So, Sildar was talking to us at the Stonehill Inn. He mentioned that Iarno Albrek was indeed the wizard of the Lords' Alliance who came to Phandalin. Sildar believes Glasstaff is actually Iarno, and that he set up the Redbrands."
  },
  {
    title: "New Discovery: Sister Garaele's Shrine",
    transcript: "We should go meet Sister Garaele at the Shrine of Luck. Sildar told us she was a member of the Harpers, and she might know where to find the banshee Agatha in Conyberry."
  },
  {
    title: "Plot Reveal: The Black Spider's Castle orders",
    transcript: "The goblin in Phandalin told us that King Grol is taking orders directly from the Black Spider at Cragmaw Castle, and that Gundren's map of Wave Echo Cave has already been shipped there."
  }
];
