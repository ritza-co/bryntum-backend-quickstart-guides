import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Player } from './models/index.js';

async function setupDatabase() {
    // Wait for all models to synchronize with the database
    await sequelize.sync();

    // Now add example data
    await addExampleData();
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