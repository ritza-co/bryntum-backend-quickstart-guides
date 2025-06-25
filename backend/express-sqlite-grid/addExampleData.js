import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Player } from './models/index.js';

async function setupDatabase() {
    try {
        // Drop the table if it exists
        await Player.drop();
        console.log('Existing players table dropped.');

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
        const playersData = JSON.parse(readFileSync('../../example-json-data/grid/players.json'));

        await sequelize.transaction(async(t) => {
            const players = await Player.bulkCreate(playersData, { transaction : t });
            return { players };
        });

        console.log('Players data added to database successfully.');
    }
    catch (error) {
        console.error('Failed to add data to database due to an error: ', error);
    }
}

setupDatabase();