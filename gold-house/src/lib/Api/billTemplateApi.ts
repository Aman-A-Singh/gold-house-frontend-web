import { BillTemplate, BillTemplateRequestDTO } from "@/components/ui/bill/billTemplate";

export type { BillTemplate, BillTemplateRequestDTO };

const BASE_URL = "/api/bill-templates";

const parseErrorMessage = async (response: Response, defaultMessage: string): Promise<string> => {
    try {
        const data = await response.json();
        if (data?.message) return data.message;
        if (data?.error) return data.error;
        if (typeof data === "string") return data;
    } catch {
        // Response wasn't JSON
    }
    return response.statusText ? `${defaultMessage}: ${response.statusText}` : defaultMessage;
};

/**
 * Fetches all bill templates from the server.
 */
export const getAllTemplates = async (): Promise<BillTemplate[]> => {
    const response = await fetch(BASE_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Failed to fetch bill templates"));
    }

    const json = await response.json();
    return json?.data ?? [];
};

/**
 * Fetches a single bill template by ID.
 */
export const getTemplateById = async (id: string): Promise<BillTemplate> => {
    if (!id || !id.trim()) throw new Error("Template ID cannot be empty");

    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id.trim())}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, `Failed to fetch template #${id}`));
    }

    const json = await response.json();
    return json?.data;
};

/**
 * Fetches the currently active default bill template for quick printing.
 */
export const getDefaultTemplate = async (): Promise<BillTemplate> => {
    const response = await fetch(`${BASE_URL}/default`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Failed to fetch default template"));
    }

    const json = await response.json();
    return json?.data;
};

/**
 * Creates a new bill template on the server.
 */
export const createTemplate = async (dto: BillTemplateRequestDTO): Promise<BillTemplate> => {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Failed to create bill template"));
    }

    const json = await response.json();
    return json?.data;
};

/**
 * Updates an existing bill template.
 */
export const updateTemplate = async (id: string, dto: BillTemplateRequestDTO): Promise<BillTemplate> => {
    if (!id || !id.trim()) throw new Error("Template ID cannot be empty");

    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id.trim())}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, `Failed to update template #${id}`));
    }

    const json = await response.json();
    return json?.data;
};

/**
 * Sets a specific template as the active default for printing.
 */
export const setDefaultTemplate = async (id: string): Promise<BillTemplate> => {
    if (!id || !id.trim()) throw new Error("Template ID cannot be empty");

    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id.trim())}/default`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, `Failed to set template #${id} as default`));
    }

    const json = await response.json();
    return json?.data;
};

/**
 * Deletes a template by ID.
 */
export const deleteTemplate = async (id: string): Promise<void> => {
    if (!id || !id.trim()) throw new Error("Template ID cannot be empty");

    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id.trim())}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, `Failed to delete template #${id}`));
    }
};
