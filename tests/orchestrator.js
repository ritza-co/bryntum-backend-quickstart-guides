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
const TEST_TIMEOUT = 60000; // 60 seconds

const combinations = [
    {
        backend: 'express-sqlite-gantt',
        frontends: ['gantt-angular', 'gantt-react', 'gantt-vanilla', 'gantt-vue'],
        product: 'gantt'
    },
    {
        backend: 'express-sqlite-grid', 
        frontends: ['grid-angular', 'grid-react', 'grid-vanilla', 'grid-vue'],
        product: 'grid'
    },
    {
        backend: 'express-sqlite-scheduler',
        frontends: ['scheduler-angular', 'scheduler-react', 'scheduler-vanilla', 'scheduler-vue'],
        product: 'scheduler'
    }
];

class TestResults {
    constructor() {
        this.results = [];
        this.failed = [];
        this.passed = [];
    }

    add(backend, frontend, status, error = null) {
        const result = { backend, frontend, status, error, timestamp: new Date().toISOString() };
        this.results.push(result);
        
        if (status === 'PASS') {
            this.passed.push(result);
        } else {
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
                    console.log(`   Error: ${result.error}`);
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
    
    while (Date.now() - startTime < timeout) {
        try {
            const response = await fetch(`http://localhost:${port}`, { 
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            if (response.ok || response.status === 404) {
                return true;
            }
        } catch (error) {
            console.log(`Server not ready yet, continue waiting`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Server on port ${port} did not start within ${timeout}ms`);
}

async function startBackend(backendName) {
    const backendPath = path.join(rootDir, 'backend', backendName);
    
    console.log(`🔧 Starting backend: ${backendName}`);
    
    // Run seed first
    console.log(`📦 Seeding database for ${backendName}...`);
    const seedProcess = spawn('npm', ['run', 'seed'], {
        cwd: backendPath,
        stdio: 'pipe'
    });
    
    await new Promise((resolve, reject) => {
        seedProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Seed failed with code ${code}`));
            }
        });
        
        seedProcess.on('error', reject);
    });
    
    // Start dev server
    console.log(`🚀 Starting dev server for ${backendName}...`);
    const devProcess = spawn('npm', ['run', 'dev'], {
        cwd: backendPath,
        stdio: 'pipe'
    });
    
    // Wait for server to be ready
    await waitForPort(BACKEND_PORT);
    console.log(`✅ Backend ${backendName} ready on port ${BACKEND_PORT}`);
    
    return devProcess;
}

async function startFrontend(frontendName) {
    const frontendPath = path.join(rootDir, 'frontend', frontendName);
    
    console.log(`🔧 Starting frontend: ${frontendName}`);
    
    const devProcess = spawn('npm', ['run', 'dev'], {
        cwd: frontendPath,
        stdio: 'pipe'
    });
    
    // Wait for server to be ready
    await waitForPort(FRONTEND_PORT);
    console.log(`✅ Frontend ${frontendName} ready on port ${FRONTEND_PORT}`);
    
    return devProcess;
}

async function runTests(product, backend, frontend) {
    console.log(`🧪 Running CRUD tests for ${backend} + ${frontend}...`);
    
    const testProcess = spawn('npx', ['playwright', 'test', `tests/${product}-crud.spec.js`], {
        cwd: rootDir,
        stdio: 'pipe',
        env: {
            ...process.env,
            BACKEND_NAME: backend,
            FRONTEND_NAME: frontend,
            PRODUCT_TYPE: product
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
            } else {
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

function killProcess(process) {
    if (process && !process.killed) {
        process.kill('SIGTERM');
        
        // Force kill after 5 seconds if still running
        setTimeout(() => {
            if (!process.killed) {
                process.kill('SIGKILL');
            }
        }, 5000);
    }
}

async function runAllTests() {
    const results = new TestResults();
    
    console.log('🚀 Starting Bryntum CRUD Test Orchestrator');
    console.log(`Testing ${combinations.length} backend combinations...`);
    
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
                    
                } catch (error) {
                    console.error(`❌ Error testing ${backend} + ${frontend}:`, error.message);
                    results.add(backend, frontend, 'FAIL', error.message);
                } finally {
                    // Stop frontend
                    if (frontendProcess) {
                        killProcess(frontendProcess);
                        console.log(`🛑 Stopped frontend: ${frontend}`);
                    }
                    
                    // Wait a moment for port to free up
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
        } catch (error) {
            console.error(`❌ Error with backend ${backend}:`, error.message);
            
            // Mark all frontends as failed for this backend
            frontends.forEach(frontend => {
                results.add(backend, frontend, 'FAIL', `Backend startup failed: ${error.message}`);
            });
            
        } finally {
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

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
    process.exit(1);
});

// Run the orchestrator
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(error => {
        console.error('💥 Orchestrator failed:', error);
        process.exit(1);
    });
}

export { runAllTests, TestResults };