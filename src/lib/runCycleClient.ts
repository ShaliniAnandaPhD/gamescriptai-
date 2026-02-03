export async function runCycleClient(args: {
    topic: string;
    primitives?: any;
}) {
    const baseUrl = import.meta.env.VITE_API_URL || "/api/runCycle";

    // Note: For v2 functions, the URL is slightly different.
    // If you deploy to us-central1, it will be:
    // https://runcycle-<project-auth-hash>-uc.a.run.app or similar.
    // Using the region-project-id format is safer for v1, but for v2 we often use the specific cloud run URL.
    // Let's use a standard fetch but allow overrides.

    const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json?.error || "Failed to run cycle");
    }

    return json;
}
