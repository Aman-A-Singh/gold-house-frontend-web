export interface Order {
    orderId: string;
    customer: {
        id: number | null;
        name: string;
        phoneNumber: number;
    };
    weight: number;
    result: number;
    orderDate: string;
    orderTime: string;
    deliverDate: string | null;
    deliverTime: string | null;
    orderStatus: "PENDING" | "DELIVERED" | "CANCELLED";
    stampNo: number;
    wastage: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    timestamp: string;
    data: {
        content: T[];
        currentPage: number;
        totalItems: number;
        totalPages: number;
        last: boolean;
    };
}