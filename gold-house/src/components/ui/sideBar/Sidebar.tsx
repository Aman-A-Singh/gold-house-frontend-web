import { NavLink } from "@/components/ui/sideBar/NavLink";
import { Users, LayoutDashboard, ShoppingCart, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldHouseLogo from "../goldHouseLogo";

interface SidebarProps {
    isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
    return (
        <aside className={cn(
            "relative bg-card border-r border-border flex-shrink-0 transition-all duration-200 bg-primary",
            isCollapsed ? "w-24" : "w-64"
        )}>
            <div className="pl-0 pt-8 relative">
                <GoldHouseLogo
                    className={cn("mx-auto relative", !isCollapsed && "hidden")}></GoldHouseLogo>
            </div>

            <div className={cn("p-4  mx-3  relative", isCollapsed ? "opacity-0 hidden" : "opacity-100")}>
                <h2 className="text-2xl font-bold text-secondary tracking-wider transition-opacity">
                    GOLD HOUSE
                </h2>
            </div>
            <div className="flex px-4 relative">
                <div className={cn("mx-6 text-sm text-muted-foreground text-sidebar-foreground/70 transition-opacity", isCollapsed ? "opacity-0 hidden" : "opacity-100  mx-l̥4")}>
                    MAIN MENU
                </div>

            </div>
            <nav className="mt-4">
                <ul>
                    <li>
                        <NavLink
                            to="/dashboard"
                            end={true}
                            className="mx-6 my-4 group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
                            activeClassName="!bg-sidebar-primary !text-sidebar-primary-foreground font-semibold shadow-md"
                            aria-label="Dashboard"
                        >
                            <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className={cn("tracking-wide", isCollapsed && "opacity-0 hidden")}>Dashboard</span>
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/orders"
                            end={true}
                            className="mx-6  my-4  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
                            activeClassName="!bg-sidebar-primary !text-sidebar-primary-foreground font-semibold shadow-md"
                            aria-label="Orders"
                        >
                            <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className={cn("tracking-wide", isCollapsed && "opacity-0 hidden")}>Orders</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/customers"
                            end={true}
                            className="mx-6  my-4  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
                            activeClassName="!bg-sidebar-primary !text-sidebar-primary-foreground font-semibold shadow-md"
                            aria-label="Customers"
                        >
                            <Users className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className={cn("tracking-wide", isCollapsed && "opacity-0 hidden")}>Customers</span>
                        </NavLink>
                    </li>

                </ul>
            </nav>
            <div
                className="mx-6  my-4  absolute inset-x-0 bottom-0 group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-all duration-200"
            >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className={cn("tracking-wide", isCollapsed && "opacity-0 hidden")} >Logout</span>
            </div>
        </aside>
    );
};

export default Sidebar;