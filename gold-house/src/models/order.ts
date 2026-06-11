export interface Order {
    orderId: string;
    customer: {
        id: number;
        name: string;
        phoneNumber: number;
    };
    weight: number;
    result: number;
    orderDate: string;
    orderTime: string;
    deliverDate: string | null;
    deliverTime: string | null;
    orderStatus: "Pending" | "Delivered" | "Cancelled";
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