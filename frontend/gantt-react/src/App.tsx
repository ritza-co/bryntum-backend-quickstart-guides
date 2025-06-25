import { useRef } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import { ganttConfig } from './ganttConfig';

function App() {
    const gantt = useRef(null);

    return (
        <BryntumGantt ref={gantt} {...ganttConfig} />
    );
}

export default App;
