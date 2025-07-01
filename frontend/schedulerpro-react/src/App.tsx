import { useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { schedulerProConfig } from './schedulerproConfig';

function App() {
    const schedulerPro = useRef(null);

    return (
        <BryntumSchedulerPro ref={schedulerPro} {...schedulerProConfig} />
    );
}

export default App;
