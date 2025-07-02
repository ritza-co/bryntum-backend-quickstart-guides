import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Resource = sequelize.define(
    'Resource',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : false
        }
    },
    {
        tableName  : 'resources',
        timestamps : false
    }
);

export default Resource;