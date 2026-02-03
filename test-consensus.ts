import { evaluateWithConsensus } from './server/lib/consensus-evaluation';
import { defaultPrimitives } from './server/primitives';
import 'dotenv/config';

async function test() {
    const script = "Patrick Mahomes throws game-winning touchdown in final seconds of Super Bowl LVIII";
    const topic = "Super Bowl LVIII";
    const primitives = defaultPrimitives;

    console.log('--- START TEST ---');
    try {
        const result = await evaluateWithConsensus(script, topic, primitives);
        console.log('--- RESULT ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('--- ERROR ---', e);
    }
}

test();
