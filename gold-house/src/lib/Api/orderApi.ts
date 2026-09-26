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

export const deleteOrder = async (id: string): Promise<void> => {
    if (!id || !id.toString().trim()) {
        throw new Error("Order ID cannot be empty");
    }
    const cleanId = id.toString().trim().replace(/^#/, "");
    const response = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        let errorMessage = `Failed to delete order #${cleanId}`;
        try {
            const data = await response.json();
            if (data?.message) {
                errorMessage = data.message;
            } else if (data?.error) {
                errorMessage = data.error;
            } else if (typeof data === "string") {
                errorMessage = data;
            }
        } catch {
            if (response.status === 404) {
                errorMessage = `Order #${cleanId} was not found or already deleted`;
            } else if (response.status === 403 || response.status === 401) {
                errorMessage = "You are not authorized to delete this order";
            } else if (response.statusText) {
                errorMessage = `${errorMessage}: ${response.statusText}`;
            }
        }
        throw new Error(errorMessage);
    }
};

export const getOrderById = async (id: string): Promise<Order> => {
    if (!id || !id.toString().trim()) {
        throw new Error("Order ID cannot be empty");
    }
    const cleanId = id.toString().trim().replace(/^#/, "");
    const response = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        let errorMessage = `Failed to fetch order #${cleanId}`;
        try {
            const data = await response.json();
            if (data?.message) {
                errorMessage = data.message;
            } else if (data?.error) {
                errorMessage = data.error;
            }
        } catch {
            if (response.status === 404) {
                errorMessage = `Order #${cleanId} not found`;
            } else if (response.statusText) {
                errorMessage = `${errorMessage}: ${response.statusText}`;
            }
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data ?? data;
};

export const updateOrder = async (id: string, order: Partial<Order>): Promise<Order> => {
    if (!id || !id.toString().trim()) {
        throw new Error("Order ID cannot be empty");
    }
    const cleanId = id.toString().trim().replace(/^#/, "");
    const response = await fetch(`/api/orders/update/${encodeURIComponent(cleanId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(order),
    });

    if (!response.ok) {
        let errorMessage = `Failed to update order #${cleanId}`;
        try {
            const data = await response.json();
            if (data?.message) {
                errorMessage = data.message;
            } else if (data?.error) {
                errorMessage = data.error;
            }
        } catch {
            if (response.statusText) {
                errorMessage = `${errorMessage}: ${response.statusText}`;
            }
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data ?? data;
};

