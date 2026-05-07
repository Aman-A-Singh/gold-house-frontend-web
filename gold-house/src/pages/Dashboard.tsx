import { ArrowRight, Clock } from "lucide-react";
import StatCardsSection from "@/components/ui/statsCard";
import OrdersTable from "@/components/ui/ordersTable/OrdersTable";
import { Link } from "react-router-dom";



const Dashboard = () => {
    const pendingCount = 5;
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

            <StatCardsSection />

            <div className="space-y-6 flex items-center justify-between">
                <h2 className="text-lg font-display text-foreground">Recent Orders</h2>
                <Link to="/orders" className="text-lg text-accent font-display hover:underline flex items-center gap-1">
                    View all <ArrowRight size={20} />
                </Link>
            </div>
            <OrdersTable />

        </div>
    );
}




export default Dashboard;