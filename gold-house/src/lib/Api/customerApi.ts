import { Customer } from "@/models/customer";

export type { Customer };
export type CustomerSuggestion = Customer;

/**
 * Searches for customers by name.
 * @param query The name to search for.
 * @returns A promise that resolves to an array of customer suggestions.
 */
export const searchCustomers = async (query: string): Promise<CustomerSuggestion[]> => {
    const response = await fetch(`/api/customers/search?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error('Failed to fetch customer suggestions');
    }

    const res = await response.json();
    const cust = res.data || [];
    return Array.isArray(cust) ? cust : [cust];
};

export interface PagedCustomerResult {
    content: Customer[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

/**
 * Fetches registered customers with pagination and optional search query.
 * @returns A promise that resolves to a paginated customer result.
 */
export const getCustomers = async (
    { page = 0, size = 10, searchQuery }: {
        page?: number;
        size?: number;
        searchQuery?: string | null;
    } = {}
): Promise<PagedCustomerResult> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (searchQuery) {
        params.set("query", searchQuery.trim());
    }

    const response = await fetch(`/api/customers?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
    }

    const res = await response.json();
    const raw = res.data || res;

    // Handle paginated response: { data: { content: [...], currentPage/pageNumber, pageSize, totalItems/totalElements, totalPages, last } }
    if (raw && Array.isArray(raw.content)) {
        return {
            content: raw.content,
            pageNumber: raw.currentPage ?? raw.pageNumber ?? page,
            pageSize: raw.pageSize ?? size,
            totalElements: raw.totalItems ?? raw.totalElements ?? raw.content.length,
            totalPages: raw.totalPages ?? Math.ceil((raw.totalItems ?? raw.content.length) / (raw.pageSize ?? size)),
            last: raw.last ?? true,
        };
    }

    // Handle bare array or { data: [...] } if backend returns unpaginated array
    const list = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : Array.isArray(res.content) ? res.content : [];
    const total = list.length;
    const start = page * size;
    const pagedContent = list.slice(start, start + size);
    return {
        content: pagedContent,
        pageNumber: page,
        pageSize: size,
        totalElements: total,
        totalPages: Math.max(1, Math.ceil(total / size)),
        last: (page + 1) * size >= total,
    };
};

/**
 * Adds a new customer.
 * @param customer Object with name and phoneNumber.
 * @returns A promise that resolves to the created customer.
 */
export const addCustomer = async (customer: { name: string; phoneNumber: number }): Promise<Customer> => {
    const response = await fetch('/api/customers', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(customer),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.message || `Failed to add customer: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
    }

    const res = await response.json();
    return res.data ?? res;
};