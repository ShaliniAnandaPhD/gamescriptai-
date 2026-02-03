import { spawn } from 'child_process';
import chalk from 'chalk';

const TEST_SUITES = [
    {
        name: 'Scenario Tests',
        path: 'tests/scenarios',
        timeout: 30000,
    },
    {
        name: 'Integration Tests',
        path: 'tests/integration',
        timeout: 60000,
    },
    {
        name: 'Performance Tests',
        path: 'tests/performance',
        timeout: 30000,
    },
];

async function runTestSuite(suite: typeof TEST_SUITES[0]) {
    console.log(chalk.blue(`\n${'='.repeat(60)}`));
    console.log(chalk.blue.bold(`  🚀 Running: ${suite.name}`));
    console.log(chalk.blue(`${'='.repeat(60)}\n`));

    return new Promise((resolve, reject) => {
        // We use npx jest directly
        const jest = spawn('npx', [
            'jest',
            suite.path,
            '--verbose',
            `--testTimeout=${suite.timeout}`,
            '--runInBand',
        ], {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'test' },
            shell: true
        });

        jest.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.green(`\n✅ ${suite.name} passed!\n`));
                resolve(true);
            } else {
                console.log(chalk.red(`\n❌ ${suite.name} failed.\n`));
                reject(new Error(`${suite.name} failed`));
            }
        });
    });
}

async function main() {
    console.log(chalk.cyan.bold('\n🧪 GameScript AI 2.5 - Comprehensive Test Suite\n'));

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    // Check if server is running
    try {
        const health = await fetch('http://localhost:5174/api/health');
        if (!health.ok) throw new Error();
        console.log(chalk.green('📡 Backend signal detected. Proceeding with tests...\n'));
    } catch (e) {
        console.log(chalk.red('🚨 Backend signal NOT detected. Please ensure "npm run dev" is active in another terminal.\n'));
        process.exit(1);
    }

    for (const suite of TEST_SUITES) {
        try {
            await runTestSuite(suite);
            passed++;
        } catch (error) {
            failed++;
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('  TEST SUMMARY'));
    console.log(chalk.cyan('='.repeat(60) + '\n'));

    console.log(`  Total Suites: ${TEST_SUITES.length}`);
    console.log(chalk.green(`  Passed: ${passed}`));
    if (failed > 0) {
        console.log(chalk.red(`  Failed: ${failed}`));
    }
    console.log(`  Duration: ${duration}s\n`);

    if (failed === 0) {
        console.log(chalk.green.bold('👑 SYSTEM STABLE: All tests passed!\n'));
        process.exit(0);
    } else {
        console.log(chalk.red.bold('🚨 SYSTEM UNSTABLE: Some tests failed\n'));
        process.exit(1);
    }
}

main().catch(console.error);
