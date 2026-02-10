import "dotenv/config";
import Redis from 'ioredis';

async function migrate() {
    console.log("🚀 Starting state migration to Cloud Redis...");

    const REDIS_URL = process.env.REDIS_URL;
    if (!REDIS_URL) {
        console.error("❌ REDIS_URL missing in .env");
        process.exit(1);
    }

    try {
        // 1. Fetch local stats
        console.log("📥 Fetching local stats from http://localhost:5174/api/stats...");
        const response = await fetch('http://localhost:5174/api/stats');
        const stats = await response.json() as any;

        console.log("📊 Local stats retrieved:", stats);

        // 2. Fetch local history
        console.log("📥 Fetching local history from http://localhost:5174/api/history...");
        const historyRes = await fetch('http://localhost:5174/api/history');
        const historyData = await historyRes.json() as any;
        const history = historyData.episodes || [];

        console.log(`📜 Retrieved ${history.length} history episodes.`);

        // 3. Connect to Cloud Redis
        console.log("🔌 Connecting to Cloud Redis...");
        const redis = new Redis(REDIS_URL);

        // 4. Push data
        console.log("📤 Pushing data to Cloud Redis...");

        await redis.set('total_episodes', stats.total_episodes);
        await redis.set('total_mutations', stats.total_mutations);

        // Clear old history in Redis and push new
        await redis.del('episode_history');
        for (const episode of history.reverse()) { // Reverse to maintain order with LPUSH
            await redis.lpush('episode_history', JSON.stringify(episode));
        }

        console.log("✅ Migration complete!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Migration failed:", e);
        process.exit(1);
    }
}

migrate();
