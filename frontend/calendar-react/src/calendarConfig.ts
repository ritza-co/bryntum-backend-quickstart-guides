import { BryntumCalendarProps } from '@bryntum/calendar-react';

export const calendarConfig: BryntumCalendarProps = {
    date        : new Date(2025, 9, 20),
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    }
};