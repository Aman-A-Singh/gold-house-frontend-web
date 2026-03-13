import React, { useState } from "react";
import Sidebar from "./ui/sideBar/Sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="flex h-screen bg-background">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;