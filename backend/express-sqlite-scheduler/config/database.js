import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : './scheduler.sqlite3'
});

export default sequelize;