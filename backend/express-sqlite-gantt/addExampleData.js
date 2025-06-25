import { readFileSync } from 'fs';
import { Task } from './models/index.js';
import sequelize from './config/database.js';

async function setupDatabase() {
    try {
        // Drop the table if it exists
        await Task.drop();
        console.log('Existing tasks table dropped.');

        // Wait for all models to synchronize with the database
        await sequelize.sync({ force : true });
        console.log('Database synced.');

        // Now add example data
        await addExampleData();
    }
    catch (error) {
        console.error('Failed to setup database: ', error);
    }
}

async function addExampleData() {
    try {
    // Read and parse the JSON data
        const tasksData = JSON.parse(readFileSync('../../example-json-data/gantt/tasks.json'));

        await sequelize.transaction(async(t) => {
            const tasks = await Task.bulkCreate(tasksData, { transaction : t });
            return { tasks };
        });

        console.log('Tasks added to database successfully.');
    }
    catch (error) {
        console.error('Failed to add data to database due to an error: ', error);
    }
}

setupDatabase();
