/**
 * Test configuration constants
 * Centralized configuration for the test orchestrator and helpers
 */

export const config = {
    // Server ports
    BACKEND_PORT  : 1337,
    FRONTEND_PORT : 5173,

    // Timeouts (in milliseconds)
    SERVER_TIMEOUT : 30000,  // 30 seconds - max wait for server to start
    TEST_TIMEOUT   : 120000, // 120 seconds - max time for a test to complete

    // URLs
    BACKEND_BASE_URL  : 'http://localhost:1337',
    FRONTEND_BASE_URL : 'http://localhost:5173'
};

/**
 * Backend type configurations
 * To add a new backend type, add an entry here with:
 * - keyword: string to match in backend folder name
 * - devCommand: command and args to start the dev server
 * - seedCommand: command and args to seed the database
 */
export const backends = [
    {
        keyword     : 'express',
        devCommand  : { command : 'npm', args : ['run', 'dev'] },
        seedCommand : { command : 'npm', args : ['run', 'seed'] }
    },
    {
        keyword     : 'laravel',
        devCommand  : { command : 'composer', args : ['run', 'dev'] },
        seedCommand : { command : 'composer', args : ['run', 'seed'] }
    },
    {
        keyword     : 'dotnet',
        devCommand  : { command : 'dotnet', args : ['run'] },
        seedCommand : { command : 'dotnet', args : ['run', '--', '--seed'] }
    }
];

/**
 * Finds the backend configuration based on the backend name
 * @param {string} backendName - The name of the backend (e.g., 'express-sqlite-gantt')
 * @returns {Object} The backend configuration
 * @throws {Error} If backend type is unknown
 */
function findBackendConfig(backendName) {
    const name = backendName.toLowerCase();
    const backendConfig = backends.find(b => name.includes(b.keyword));

    if (!backendConfig) {
        const knownTypes = backends.map(b => b.keyword).join(', ');
        throw new Error(`Unknown backend type: ${backendName}. Expected name to include one of: ${knownTypes}`);
    }

    return backendConfig;
}

/**
 * Gets the command and arguments for running the dev server based on backend type
 * @param {string} backendName - The name of the backend (e.g., 'express-sqlite-gantt')
 * @returns {{ command: string, args: string[] }} The command and arguments
 * @throws {Error} If backend type is unknown
 */
export function getDevCommand(backendName) {
    return findBackendConfig(backendName).devCommand;
}

/**
 * Gets the command and arguments for seeding the database based on backend type
 * @param {string} backendName - The name of the backend (e.g., 'express-sqlite-gantt')
 * @returns {{ command: string, args: string[] }} The command and arguments
 * @throws {Error} If backend type is unknown
 */
export function getSeedCommand(backendName) {
    return findBackendConfig(backendName).seedCommand;
}
