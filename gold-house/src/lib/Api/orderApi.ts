import { Order } from  "@/models/order";

export const getAllOrders = async (page: number = 0, size: number = 9999): Promise<Order[]> => {
    const response = await fetch(`/api/orders/all?page=${page}&size=${size}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data.content;
};