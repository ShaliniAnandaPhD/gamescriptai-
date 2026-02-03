module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    extensionsToTreatAsEsm: ['.ts'],
    setupFiles: ['dotenv/config'],
};
