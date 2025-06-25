import { BryntumSchedulerProps } from '@bryntum/scheduler-react';

export const schedulerConfig: BryntumSchedulerProps = {
    startDate   : new Date(2025, 9, 20, 6),
    endDate     : new Date(2025, 9, 20, 20),
    viewPreset  : 'hourAndDay',
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    },
    columns : [{ text : 'Name', field : 'name', width : 130 }]
};
