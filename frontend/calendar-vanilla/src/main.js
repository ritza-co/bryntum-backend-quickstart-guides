import { Calendar } from '@bryntum/calendar';
import './style.css';

const calendar = new Calendar({
    appendTo    : 'app',
    date        : new Date(2026, 6, 20),
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    }
});