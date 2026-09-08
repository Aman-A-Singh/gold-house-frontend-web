import { Order } from  "@/models/order";

export interface PagedOrderResult {
    content: Order[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export const getFilteredOrders = async (
    { page = 0, size = 10, status, sortKey, sortDir, searchQuery }: {
        page?: number;
        size?: number;
        searchQuery?: string | null;
        status?: string | null;
        sortKey?: string | null;
        sortDir?: "asc" | "desc" | null;
    }
): Promise<PagedOrderResult> => {
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
    const response = await fetch(`/api/orders/filteredOrder?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const raw = data.data || {};
    return {
        content: raw.content ?? [],
        pageNumber: raw.currentPage ?? raw.pageNumber ?? 0,
        pageSize: raw.pageSize ?? size,
        totalElements: raw.totalItems ?? raw.totalElements ?? 0,
        totalPages: raw.totalPages ?? 0,
        last: raw.last ?? true,
    };
};


export const addOrder = async (order: Order): Promise<Order> => {
    const response = await fetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(order),
    });
    if (!response.ok) {
        throw new Error(`Failed to add order: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data;
};