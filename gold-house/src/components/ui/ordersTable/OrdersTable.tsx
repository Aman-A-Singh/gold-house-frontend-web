import { Button } from "@/components/ui/button";
import { Package, Plus, Search, Filter, Calendar, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, Eye, Pencil, Printer, Copy, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRevalidator } from "react-router-dom";
import { Order } from "@/models/order";
import { deleteOrder } from "@/lib/Api/orderApi";
import { invalidateDashboardStatsCache } from "@/lib/Api/dashboardStatsAPI";
import AddOrdersDialog from "@/components/ui/dialogs/AddOrdersDialog";
import ViewDialog from "@/components/ui/dialogs/ViewDialog";
import DeleteOrderDialog from "@/components/ui/dialogs/DeleteOrderDialog";
import { Toaster } from "@/components/ui/toast/sonner";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/ordersTable/DropDownMenu";


type SortKey = "id" | "customer.name" | "weight" | "orderStatus" | "orderDate" | "result";
type SortDirection = "ASC" | "DESC";

interface OrdersTableProps {
    showAddButton?: boolean;
    orders: Order[];
    pagination?: {
        pageNumber: number;
        pageSize: number;
        totalElements: number;
        totalPages: number;
    };
    isLoading?: boolean;
    onOrderDeleted?: (orderId: string) => void;
}

const TableLoadingView = () => {
    return (
        <tr>
            <td colSpan={7} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading orders...</span>
                </div>
            </td>
        </tr>
    );
};

const OrdersTable = ({ showAddButton = true, orders = [], pagination, isLoading = false, onOrderDeleted }: OrdersTableProps) => {
    const [searchParams, setSearchParams] = useSearchParams({ status: "All", q: "", sortKey: "orderDate", sortDir: "DESC", page: "0", size: "10" });
    const statusFilter = searchParams.get("status") || "All";
    const search = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "0", 10);
    const size = parseInt(searchParams.get("size") || "10", 10);

    const [localOrders, setLocalOrders] = useState<Order[]>(orders);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
    const [localSearch, setLocalSearch] = useState(search);
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
    const [isDebouncing, setIsDebouncing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const revalidator = useRevalidator();

    const sortKey = searchParams.get("sortKey") as SortKey | null;
    const sortDir = searchParams.get("sortDir") as SortDirection | null;

    useEffect(() => {
        setLocalOrders(orders);
    }, [orders]);

    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    const columns: { key: SortKey; label: string }[] = [
        { key: "id", label: "Order ID" },
        { key: "customer.name", label: "Customer" },
        { key: "weight", label: "Weight" },
        { key: "result", label: "Result" },
        { key: "orderDate", label: "Date" },
        { key: "orderStatus", label: "Status" }
    ];

    // Atomically commit searchParams while cancelling any pending debounced search timer
    const commitTableParams = (updates: { q?: string; status?: string; sortKey?: SortKey; sortDir?: SortDirection; page?: number; size?: number }) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setSearchParams(prev => {
            const currentSortKey = prev.get("sortKey");
            const currentSortDir = prev.get("sortDir");
            const currentPage = prev.get("page") || "0";
            const currentSize = prev.get("size") || "10";

            const nextQ = updates.q !== undefined ? updates.q : localSearch;
            if (nextQ) {
                prev.set("q", nextQ);
            } else {
                prev.delete("q");
            }

            const nextStatus = updates.status !== undefined ? updates.status : (prev.get("status") || "All");
            if (nextStatus) {
                prev.set("status", nextStatus);
            }

            const nextSortKey = updates.sortKey !== undefined ? updates.sortKey : currentSortKey;
            const nextSortDir = updates.sortDir !== undefined ? updates.sortDir : currentSortDir;

            if (nextSortKey) prev.set("sortKey", nextSortKey);
            if (nextSortDir) prev.set("sortDir", nextSortDir);

            // Determine page and size (reset page to 0 if q, status, sortKey or size changed unless explicit page specified)
            const isFilterOrSortChange = updates.q !== undefined || updates.status !== undefined || updates.sortKey !== undefined || updates.size !== undefined;
            const nextPage = updates.page !== undefined ? updates.page : (isFilterOrSortChange ? 0 : parseInt(currentPage, 10));
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

    const handleStatusChange = (newStatus: string) => {
        commitTableParams({ status: newStatus, q: localSearch });
    };

    const handleSort = (newSortKey: SortKey) => {
        let newSortDir: SortDirection = "ASC";
        if (sortKey === newSortKey && sortDir === "ASC") {
            newSortDir = "DESC";
        }
        commitTableParams({ sortKey: newSortKey, sortDir: newSortDir, q: localSearch });
    };

    const handlePageChange = (newPage: number) => {
        commitTableParams({ page: newPage });
    };

    const handleSizeChange = (newSize: number) => {
        commitTableParams({ size: newSize, page: 0 });
    };

    const handleDeleteOrder = async (orderId: string) => {
        const idStr = String(orderId).trim();
        if (!idStr || deletingIds.has(idStr)) return;

        // 1. Immediately indicate row-level loading on only this specific order
        setDeletingIds(prev => new Set(prev).add(idStr));

        try {
            // 5-second delay to allow observing the row-level loading state
            await new Promise(resolve => setTimeout(resolve, 5000));

            await deleteOrder(idStr);

            // 2. Invalidate dashboard stats cache so metrics update accurately
            invalidateDashboardStatsCache();

            // 3. Notify parent callback if provided
            onOrderDeleted?.(idStr);

            // 4. Toast success feedback
            toast.success(`Order #${idStr} deleted successfully`);

            // 5. Trigger smooth exiting transition
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(idStr);
                return next;
            });
            setExitingIds(prev => new Set(prev).add(idStr));

            // 6. After animation finishes, remove from local list & handle pagination
            setTimeout(() => {
                setExitingIds(prev => {
                    const next = new Set(prev);
                    next.delete(idStr);
                    return next;
                });

                const remaining = localOrders.filter(o => String(o.orderId) !== idStr);
                setLocalOrders(remaining);

                // If this was the last remaining order on a page > 0, go back one page
                if (remaining.length === 0 && page > 0) {
                    commitTableParams({ page: page - 1 });
                } else {
                    // Revalidate in background to fetch updated page and server pagination counts
                    revalidator.revalidate();
                }
            }, 300);
        } catch (error: any) {
            console.error("Failed to delete order:", error);
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(idStr);
                return next;
            });
            toast.error(error.message || "Failed to delete order. Please try again.");
        }
    };

    const handleNewOrder = () => {
        setEditingOrder(null);
        setIsOrderDialogOpen(true);
    };

    const handleEditOrder = (order: Order) => {
        setEditingOrder(order);
        setIsOrderDialogOpen(true);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Reset debouncing state smoothly when new orders arrive or loading finishes to prevent flicker
    useEffect(() => {
        if (!isLoading) {
            setIsDebouncing(false);
        }
    }, [orders, isLoading]);

    const filteredOrders = localOrders;
    const showTableLoading = isLoading || isDebouncing;

    // Derived pagination details
    const activePage = page;
    const activeSize = size;
    const deletedCount = Math.max(0, orders.length - localOrders.length);
    const baseTotal = pagination ? pagination.totalElements : localOrders.length;
    const totalElements = Math.max(0, baseTotal - deletedCount);
    const totalPages = pagination ? Math.max(1, Math.ceil(totalElements / activeSize)) : Math.max(1, Math.ceil(localOrders.length / activeSize));

    return (
        <>
            <section className="bg-card rounded-2xl shadow-sm border border-border animate-fade-in overflow-hidden" aria-label="Orders management">
                {/* Header bar */}
                <HeaderBar showAddButton={showAddButton} orders={localOrders} onAddClick={handleNewOrder} />

                {/* Toolbar */}
                <Toolbar
                    localSearch={localSearch}
                    onSearchInput={handleSearchInput}
                    statusFilter={statusFilter}
                    onStatusChange={handleStatusChange}
                />

                {/* Table */}
                <div className="overflow-x-auto relative" role="region" aria-label="Orders table" tabIndex={0}>
                    <table className="w-full text-center text-sm" aria-live="polite">
                        <TableHeader columns={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <tbody>
                            {showTableLoading ? (
                                <TableLoadingView />
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No orders found</td></tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <TableRow
                                        key={order.orderId}
                                        order={order}
                                        onViewDetails={setViewingOrder}
                                        onEdit={handleEditOrder}
                                        onDelete={setDeletingOrder}
                                        isDeleting={deletingIds.has(String(order.orderId))}
                                        isExiting={exitingIds.has(String(order.orderId))}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination */}
                <TablePagination
                    page={activePage}
                    size={activeSize}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    onPageChange={handlePageChange}
                    onSizeChange={handleSizeChange}
                />
            </section>
            <AddOrdersDialog
                open={isOrderDialogOpen}
                onOpenChange={(open) => {
                    setIsOrderDialogOpen(open);
                    if (!open) {
                        setEditingOrder(null);
                    }
                }}
                orderToEdit={editingOrder}
                onOrderSaved={(saved) => {
                    revalidator.revalidate();
                    invalidateDashboardStatsCache();
                    if (saved && saved.orderId) {
                        const cleanSavedId = String(saved.orderId).replace(/^#/, "");
                        setLocalOrders((prev) =>
                            prev.map((o) => {
                                const cleanOId = String(o.orderId).replace(/^#/, "");
                                return cleanOId === cleanSavedId ? { ...o, ...saved } : o;
                            })
                        );
                    }
                }}
            />
            <ViewDialog order={viewingOrder} open={Boolean(viewingOrder)} onOpenChange={(open) => !open && setViewingOrder(null)} />
            <DeleteOrderDialog
                order={deletingOrder}
                open={Boolean(deletingOrder)}
                onOpenChange={(open) => !open && setDeletingOrder(null)}
                onConfirm={handleDeleteOrder}
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
                <span className="font-medium text-foreground">{totalElements}</span> orders
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

export default OrdersTable;

const HeaderBar = ({ showAddButton = true, orders = [], onAddClick }: { showAddButton?: boolean, orders?: Order[], onAddClick?: () => void }) => {
    const total = orders.length;
    const pending = orders.filter(order => order.orderStatus === "PENDING").length;
    const delivered = orders.filter(order => order.orderStatus === "DELIVERED").length;
    return <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-card to-muted/30 border-b border-border">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                <Package size={18} className="text-card" />
            </div>
            <div>
                <h3 className="text-base font-semibold text-foreground">Orders</h3>
                <p className="text-xs text-muted-foreground">{total} total · {pending} pending · {delivered} delivered</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {showAddButton && (
                <Button size="sm" onClick={onAddClick} aria-label="Create new order">
                    <Plus size={14} className="mr-1.5" /> New Order
                </Button>
            )}
        </div>
    </div>;
};

const TableHeader = ({ columns, sortKey, sortDir, onSort }: {
    columns: { key: SortKey; label: string }[];
    sortKey: SortKey | null;
    sortDir: SortDirection | null;
    onSort: (key: SortKey) => void;
}) => {
    const getAriaSort = (key: SortKey) => {
        if (sortKey !== key) return "none";
        return sortDir === "ASC" ? "ascending" : "descending";
    };

    return (
        <thead className="bg-muted/50">
            <tr className="border-b border-border bg-muted/30">
                {columns.map(({ key, label }) => (
                    <th key={key} onClick={() => onSort(key)}
                        className="text-center px-5 py-3.5 align-middle font-semibold text-foreground cursor-pointer select-none hover:bg-accent/50 transition text-xs uppercase tracking-wider"
                        tabIndex={0} scope="col" aria-sort={getAriaSort(key)}>
                        <span className="inline-flex items-center justify-center gap-1">
                            <ArrowUpDown size={12} className="opacity-0 pointer-events-none shrink-0" aria-hidden="true" />
                            <span>{label}</span>
                            {sortKey === key ? (sortDir === 'ASC' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />) : <ArrowUpDown size={12} className="text-muted-foreground/50 shrink-0" />}
                        </span>
                    </th>
                ))}
                <th className="text-center px-5 py-3.5 align-middle font-semibold text-foreground text-xs uppercase tracking-wider select-none" scope="col">
                    ACTIONS
                </th>
            </tr>
        </thead>
    );
};

const Toolbar = ({
    localSearch,
    onSearchInput,
    statusFilter,
    onStatusChange
}: {
    localSearch: string;
    onSearchInput: (val: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
}) => {
    return <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-border" role="toolbar" aria-label="Orders toolbar">
        <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
                type="search"
                placeholder="Search by ID (#id) or customer..."
                value={localSearch}
                onChange={(e) => onSearchInput(e.target.value)}
                aria-label="Search orders"
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-foreground text-sm border-none outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
            />
        </div>
        <fieldset className="flex items-center gap-1.5 border-none p-0 m-0">
            <legend className="sr-only">Filter by status</legend>
            <Filter size={14} className="text-muted-foreground mr-1" aria-hidden="true" />
            {(["All", "Pending", "Delivered", "Cancelled"] as const).map((s) => (
                <button key={s} onClick={() => onStatusChange(s)} aria-pressed={statusFilter === s}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                    {s}
                </button>
            ))}
        </fieldset>
    </div>;
};

const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
};

const TableRow = ({
    order,
    onViewDetails,
    onEdit,
    onDelete,
    isDeleting,
    isExiting,
}: {
    order: Order;
    onViewDetails: (order: Order) => void;
    onEdit: (order: Order) => void;
    onDelete: (order: Order) => void;
    isDeleting: boolean;
    isExiting: boolean;
}) => {
    const statusColors: Record<string, string> = {
        PENDING: "bg-status-pending-bg text-status-pending",
        DELIVERED: "bg-status-delivered-bg text-status-delivered",
        CANCELLED: "bg-destructive/20 text-destructive",
    };

    return (
        <tr
            className={`border-b border-border last:border-none transition-all duration-300 align-middle ${isExiting
                ? "opacity-0 -translate-x-3 scale-[0.98] bg-destructive/10 pointer-events-none"
                : isDeleting
                    ? "bg-destructive/5 opacity-70 pointer-events-none"
                    : "hover:bg-muted/40"
                }`}
        >
            {/* Order ID */}
            <td className="text-center px-5 py-3.5 align-middle">
                <span className="font-mono font-semibold text-foreground">#{order.orderId}</span>
            </td>

            {/* Customer */}
            <td className="text-center px-5 py-3.5 align-middle">
                <div>
                    <p className="font-medium text-foreground">{order.customer.name}</p>
                    {order.customer.phoneNumber && <p className="text-xs text-muted-foreground">{order.customer.phoneNumber}</p>}
                </div>
            </td>
            {/* Weight */}
            <td className="text-center px-5 py-3.5 align-middle">
                <p className="font-medium">{order.weight}</p>
            </td>
            {/* Result */}
            <td className="text-center px-5 py-3.5 align-middle">
                <p className="font-medium">{order.result}</p>
            </td>
            {/* Date */}
            <td className="text-center px-5 py-3.5 align-middle">
                <span className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={12} aria-hidden="true" /> {formatDisplayDate(order.orderDate)}
                </span>
            </td>
            {/* Status */}
            <td className="text-center px-5 py-3.5 align-middle">
                <button onClick={() => { }}
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold transition hover:opacity-80 ${statusColors[order.orderStatus] || "bg-muted text-muted-foreground"}`}
                    aria-label={`Status: ${order.orderStatus}. Click to toggle`}>{order.orderStatus}</button>
            </td>
            {/* Actions */}
            <td className="text-center px-5 py-3.5 align-middle">
                {isDeleting ? (
                    <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-medium animate-pulse">
                        <Loader2 size={13} className="animate-spin shrink-0 text-destructive" />
                        <span className="text-[11px] font-medium">Deleting...</span>
                    </div>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition inline-flex items-center justify-center cursor-pointer data-[state=open]:bg-accent/50"
                                aria-label={`Actions for order #${order.orderId}`}
                            >
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl border border-border shadow-lg bg-popover text-popover-foreground">
                            <DropdownMenuItem
                                onClick={() => onViewDetails(order)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-accent focus:bg-accent"
                            >
                                <Eye size={16} className="text-foreground" />
                                <span className="font-normal text-foreground">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onEdit(order)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-accent focus:bg-accent"
                            >
                                <Pencil size={16} className="text-foreground" />
                                <span className="font-normal text-foreground">Edit Order</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { }}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-accent focus:bg-accent"
                            >
                                <Printer size={16} className="text-foreground" />
                                <span className="font-normal text-foreground">Print Slip</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    navigator.clipboard.writeText(order.orderId.toString());
                                    toast.success(`Order #${order.orderId} copied to clipboard`);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-accent focus:bg-accent"
                            >
                                <Copy size={16} className="text-foreground" />
                                <span className="font-normal text-foreground">Copy ID</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 -mx-1 bg-border" />
                            <DropdownMenuItem
                                onClick={() => onDelete(order)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                                <Trash2 size={16} className="text-destructive" />
                                <span className="font-normal text-destructive">Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </td>
        </tr>
    );
};