import { User } from "@/models/user";

export interface DashboardStats {
    user?: User;
    metrics: DashboardMetrics;
}

export interface DashboardMetrics {
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    canceledOrders: number;
    todayOrders?: number;
}