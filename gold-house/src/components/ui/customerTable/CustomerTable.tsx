import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Search,
    MoreHorizontal,
    Eye,
    Phone,
    Users,
    Copy,
    Check,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { Customer } from "@/lib/Api/customerApi";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/ordersTable/DropDownMenu";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toast/sonner";
import { toast } from "sonner";
import ViewCustomerDialog from "@/components/ui/dialogs/ViewCustomerDialog";

export interface CustomerTableProps {
    customers: Customer[];
    pagination?: {
        pageNumber: number;
        pageSize: number;
        totalElements: number;
        totalPages: number;
    };
    isLoading?: boolean;
}

const getInitials = (name: string): string => {
    if (!name) return "CU";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatPhone = (phone: number | string): string => {
    if (!phone) return "—";
    const str = String(phone);
    if (str.startsWith("91") && str.length === 12) {
        return `+91 ${str.slice(2, 5)} ${str.slice(5, 8)} ${str.slice(8)}`;
    }
    if (str.length === 10) {
        return `+91 ${str.slice(0, 3)} ${str.slice(3, 6)} ${str.slice(6)}`;
    }
    return str.startsWith("+") ? str : `+${str}`;
};

const TableLoadingView = () => (
    <tr>
        <td colSpan={4} className="py-16 text-center">
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Loading customers...</span>
            </div>
        </td>
    </tr>
);

export const CustomerTable = ({
    customers = [],
    pagination,
    isLoading = false,
}: CustomerTableProps) => {
    const [searchParams, setSearchParams] = useSearchParams({ q: "", page: "0", size: "10" });
    const search = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "0", 10);
    const size = parseInt(searchParams.get("size") || "10", 10);

    const [localSearch, setLocalSearch] = useState(search);
    const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [isDebouncing, setIsDebouncing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    // Commit searchParams to URL while cancelling any pending debounce timer
    const commitTableParams = (updates: { q?: string; page?: number; size?: number }) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setSearchParams((prev) => {
            const currentPage = prev.get("page") || "0";
            const currentSize = prev.get("size") || "10";

            const nextQ = updates.q !== undefined ? updates.q : localSearch;
            if (nextQ) {
                prev.set("q", nextQ);
            } else {
                prev.delete("q");
            }

            // Reset page to 0 if search query or page size changed unless explicit page specified
            const isFilterOrSizeChange = updates.q !== undefined || updates.size !== undefined;
            const nextPage = updates.page !== undefined ? updates.page : (isFilterOrSizeChange ? 0 : parseInt(currentPage, 10));
            const nextSize = updates.size !== undefined ? updates.size : parseInt(currentSize, 10);

            prev.set("page", nextPage.toString());
            prev.set("size", nextSize.toString());

            return prev;
        }, { replace: true });
    };

    const handleSearchInput = (val: string) => {
        setLocalSearch(val);
        setIsDebouncing(true);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            commitTableParams({ q: val });
        }, 1500);
    };

    const handlePageChange = (newPage: number) => {
        commitTableParams({ page: newPage });
    };

    const handleSizeChange = (newSize: number) => {
        commitTableParams({ size: newSize, page: 0 });
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Reset debouncing state smoothly when new customers arrive or loading finishes
    useEffect(() => {
        if (!isLoading) {
            setIsDebouncing(false);
        }
    }, [customers, isLoading]);

    // Derived pagination details
    const activePage = page;
    const activeSize = size;
    const totalElements = pagination ? pagination.totalElements : customers.length;
    const totalPages = pagination ? pagination.totalPages : Math.max(1, Math.ceil(customers.length / activeSize));

    // If backend pagination is provided, customers already contains the current page slice.
    // If no pagination prop is provided (fallback), perform client-side filtering & slicing.
    const displayedCustomers = useMemo(() => {
        if (pagination) {
            return customers;
        }
        if (!localSearch.trim()) {
            return customers.slice(activePage * activeSize, (activePage + 1) * activeSize);
        }
        const q = localSearch.toLowerCase().trim();
        const filtered = customers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                String(c.phoneNumber).includes(q) ||
                String(c.id).includes(q)
        );
        return filtered.slice(activePage * activeSize, (activePage + 1) * activeSize);
    }, [customers, pagination, localSearch, activePage, activeSize]);

    const showTableLoading = isLoading || isDebouncing;

    const handleCopyPhone = (phoneNumber: number) => {
        const text = String(phoneNumber);
        navigator.clipboard.writeText(text);
        toast.success(`Copied phone: ${text}`);
    };

    const handleCopyId = (id: number) => {
        navigator.clipboard.writeText(String(id));
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success(`Copied Customer ID: #${id}`);
    };

    return (
        <>
            <section className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-fade-in" aria-label="Customers management">
                {/* Search & Header Bar */}
                <div className="flex items-center justify-between gap-3 p-5 border-b border-border bg-card">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-xs">
                            <Users size={18} />
                        </div>
                        <div className="relative w-full sm:w-80">
                            <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                placeholder="Search customers..."
                                value={localSearch}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                aria-label="Search customers"
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/60 text-foreground text-sm border-none outline-none focus-visible:ring-2 focus-visible:ring-ring transition placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative" role="region" aria-label="Customers table" tabIndex={0}>
                    <table className="w-full text-sm" aria-label="Customers list" aria-live="polite">
                        <thead>
                            <tr className="border-b border-border bg-muted/25">
                                <th
                                    scope="col"
                                    className="text-left px-6 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
                                >
                                    NAME
                                </th>
                                <th
                                    scope="col"
                                    className="text-left px-6 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
                                >
                                    CONTACT
                                </th>
                                <th
                                    scope="col"
                                    className="text-left px-6 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
                                >
                                    ORDER COUNT
                                </th>
                                <th
                                    scope="col"
                                    className="text-left px-6 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
                                >
                                    ACTIONS
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {showTableLoading ? (
                                <TableLoadingView />
                            ) : displayedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-muted-foreground">
                                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-semibold text-base text-foreground">
                                            No customers found
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {localSearch
                                                ? "Try searching with a different name or phone number"
                                                : "No registered customers found"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                displayedCustomers.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-b border-border last:border-none hover:bg-muted/30 transition-colors group"
                                    >
                                        {/* Name & Initials Avatar */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                                                    {getInitials(c.name)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm leading-tight">
                                                        {c.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                                        ID #{c.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact (Phone) */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-foreground">
                                                <div className="w-7 h-7 rounded-lg bg-muted/70 flex items-center justify-center text-muted-foreground shrink-0">
                                                    <Phone size={13} aria-hidden="true" />
                                                </div>
                                                <span className="font-medium text-sm">
                                                    {formatPhone(c.phoneNumber)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* ORDER COUNT */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-foreground">
                                                <div className="w-7 h-7 rounded-lg bg-muted/70 flex items-center justify-center text-muted-foreground shrink-0">
                                                    <ShoppingCart size={13} aria-hidden="true" />
                                                </div>
                                                <span className="font-medium text-sm">
                                                    {c.totalOrders ?? 0}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-left">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                                                        aria-label={`Actions for ${c.name}`}
                                                    >
                                                        <MoreHorizontal size={17} aria-hidden="true" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem
                                                        onClick={() => setViewingCustomer(c)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye size={14} className="mr-2" aria-hidden="true" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleCopyPhone(c.phoneNumber)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Phone size={14} className="mr-2" aria-hidden="true" />
                                                        Copy Phone
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleCopyId(c.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        {copiedId === c.id ? (
                                                            <Check size={14} className="mr-2 text-status-delivered" aria-hidden="true" />
                                                        ) : (
                                                            <Copy size={14} className="mr-2" aria-hidden="true" />
                                                        )}
                                                        Copy Customer ID
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination matching Orders Table */}
                <TablePagination
                    page={activePage}
                    size={activeSize}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    onPageChange={handlePageChange}
                    onSizeChange={handleSizeChange}
                />
            </section>

            {/* Dialogs */}
            <ViewCustomerDialog
                customer={viewingCustomer}
                open={Boolean(viewingCustomer)}
                onOpenChange={(open) => !open && setViewingCustomer(null)}
            />
            <Toaster />
        </>
    );
};

const TablePagination = ({
    page,
    size,
    totalPages,
    totalElements,
    onPageChange,
    onSizeChange,
}: {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    onPageChange: (newPage: number) => void;
    onSizeChange: (newSize: number) => void;
}) => {
    const startItem = totalElements > 0 ? page * size + 1 : 0;
    const endItem = Math.min((page + 1) * size, totalElements);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-card/50 text-sm text-muted-foreground">
            <div>
                Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
                <span className="font-medium text-foreground">{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{totalElements}</span> customers
            </div>

            <div className="flex items-center gap-6">
                {/* Rows Per Page Dropdown Menu */}
                <div className="flex items-center gap-2">
                    <span className="text-xs">Rows per page:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium cursor-pointer">
                                {size}
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-24">
                            <DropdownMenuRadioGroup value={size.toString()} onValueChange={(val) => onSizeChange(parseInt(val, 10))}>
                                {[5, 10, 20, 50].map((pageSize) => (
                                    <DropdownMenuRadioItem key={pageSize} value={pageSize.toString()} className="text-xs cursor-pointer">
                                        {pageSize} rows
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        {/* Previous Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 0}
                            className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> Previous
                        </Button>

                        {/* Page Numbers with Ellipsis */}
                        {Array.from({ length: totalPages }, (_, i) => i)
                            .filter((p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1)
                            .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, idx) =>
                                p === "ellipsis" ? (
                                    <span key={`e-${idx}`} className="px-1.5 text-xs text-muted-foreground select-none">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={page === p ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onPageChange(p as number)}
                                        className="h-8 w-8 p-0 text-xs cursor-pointer"
                                        aria-label={`Page ${(p as number) + 1}`}
                                        aria-current={page === p ? "page" : undefined}
                                    >
                                        {(p as number) + 1}
                                    </Button>
                                )
                            )}

                        {/* Next Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                            aria-label="Next page"
                        >
                            Next <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerTable;
