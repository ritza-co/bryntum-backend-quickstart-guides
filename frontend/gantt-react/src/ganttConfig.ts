import type { BryntumGanttProps } from '@bryntum/gantt-react';

export const ganttConfig: BryntumGanttProps = {
    viewPreset : 'weekAndDayLetter',
    barMargin  : 10,
    project    : {
        taskStore : {
            transformFlatData : true
        },
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    },
    columns : [
        { type : 'name', field : 'name', text : 'Name', width : 250 },
        { type : 'startdate', field : 'startDate', text : 'Start Date' },
        { type : 'enddate', field : 'endDate', text : 'End Date' },
        { type : 'duration', field : 'fullDuration', text : 'Duration' },
        { type : 'percentdone', field : 'percentDone', text : '% Done', width : 80 }
    ]
};
