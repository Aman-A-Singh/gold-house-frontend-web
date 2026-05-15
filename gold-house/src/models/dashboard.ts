import { User } from "@/models/user";
import { Order } from "./order";

export interface DashboardStats {
    user : User;
    metrics: DashboardMetrics;
    recentOrders: Order[];
}

export interface DashboardMetrics {
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    canceledOrders: number;
}