import { createContext, useContext, useState } from 'react';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const [shouldRefresh, setShouldRefresh] = useState(false);

    const triggerRefresh = () => {
        setShouldRefresh(prev => !prev);
    };

    return (
        <DashboardContext.Provider value={{ shouldRefresh, triggerRefresh }}>
            {children}
        </DashboardContext.Provider>
    );
}

export const useDashboard = () => useContext(DashboardContext);
