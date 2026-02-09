import { geminiFlash } from '../gemini-enhanced';

// Memory store for game narratives
const memoryStore = new Map<string, any>();

interface GameContext {
    teams: string[];
    sport: string;
    season_narrative: string;
    key_players: { name: string; recent_performance: string }[];
    rivalry_context?: string;
}

export async function extractGameContext(topic: string): Promise<GameContext> {
    const prompt = `Extract game context from: "${topic}". 
Return JSON:
{
  "teams": ["..."],
  "sport": "...",
  "season_narrative": "...",
  "key_players": [{ "name": "...", "recent_performance": "..." }]
}`;

    try {
        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        const context = JSON.parse(cleanText);

        const key = context.teams.sort().join('-');
        memoryStore.set(`context:${key}`, context);
        return context;
    } catch (e) {
        console.error('Context extraction failed:', e);
        return { teams: [], sport: 'unknown', season_narrative: '', key_players: [] };
    }
}

export async function getNarrativeContinuity(topic: string, historicalEpisodes: any[]) {
    const context = await extractGameContext(topic);

    if (historicalEpisodes.length === 0) {
        return "This is the first coverage of this matchup.";
    }

    const prompt = `Create narrative continuity for: ${topic}.
Related past episodes: ${JSON.stringify(historicalEpisodes.slice(-3))}

Return 2 sentences on the storyline/momentum. No JSON.`;

    try {
        const result = await geminiFlash.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return "Resuming coverage of this ongoing narrative.";
    }
}
