import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

const BACKEND_PORT = 1337;
const FRONTEND_PORT = 5173;
const SERVER_TIMEOUT = 30000; // 30 seconds
const TEST_TIMEOUT = 120000; // 60 seconds

// Global process tracker for cleanup
const activeProcesses = new Set();

const combinations = [
    {
        backend   : 'express-sqlite-gantt',
        frontends : ['gantt-angular', 'gantt-react', 'gantt-vanilla', 'gantt-vue'],
        product   : 'gantt'
    },
    {
        backend   : 'express-sqlite-grid',
        frontends : ['grid-angular', 'grid-react', 'grid-vanilla', 'grid-vue'],
        product   : 'grid'
    },
    {
        backend   : 'express-sqlite-scheduler',
        frontends : ['scheduler-angular', 'scheduler-react', 'scheduler-vanilla', 'scheduler-vue'],
        product   : 'scheduler'
    }
];

class TestResults {
    constructor() {
        this.results = [];
        this.failed = [];
        this.passed = [];
    }

    add(backend, frontend, status, error = null) {
        const result = { backend, frontend, status, error, timestamp : new Date().toISOString() };
        this.results.push(result);

        if (status === 'PASS') {
            this.passed.push(result);
        }
        else {
            this.failed.push(result);
        }
    }

    summary() {
        console.log('\n=== TEST RESULTS SUMMARY ===');
        console.log(`Total combinations: ${this.results.length}`);
        console.log(`Passed: ${this.passed.length}`);
        console.log(`Failed: ${this.failed.length}`);

        if (this.failed.length > 0) {
            console.log('\n=== FAILED COMBINATIONS ===');
            this.failed.forEach(result => {
                console.log(`❌ ${result.backend} + ${result.frontend}`);
                if (result.error) {
                    console.log(`Error: ${result.error}`);
                }
            });
        }

        if (this.passed.length > 0) {
            console.log('\n=== PASSED COMBINATIONS ===');
            this.passed.forEach(result => {
                console.log(`✅ ${result.backend} + ${result.frontend}`);
            });
        }

        return this.failed.length === 0;
    }
}

async function waitForPort(port, timeout = SERVER_TIMEOUT) {
    const startTime = Date.now();
    let attempts = 0;

    console.log(`⏳ Waiting for server on port ${port}...`);

    while (Date.now() - startTime < timeout) {
        attempts++;
        try {
            const response = await fetch(`http://localhost:${port}`, {
                method : 'GET',
                signal : AbortSignal.timeout(2000)
            });
            if (response.ok || response.status === 404) {
                console.log(`✅ Server responding on port ${port} after ${attempts} attempts`);
                return true;
            }
        }
        catch (error) {
            if (attempts % 5 === 0) {  // Log every 5th attempt
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                console.log(`⏳ Still waiting for port ${port} (${elapsed}s elapsed, attempt ${attempts})`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Server on port ${port} did not start within ${timeout}ms after ${attempts} attempts`);
}

async function startBackend(backendName) {
    const backendPath = path.join(rootDir, 'backend', backendName);
    let devProcess = null;

    try {
        console.log(`🔧 Starting backend: ${backendName}`);
        console.log(`📁 Backend path: ${backendPath}`);

        // Kill any existing process on backend port
        await killProcessOnPort(BACKEND_PORT);

        // Start dev server (seeding is now done before each test suite)
        console.log(`🚀 Starting dev server for ${backendName}...`);
        console.log(`🔧 Executing: npm run dev in ${backendPath}`);
        devProcess = spawn('npm', ['run', 'dev'], {
            cwd   : backendPath,
            stdio : ['ignore', 'pipe', 'pipe']
        });

        // Monitor process output for errors
        // listening for 'data' event- process is sending data to the main process (Node.js running the orchestrator.js). This happens when the dev server is running and sending output to the console.
        devProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Server running') || output.includes('listening')) {
                console.log(`📡 Backend server output: ${output.trim()}`);
            }
        });

        devProcess.stderr.on('data', (data) => {
            console.log(`⚠️ Backend stderr: ${data.toString().trim()}`);
        });

        devProcess.on('error', (error) => {
            console.log(`❌ Backend process error: ${error.message}`);
        });

        // Track the process for cleanup
        activeProcesses.add(devProcess);

        // Wait for server to be ready
        await waitForPort(BACKEND_PORT);
        console.log(`✅ Backend ${backendName} ready on port ${BACKEND_PORT}`);

        return devProcess;

    }
    catch (error) {
        console.log(`❌ Failed to start backend ${backendName}: ${error.message}`);

        // Kill the process if it was started
        if (devProcess) {
            killProcess(devProcess);
        }

        // Also kill any processes that might be on the port
        await killProcessOnPort(BACKEND_PORT);

        throw error;
    }
}

async function startFrontend(frontendName) {
    const frontendPath = path.join(rootDir, 'frontend', frontendName);
    let devProcess = null;

    try {
        console.log(`🔧 Starting frontend: ${frontendName}`);
        console.log(`📁 Frontend path: ${frontendPath}`);

        // Kill any existing process on frontend port
        await killProcessOnPort(FRONTEND_PORT);

        console.log(`🔧 Executing: npm run dev in ${frontendPath}`);
        devProcess = spawn('npm', ['run', 'dev'], {
            cwd   : frontendPath,
            stdio : ['ignore', 'pipe', 'pipe']
        });

        // Monitor process output for errors
        devProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Local:') || output.includes('ready')) {
                console.log(`📡 Frontend server output: ${output.trim()}`);
            }
        });

        devProcess.stderr.on('data', (data) => {
            console.log(`⚠️ Frontend stderr: ${data.toString().trim()}`);
        });

        devProcess.on('error', (error) => {
            console.log(`❌ Frontend process error: ${error.message}`);
        });

        // Track the process for cleanup
        activeProcesses.add(devProcess);

        // Wait for server to be ready
        await waitForPort(FRONTEND_PORT);
        console.log(`✅ Frontend ${frontendName} ready on port ${FRONTEND_PORT}`);

        return devProcess;

    }
    catch (error) {
        console.log(`❌ Failed to start frontend ${frontendName}: ${error.message}`);

        // Kill the process if it was started
        if (devProcess) {
            killProcess(devProcess);
        }

        // Also kill any processes that might be on the port
        await killProcessOnPort(FRONTEND_PORT);

        throw error;
    }
}

async function seedDatabase(backendName) {
    const backendPath = path.join(rootDir, 'backend', backendName);

    console.log(`📦 Seeding database for ${backendName}...`);
    console.log(`🔧 Executing: npm run seed in ${backendPath}`);

    const seedProcess = spawn('npm', ['run', 'seed'], {
        cwd   : backendPath,
        stdio : 'pipe'
    });

    return new Promise((resolve, reject) => {
        seedProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Database seeded successfully for ${backendName}`);
                resolve();
            }
            else {
                reject(new Error(`Seed failed with code ${code}`));
            }
        });

        seedProcess.on('error', reject);
    });
}

async function runTests(product, backend, frontend) {
    console.log(`🧪 Running CRUD tests for ${backend} + ${frontend}...`);

    // Seed database before each test suite for clean state
    await seedDatabase(backend);

    const testProcess = spawn('npx', ['playwright', 'test', `tests/${product}-crud.spec.js`], {
        cwd   : rootDir,
        stdio : 'pipe',
        env   : {
            ...process.env,
            BACKEND_NAME  : backend,
            FRONTEND_NAME : frontend,
            PRODUCT_TYPE  : product
        }
    });

    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        testProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        testProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        const timeout = setTimeout(() => {
            testProcess.kill('SIGKILL');
            reject(new Error(`Test timed out after ${TEST_TIMEOUT}ms`));
        }, TEST_TIMEOUT);

        testProcess.on('close', (code) => {
            clearTimeout(timeout);

            if (code === 0) {
                console.log(`✅ Tests passed for ${backend} + ${frontend}`);
                resolve();
            }
            else {
                const error = stderr || stdout || `Test failed with code ${code}`;
                console.log(`❌ Tests failed for ${backend} + ${frontend}: ${error}`);
                reject(new Error(error));
            }
        });

        testProcess.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

async function killProcessOnPort(port) {
    try {
        // Find process using the port
        // lsof ("list open files") is a command that lists all open files and the processes that have them open - Unix-like systems (like macOS and Linux)
        // -t: This option tells lsof to output only the process IDs - only need the PID (process ID) to kill the process.
        // -i: filter by network-related files (IP sockets).
        // :${port} is the port number to check.
        // lsofProcess is a child process that runs the lsof command and pipes the output to the main process.

        // spawn is a function that creates a new child process and returns a stream object.
        // stdio: 'pipe' means the output of the lsof command will be piped to the main process (Node.js running the orchestrator.js).
        const lsofProcess = spawn('lsof', ['-ti', `:${port}`], { stdio : 'pipe' });

        return new Promise((resolve) => {
            // main process (Node.js running the orchestrator.js) will listen to the output of the lsof command and store it in the output variable.
            let output = '';

            // main process listens to the output of the lsof command and stores it in the output variable.
            lsofProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            lsofProcess.on('close', async(code) => {
                // if the lsof command exits with code 0 (success) and there is output, then we can kill the process.
                if (code === 0 && output.trim()) {
                    const pids = output.trim().split('\n').filter(pid => pid.trim());

                    for (const pid of pids) {
                        try {
                            console.log(`🔪 Killing process ${pid} on port ${port}`);
                            process.kill(parseInt(pid), 'SIGTERM');

                            // Wait a moment, then force kill if still running
                            setTimeout(() => {
                                try {
                                    process.kill(parseInt(pid), 'SIGKILL');
                                }
                                catch (error) {
                                    // Process already dead, ignore
                                }
                            }, 2000);

                        }
                        catch (error) {
                            // Process might already be dead
                            console.log(`Process ${pid} already terminated`);
                        }
                    }

                    // Wait for processes to die
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                resolve();
            });

            lsofProcess.on('error', () => {
                // lsof might not be available or no process found
                resolve();
            });
        });
    }
    catch (error) {
        // Ignore errors, continue anyway
        console.log(`Could not kill processes on port ${port}: ${error.message}`);
    }
}

function killProcess(process) {
    if (process && !process.killed) {
        // Remove from active processes Set
        activeProcesses.delete(process);

        // process.kill is a function that sends a signal to the process.
        // SIGTERM (signal termination) is a signal that tells the process to terminate gracefully. A signal is a message sent to a process )running program or service) to indicate a specific event or request.

        process.kill('SIGTERM');

        // Force kill after 5 seconds if still running
        setTimeout(() => {
            if (!process.killed) {
                process.kill('SIGKILL');
            }
        }, 5000);
    }
}

// Function to kill all active processes
async function killAllActiveProcesses() {
    console.log(`🧹 Cleaning up ${activeProcesses.size} active processes...`);

    const promises = [];

    for (const process of activeProcesses) {
        if (process && !process.killed) {
            promises.push(new Promise((resolve) => {
                process.kill('SIGTERM');

                setTimeout(() => {
                    if (!process.killed) {
                        process.kill('SIGKILL');
                    }
                    resolve();
                }, 2000);
            }));
        }
    }

    await Promise.all(promises);
    activeProcesses.clear();

    // Also kill any processes on our ports
    await killProcessOnPort(BACKEND_PORT);
    await killProcessOnPort(FRONTEND_PORT);
}

async function runAllTests() {
    const results = new TestResults();

    try {
        const totalCombinations = combinations.reduce((total, combo) => total + combo.frontends.length, 0);

        console.log('🚀 Starting Bryntum CRUD Test Orchestrator');
        console.log(`Testing ${totalCombinations} frontend-backend combinations...`);

        for (const { backend, frontends, product } of combinations) {
            let backendProcess = null;

            try {
                // Start backend
                backendProcess = await startBackend(backend);

                // Test each frontend with this backend
                for (const frontend of frontends) {
                    let frontendProcess = null;

                    try {
                        // Start frontend
                        frontendProcess = await startFrontend(frontend);

                        // Run tests
                        await runTests(product, backend, frontend);
                        results.add(backend, frontend, 'PASS');

                    }
                    catch (error) {
                        console.error(`❌ Error testing ${backend} + ${frontend}:`, error.message);
                        results.add(backend, frontend, 'FAIL', error.message);
                    }
                    finally {
                        // Stop frontend
                        if (frontendProcess) {
                            killProcess(frontendProcess);
                            console.log(`🛑 Stopped frontend: ${frontend}`);
                        }

                        // Wait a moment for port to free up
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }

            }
            catch (error) {
                console.error(`❌ Error with backend ${backend}:`, error.message);

                // Mark all frontends as failed for this backend
                frontends.forEach(frontend => {
                    results.add(backend, frontend, 'FAIL', `Backend startup failed: ${error.message}`);
                });

            }
            finally {
                // Stop backend
                if (backendProcess) {
                    killProcess(backendProcess);
                    console.log(`🛑 Stopped backend: ${backend}`);
                }

                // Wait a moment for port to free up
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Show final results
        const allPassed = results.summary();

        // Write results to file
        await fs.writeFile(
            path.join(rootDir, 'test-results.json'),
            JSON.stringify(results.results, null, 2)
        );

        console.log('\n📊 Detailed results saved to test-results.json');

        // Exit with error code if any tests failed
        process.exit(allPassed ? 0 : 1);

    }
    catch (error) {
        console.error('💥 Critical error in orchestrator:', error.message);

        // Clean up all processes before exiting
        await killAllActiveProcesses();

        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async() => {
    console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
    await killAllActiveProcesses();
    process.exit(1);
});

process.on('SIGTERM', async() => {
    console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
    await killAllActiveProcesses();
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', async(error) => {
    console.error('💥 Uncaught exception:', error.message);
    await killAllActiveProcesses();
    process.exit(1);
});

process.on('unhandledRejection', async(reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    await killAllActiveProcesses();
    process.exit(1);
});

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        backend  : null,
        frontend : null,
        product  : null,
        help     : false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--backend':
            case '-b':
                options.backend = args[++i];
                break;
            case '--frontend':
            case '-f':
                options.frontend = args[++i];
                break;
            case '--product':
            case '-p':
                options.product = args[++i];
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

// Filter combinations based on arguments
function filterCombinations(options) {
    if (!options.backend && !options.frontend && !options.product) {
        return combinations;
    }

    return combinations.filter(combo => {
        // Match product if specified
        if (options.product && combo.product !== options.product) {
            return false;
        }

        // Match backend if specified
        if (options.backend && combo.backend !== options.backend) {
            return false;
        }

        // Filter frontends if specified
        if (options.frontend) {
            combo.frontends = combo.frontends.filter(f => f === options.frontend);
            return combo.frontends.length > 0;
        }

        return true;
    });
}

// Show usage help
function showHelp() {
    console.log(`
🧪 Bryntum CRUD Test Orchestrator

Usage:
  node orchestrator.js [options]

Options:
  --backend, -b <name>     Test specific backend (e.g., express-sqlite-gantt)
  --frontend, -f <name>    Test specific frontend (e.g., gantt-react)
  --product, -p <name>     Test specific product (e.g., gantt)
  --help, -h               Show this help message

Examples:
  node orchestrator.js                           # Test all combinations
  node orchestrator.js -b express-sqlite-gantt  # Test all frontends with specific backend
  node orchestrator.js -f gantt-react           # Test specific frontend with all backends
  node orchestrator.js -b express-sqlite-gantt -f gantt-react  # Test specific combination
  node orchestrator.js -p gantt                 # Test all gantt combinations
`);
}

// Modified runAllTests to accept filtered combinations
async function runFilteredTests(filteredCombinations) {
    const results = new TestResults();

    try {
        const totalCombinations = filteredCombinations.reduce((total, combo) => total + combo.frontends.length, 0);

        if (totalCombinations === 0) {
            console.log('❌ No matching combinations found');
            process.exit(1);
        }

        console.log('🚀 Starting Bryntum CRUD Test Orchestrator');
        console.log(`Testing ${totalCombinations} frontend-backend combinations...`);

        for (const { backend, frontends, product } of filteredCombinations) {
            let backendProcess = null;

            try {
                // Start backend
                backendProcess = await startBackend(backend);

                // Test each frontend with this backend
                for (const frontend of frontends) {
                    let frontendProcess = null;

                    try {
                        // Start frontend
                        frontendProcess = await startFrontend(frontend);

                        // Run tests
                        await runTests(product, backend, frontend);
                        results.add(backend, frontend, 'PASS');

                    }
                    catch (error) {
                        console.error(`❌ Error testing ${backend} + ${frontend}:`, error.message);
                        results.add(backend, frontend, 'FAIL', error.message);
                    }
                    finally {
                        // Stop frontend
                        if (frontendProcess) {
                            killProcess(frontendProcess);
                            console.log(`🛑 Stopped frontend: ${frontend}`);
                        }

                        // Wait a moment for port to free up
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }

            }
            catch (error) {
                console.error(`❌ Error with backend ${backend}:`, error.message);

                // Mark all frontends as failed for this backend
                frontends.forEach(frontend => {
                    results.add(backend, frontend, 'FAIL', `Backend startup failed: ${error.message}`);
                });

            }
            finally {
                // Stop backend
                if (backendProcess) {
                    killProcess(backendProcess);
                    console.log(`🛑 Stopped backend: ${backend}`);
                }

                // Wait a moment for port to free up
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Show final results
        const allPassed = results.summary();

        // Write results to file
        await fs.writeFile(
            path.join(rootDir, 'test-results.json'),
            JSON.stringify(results.results, null, 2)
        );

        console.log('\n📊 Detailed results saved to test-results.json');

        // Exit with error code if any tests failed
        process.exit(allPassed ? 0 : 1);

    }
    catch (error) {
        console.error('💥 Critical error in orchestrator:', error.message);

        // Clean up all processes before exiting
        await killAllActiveProcesses();

        process.exit(1);
    }
}

// Run the orchestrator
if (import.meta.url === `file://${process.argv[1]}`) {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        process.exit(0);
    }

    const filteredCombinations = filterCombinations(options);

    runFilteredTests(filteredCombinations).catch(async(error) => {
        console.error('💥 Orchestrator failed:', error);
        await killAllActiveProcesses();
        process.exit(1);
    });
}

export { runAllTests, runFilteredTests, TestResults, parseArgs, filterCombinations };