import { useRef } from 'react';
import { BryntumCalendar } from '@bryntum/calendar-react';
import { calendarConfig } from './calendarConfig';

function App() {
    const calendar = useRef(null);

    return (
        <BryntumCalendar ref={calendar} {...calendarConfig} />
    );
}

export default App;