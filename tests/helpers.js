import { spawn } from 'child_process';
import process from 'process';
import { getSeedCommand } from './config.js';

const backendName = process.env.BACKEND_NAME || 'unknown';
const backendPath = process.env.BACKEND_PATH || '';

export async function seedDatabase() {
    if (!backendPath) return;

    console.log(`🌱 Seeding database for test (${backendName})...`);

    // Get the appropriate seed command for this backend type
    const { command, args } = getSeedCommand(backendName);

    console.log(`🔧 Executing: ${command} ${args.join(' ')} in ${backendPath}`);

    const seedProcess = spawn(command, args, {
        cwd   : backendPath,
        stdio : 'pipe'
    });

    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        // Capture stdout for debugging
        seedProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            // Log progress for visibility
            if (output.includes('seeded') || output.includes('Added') || output.includes('created')) {
                console.log(`📝 ${output.trim()}`);
            }
        });

        // Capture stderr for error reporting
        seedProcess.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            // Log warnings/errors immediately
            console.log(`⚠️ Seed stderr: ${output.trim()}`);
        });

        seedProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Database seeded successfully`);
                resolve();
            }
            else {
                console.log(`❌ Seed failed for ${backendName}:`);
                if (stdout) {
                    console.log('STDOUT:', stdout);
                }
                if (stderr) {
                    console.log('STDERR:', stderr);
                }
                reject(new Error(`Seed failed with code ${code}. ${stderr ? `STDERR: ${stderr}` : ''}`));
            }
        });

        seedProcess.on('error', (error) => {
            console.log(`❌ Seed process error: ${error.message}`);
            reject(error);
        });
    });
}
