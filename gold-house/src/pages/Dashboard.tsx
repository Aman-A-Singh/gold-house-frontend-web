import { ArrowRight, Clock } from "lucide-react";
import StatCardsSection from "@/components/ui/statsCard";
import OrdersTable from "@/components/ui/ordersTable/OrdersTable";
import { Link, useLoaderData, useNavigation, LoaderFunctionArgs } from "react-router-dom";
import { fetchDashboardStats, fetchDashboardOrders } from "@/lib/Api/dashboardStatsAPI";
import { DashboardStats } from "@/models/dashboard";
import { Order } from "@/models/order";

export const dashboardLoader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const sortKey = url.searchParams.get("sortKey");
    const sortDir = url.searchParams.get("sortDir") as "asc" | "desc" | null;
    const searchQuery = url.searchParams.get("q");

    const userIdStr = localStorage.getItem("gh_user_id");
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;

    // 1. Fetch Stats API first and wait for completion
    const stats = await fetchDashboardStats(userId);

    // 2. Once Stats API finishes, call Dashboard Orders API
    const dashboardOrders = await fetchDashboardOrders({
        status: status === "All" ? null : status?.toUpperCase(),
        page: 0,
        size: 9999,
        sortKey,
        sortDir,
        searchQuery: searchQuery || null,
    }).catch(() => []);

    return { stats, dashboardOrders };
};


const Dashboard = () => {
    const { stats, dashboardOrders } = useLoaderData() as { stats: DashboardStats; dashboardOrders: Order[] };
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";
    const pendingCount = stats?.metrics?.pendingOrders || 0; 
    return (
        <div className="space-y-6">

            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 flex items-center justify-between text-primary-foreground animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="font-semibold">You have {pendingCount} pending order{pendingCount > 1 ? "s" : ""}</p>
                        <p className="text-xs opacity-75">Review and update their status</p>
                    </div>
                </div>
                <Link to="/orders" className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition">
                    View Orders <ArrowRight size={14} />
                </Link>
            </div>

            <StatCardsSection metrics={stats?.metrics} />

            <div className="space-y-6 flex items-center justify-between">
                <h2 className="text-lg font-display text-foreground">Recent Orders</h2>
                <Link to="/orders" className="text-lg text-accent font-display hover:underline flex items-center gap-1">
                    View all <ArrowRight size={20} />
                </Link>
            </div>
            <OrdersTable orders={dashboardOrders || []} showAddButton={false} isLoading={isLoading} />

        </div>
    );

}

export default Dashboard;