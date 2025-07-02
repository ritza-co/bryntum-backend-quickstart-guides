import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : './taskboard.sqlite3'
});

export default sequelize;