import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Event, Resource } from './models/index.js';

async function setupDatabase() {
    try {
        await Promise.all([
            Event.drop(),
            Resource.drop()
        ]);
        console.log('Existing tables dropped.');

        await sequelize.sync({ force : true });
        console.log('Database synced.');

        await addExampleData();
    }
    catch (error) {
        console.error('Failed to setup database: ', error);
    }
}

async function addExampleData() {
    try {
        const eventsData = JSON.parse(readFileSync('../../example-json-data/calendar/events.json'));
        const resourcesData = JSON.parse(readFileSync('../../example-json-data/calendar/resources.json'));

        await sequelize.transaction(async(t) => {
            const resources = await Resource.bulkCreate(resourcesData, { transaction : t });
            const events = await Event.bulkCreate(eventsData, { transaction : t });

            return { events, resources };
        });

        console.log('Events and resources added to database successfully.');
    }
    catch (error) {
        console.error('Failed to add data to database due to an error: ', error);
    }
}

setupDatabase();