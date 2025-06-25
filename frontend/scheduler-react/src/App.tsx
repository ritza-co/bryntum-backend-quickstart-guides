import { useRef } from 'react';
import { BryntumScheduler } from '@bryntum/scheduler-react';
import { schedulerConfig } from './schedulerConfig';

function App() {
    const scheduler = useRef(null);

    return (
        <BryntumScheduler ref={scheduler} {...schedulerConfig} />
    );
}

export default App;
