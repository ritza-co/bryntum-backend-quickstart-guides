import { readFileSync } from 'fs';
import { Task } from './models/index.js';
import sequelize from './config/database.js';

async function setupDatabase() {
    // Wait for all models to synchronize with the database
    await sequelize.sync({ force : true });

    // Now add example data
    await addExampleData();
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
