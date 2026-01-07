import { spawn } from 'child_process';
import process from 'process';

const backendName = process.env.BACKEND_NAME || 'unknown';
const backendPath = process.env.BACKEND_PATH || '';

export async function seedDatabase() {
    if (!backendPath) return;

    console.log(`🌱 Seeding database for test...`);

    const isLaravel = backendName.toLowerCase().includes('laravel');
    const isDotNet = backendName.toLowerCase().includes('dotnet');
    
    let command, args;
    if (isDotNet) {
        command = 'dotnet';
        args = ['run', '--', '--seed'];
    }
    else if (isLaravel) {
        command = 'composer';
        args = ['run', 'seed'];
    }
    else {
        command = 'npm';
        args = ['run', 'seed'];
    }

    const seedProcess = spawn(command, args, {
        cwd   : backendPath,
        stdio : 'pipe'
    });

    return new Promise((resolve, reject) => {
        seedProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Database seeded successfully`);
                resolve();
            }
            else {
                reject(new Error(`Seed failed with code ${code}`));
            }
        });
        seedProcess.on('error', reject);
    });
}
