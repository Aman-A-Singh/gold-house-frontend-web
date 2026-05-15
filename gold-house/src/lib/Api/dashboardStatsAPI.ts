import { DashboardStats } from "@/models/dashboard";

export const fetchDashboardStats = async (userId: number | null): Promise<DashboardStats> => {
    const response = await fetch(`/api/orders/home?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data;
};