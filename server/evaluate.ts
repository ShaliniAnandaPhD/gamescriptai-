import type { Primitives } from './primitives';

export function evaluate(text: string, primitives: Primitives) {
    const issues: any[] = [];
    let score = 100;

    const lowerText = text.toLowerCase();

    // Hallucination detection
    const unreleased = [
        'gpt-5', 'gpt-6', 'gpt-7', 'gpt-8', 'gpt-9', 'gpt-10',
        'llama 4', 'llama 5', 'llama 6',
        'claude 5', 'claude 6', 'claude 7',
        'gemini 3', 'gemini 4'
    ];

    unreleased.forEach(product => {
        if (lowerText.includes(product)) {
            issues.push({
                type: 'hallucination',
                message: `Unreleased product mentioned: ${product}`,
                severity: 'high'
            });
            score -= 30 * primitives.fact_verification;
        }
    });

    // Hyperbole detection
    const hyperbole = [
        'revolutionary', 'earth-shattering', 'unprecedented',
        'game-changing', 'breakthrough', 'incredible',
        'amazing', 'absolutely', 'unbelievable', 'stunning'
    ];

    let hyperboleCount = 0;
    hyperbole.forEach(word => {
        if (lowerText.includes(word)) hyperboleCount++;
    });

    if (hyperboleCount >= 3) {
        issues.push({
            type: 'hyperbole',
            message: `Excessive superlatives detected (${hyperboleCount} instances)`,
            severity: 'medium'
        });
        score -= 20 * primitives.anti_hyperbole;
    }

    // Source attribution check
    const hasSource = lowerText.includes('according to') ||
        lowerText.includes('reported by') ||
        lowerText.includes('sources say') ||
        lowerText.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i);

    if (!hasSource && text.split(' ').length > 20) {
        issues.push({
            type: 'missing_source',
            message: 'Claims lack specific attribution or dates',
            severity: 'medium'
        });
        score -= 15 * primitives.source_attribution;
    }

    // Temporal accuracy
    const vagueTemporal = ['recently', 'lately', 'soon', 'coming soon'];
    if (vagueTemporal.some(term => lowerText.includes(term))) {
        issues.push({
            type: 'temporal_vague',
            message: 'Vague temporal references detected',
            severity: 'low'
        });
        score -= 10 * primitives.temporal_accuracy;
    }

    score = Math.max(0, Math.min(100, score));

    return {
        score: score / 100,
        issues,
        passed: score >= 72
    };
}
