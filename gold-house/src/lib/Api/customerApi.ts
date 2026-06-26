export interface CustomerSuggestion {
    id: number;
    name: string;
    phoneNumber: number;
}

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