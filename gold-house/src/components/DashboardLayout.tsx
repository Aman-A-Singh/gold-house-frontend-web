import React, { useState } from "react";
import Sidebar from "./ui/sideBar/Sidebar";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    return (
        <div className="min-h-screen flex w-full">
            <Sidebar isCollapsed={isCollapsed} />
            <div className="flex-1 flex flex-col overflow-auto relative">
                <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-card" role="banner">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-display text-foreground">
                                Welcome, <span className="italic">Amin Y Jumani</span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5" aria-label={`Today's date: ${today}`}>{today}</p>
                        </div>
                    </div>
                </header>
                <main id="main-content" className="flex-1 p-8" role="main" tabIndex={-1}>
                    {children}
                </main>
            </div>

            <div>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("absolute  top-25 z-50 -translate-x-1/2 w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring group-data-[state=collapsed]:left-[var(--sidebar-width-icon,3rem)]",
                        isCollapsed ? "left-24" : "left-64")}
                    onClick={toggleSidebar}
                >
                    <ChevronLeft className={cn("h-8 w-8 transition-transform color-primary", isCollapsed && "rotate-180")} />
                </Button>
            </div>

        </div>

    );
};

export default DashboardLayout;