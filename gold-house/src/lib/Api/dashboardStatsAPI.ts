import { DashboardStats } from "@/models/dashboard";
import { Order } from "@/models/order";

let statsCache: { userId: number | null; data: DashboardStats; time: number } | null = null;

export const fetchDashboardStats = async (userId: number | null, forceRefresh = false): Promise<DashboardStats> => {
    const now = Date.now();
    // Cache stats for 60 seconds so search/filter changes don't re-trigger backend stats API
    if (!forceRefresh && statsCache && statsCache.userId === userId && (now - statsCache.time) < 60000) {
        return statsCache.data;
    }

    const response = await fetch(`/api/dashboard?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    statsCache = { userId, data: data.data, time: now };
    return data.data;
};

export const fetchDashboardOrders = async (
    { page = 0, size = 9999, status, sortKey, sortDir, searchQuery }: {
        page?: number;
        size?: number;
        searchQuery?: string | null;
        status?: string | null;
        sortKey?: string | null;
        sortDir?: "asc" | "desc" | null;
    } = {}
): Promise<Order[]> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (searchQuery) {
        const query = searchQuery.trim();
        if (query.startsWith("#")) {
            const orderId = query.slice(1).trim();
            if (orderId) {
                params.set("orderId", orderId);
            }
        } else {
            params.set("customerName", query);
        }
    }
    if (status) params.set("status", status);
    if (sortKey) params.set("sortBy", sortKey);
    if (sortDir) params.set("sortDir", sortDir);

    const response = await fetch(`/api/dashboard/orders?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    if (!response.ok) {
        // Return empty array if backend endpoint is not yet ready or returns error
        return [];
    }
    const data = await response.json();
    return data.data?.content || [];
};