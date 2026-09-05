import { Button } from "@/components/ui/button";
import { Package, Plus, Search, Filter, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Order } from "@/models/order";
import AddOrdersDialog from "@/components/ui/dialogs/AddOrdersDialog";
import { Toaster } from "@/components/ui/toast/sonner";


type SortKey = "id" | "customer.name" | "weight" | "orderStatus" | "orderDate" | "result";
type SortDirection = "ASC" | "DESC";

interface OrdersTableProps {
    showAddButton?: boolean;
    orders: Order[];
    isLoading?: boolean;
}

const TableLoadingView = () => {
    return (
        <tr>
            <td colSpan={6} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading orders...</span>
                </div>
            </td>
        </tr>
    );
};

const OrdersTable = ({ showAddButton = true, orders = [], isLoading = false }: OrdersTableProps) => {
     const [searchParams, setSearchParams] = useSearchParams({ status: "All", q: "", sortKey: "orderDate", sortDir: "DESC" });
     const statusFilter = searchParams.get("status") || "All";
     const search = searchParams.get("q") || "";
     const [localSearch, setLocalSearch] = useState(search);
     const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
     const [isDebouncing, setIsDebouncing] = useState(false);
     const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

     const sortKey = searchParams.get("sortKey") as SortKey | null;
     const sortDir = searchParams.get("sortDir") as SortDirection | null;

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
    const commitTableParams = (updates: { q?: string; status?: string; sortKey?: SortKey; sortDir?: SortDirection }) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setSearchParams(prev => {
            const currentSortKey = prev.get("sortKey");
            const currentSortDir = prev.get("sortDir");

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

    // Backend handles all filtering & sorting for both Orders page and Dashboard
    const filteredOrders = orders;
    const showTableLoading = isLoading || isDebouncing;

    return (
        <>
            <section className="bg-card rounded-2xl shadow-sm border border-border animate-fade-in overflow-hidden" aria-label="Orders management">
                {/* Header bar */}
                <HeaderBar showAddButton={showAddButton} orders={orders} onAddClick={() => setIsAddDialogOpen(true)} />

                {/* Toolbar */}
                <Toolbar
                    localSearch={localSearch}
                    onSearchInput={handleSearchInput}
                    statusFilter={statusFilter}
                    onStatusChange={handleStatusChange}
                />

                {/* Table */}
                <div className="overflow-x-auto relative" role="region" aria-label="Orders table" tabIndex={0}>
                    <table className="w-full text-left text-sm" aria-live="polite">
                        <TableHeader columns={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <tbody>
                            {showTableLoading ? (
                                <TableLoadingView />
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No orders found</td></tr>
                            ) : (
                                filteredOrders.map(order => <TableRow key={order.orderId} order={order} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
            <AddOrdersDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
            <Toaster />
        </>
    );
}

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
}

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
                        className="text-left px-5 py-3.5 font-semibold text-foreground cursor-pointer select-none hover:bg-accent/50 transition text-xs uppercase tracking-wider"
                        tabIndex={0} scope="col" aria-sort={getAriaSort(key)}>
                        <span className="inline-flex items-center gap-1">
                            {label}
                            {sortKey === key ? (sortDir === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="text-muted-foreground/50" />}
                        </span>
                    </th>
                ))}
            </tr>
        </thead>
    );
}

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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                    {s}
                </button>
            ))}
        </fieldset>
    </div>;
}
 const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    };

const TableRow = ({ order }: { order: Order }) => {
    const statusColors: Record<string, string> = {
        PENDING: "bg-status-pending-bg text-status-pending",
        DELIVERED: "bg-status-delivered-bg text-status-delivered",
        CANCELLED: "bg-destructive/20 text-destructive",
    };

   
    return (
        <>
            <tr className="border-b border-border last:border-none hover:bg-muted/40 transition group" >
                {/* Order ID */}
                <td className="px-5 py-3.5">
                    <span className="font-mono font-semibold text-foreground">#{order.orderId}</span>
                </td>

                {/* Customer */}
                <td className="px-5 py-3.5">
                    <div>
                        <p className="font-medium text-foreground">{order.customer.name}</p>
                        {order.customer.phoneNumber && <p className="text-xs text-muted-foreground">{order.customer.phoneNumber}</p>}
                    </div>
                </td>
                {/* Weight */}
                <td className="px-5 py-3.5">
                    <p className="font-medium">{order.weight}</p>

                </td>
                {/* Result */}
                <td className="px-5 py-3.5">
                    <p className="font-medium">{order.result}</p>
                </td>
                {/* Date */}
                <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} aria-hidden="true" /> {formatDisplayDate(order.orderDate)}
                    </span>
                </td>
                {/* Status */}
                <td className="px-5 py-3.5">
                    <button onClick={() => { }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition hover:opacity-80 ${statusColors[order.orderStatus] || "bg-muted text-muted-foreground"}`}
                        aria-label={`Status: ${order.orderStatus}. Click to toggle`}>{order.orderStatus}</button>
                </td>
            </tr>
        </>
    );
}