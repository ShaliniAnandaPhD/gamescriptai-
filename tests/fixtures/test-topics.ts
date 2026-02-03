export const TEST_TOPICS = {
    // Clean, professional topic
    clean: {
        topic: "Chiefs defeat 49ers 25-22 in overtime during Super Bowl LVIII",
        expected_primitives: {
            anti_hyperbole: { min: 0.85, max: 1.0 },
            source_attribution: { min: 0.80, max: 1.0 },
            fact_verification: { min: 0.90, max: 1.0 },
        },
        expected_quality: { min: 85, max: 100 },
        should_pass_gate: true,
    },

    // Hyperbolic topic (should trigger anti_hyperbole)
    hyperbolic: {
        topic: "ABSOLUTELY INSANE game with EARTH-SHATTERING plays and UNPRECEDENTED comeback!",
        expected_issues: ['anti_hyperbole'],
        expected_mutations: ['anti_hyperbole'],
        expected_quality: { min: 40, max: 70 },
        should_pass_gate: false,
        should_improve_after_mutation: true,
    },

    // Vague topic (should trigger source_attribution)
    vague: {
        topic: "Sales figures reportedly disappointing according to recent reports",
        expected_issues: ['source_attribution', 'temporal_accuracy'],
        expected_mutations: ['source_attribution'],
        expected_quality: { min: 50, max: 75 },
        should_pass_gate: false,
    },

    // Factually questionable (should trigger fact_verification)
    questionable: {
        topic: "LeBron James scored 85 points in last night's game against the Warriors",
        expected_issues: ['fact_verification'],
        expected_quality: { min: 30, max: 60 },
        should_pass_gate: false,
    },

    // Super Bowl specific
    super_bowl: {
        topic: "Patrick Mahomes throws game-winning touchdown in final seconds of Super Bowl LVIII",
        context: "Championship game, high stakes, national audience",
        expected_primitives: {
            controversy_sensitivity: { min: 0.85, max: 1.0 },
            fact_verification: { min: 0.85, max: 1.0 },
            entertainment_value: { min: 0.75, max: 0.95 },
        },
        expected_quality: { min: 80, max: 100 },
        should_pass_gate: true,
    },

    // Rumor/unverified
    rumor: {
        topic: "Brock Purdy rumored to be traded to Jets according to unnamed sources",
        expected_issues: ['fact_verification', 'source_attribution'],
        expected_quality: { min: 35, max: 65 },
        should_pass_gate: false,
    },

    // Controversy-laden
    controversial: {
        topic: "Star quarterback arrested on DUI charges after late-night incident",
        expected_primitives: {
            controversy_sensitivity: { min: 0.90, max: 1.0 },
            player_privacy_protection: { min: 0.85, max: 1.0 },
        },
        expected_issues: ['controversy_sensitivity'],
    },
};

export const EXPECTED_SCRIPTS = {
    good_example: {
        script: `The Kansas City Chiefs defeated the San Francisco 49ers 25-22 in overtime 
    during Super Bowl LVIII at Allegiant Stadium in Las Vegas. Patrick Mahomes threw for 
    333 yards and two touchdowns, including the game-winning score to Mecole Hardman with 
    3 seconds remaining in the first overtime period. This marks the Chiefs' third Super 
    Bowl victory in five years, establishing them as a dynasty in the modern NFL era.`,
        expected_scores: {
            anti_hyperbole: { min: 0.85 },
            fact_verification: { min: 0.90 },
            source_attribution: { min: 0.75 },
            brevity: { min: 0.60 },
        },
        should_pass: true,
    },

    hyperbolic_example: {
        script: `This was ABSOLUTELY the most INCREDIBLE, EARTH-SHATTERING game in the 
    history of football! Patrick Mahomes delivered an UNPRECEDENTED performance that 
    will NEVER be matched! This is the GREATEST dynasty of ALL TIME!`,
        expected_scores: {
            anti_hyperbole: { max: 0.50 },
        },
        should_pass: false,
    },
};
