import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define('Task', {
    id : {
        type          : DataTypes.INTEGER,
        primaryKey    : true,
        autoIncrement : true
    },
    name : {
        type      : DataTypes.STRING,
        allowNull : false
    },
    startDate : {
        type      : DataTypes.DATEONLY,
        allowNull : false
    },
    endDate : {
        type      : DataTypes.DATEONLY,
        allowNull : true
    },
    duration : {
        type      : DataTypes.INTEGER,
        allowNull : true
    },
    percentDone : {
        type         : DataTypes.INTEGER,
        defaultValue : 0
    },
    parentId : {
        type       : DataTypes.INTEGER,
        allowNull  : true,
        references : {
            model : 'Tasks',
            key   : 'id'
        }
    },
    expanded : {
        type         : DataTypes.BOOLEAN,
        defaultValue : false
    },
    rollup : {
        type         : DataTypes.BOOLEAN,
        defaultValue : false
    },
    manuallyScheduled : {
        type         : DataTypes.BOOLEAN,
        defaultValue : false
    }
}, {
    tableName : 'tasks'
});

// Define associations
Task.hasMany(Task, { as : 'children', foreignKey : 'parentId' });
Task.belongsTo(Task, { as : 'parent', foreignKey : 'parentId' });

export default Task;
