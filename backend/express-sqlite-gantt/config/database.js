import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : './gantt.sqlite3'
});

export default sequelize;