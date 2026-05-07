import { Button } from "@/components/ui/button";
import { Package, Plus, Search, Filter, Calendar } from "lucide-react";
import { useState } from "react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/ordersTable/DropDownMenu";


type SortKey = "id" | "customer" | "weight" | "status" | "date" | "result";

const OrdersTable = ({ showAddButton = true }: { showAddButton?: boolean }) => {
    const [search, setSearch] = useState("");
    const columns: { key: SortKey; label: string }[] = [
        { key: "id", label: "Order ID" },
        { key: "customer", label: "Customer" },
        { key: "weight", label: "Weight" },
        { key: "result", label: "Result" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" }
    ];
    return (
        <>
            <section className="bg-card rounded-2xl shadow-sm border border-border animate-fade-in overflow-hidden" aria-label="Orders management">
                {/* Header bar */}
                <HeaderBar showAddButton={showAddButton} />

                {/* Toolbar */}
                {newFunction(search, setSearch)}

                {/* Table */}
                <div className="overflow-x-auto" role="region" aria-label="Orders table" tabIndex={0}>
                    <table className="w-full text-left text-sm">
                        <TableHeader columns={columns} />
                        <tbody>
                            <TableRow />
                            <TableRow />
                            <TableRow />
                            <TableRow />
                            <TableRow />
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

export default OrdersTable;

const HeaderBar = ({ showAddButton = true }: { showAddButton?: boolean }) => {
    return <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-card to-muted/30 border-b border-border">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                <Package size={18} className="text-card" />
            </div>
            <div>
                <h3 className="text-base font-semibold text-foreground">Orders</h3>
                <p className="text-xs text-muted-foreground">{1} total · {1} pending · {1} delivered</p>
            </div>
        </div>
        <div className="flex items-center gap-2">

            {showAddButton && (
                <Button size="sm" onClick={() => { }} aria-label="Create new order">
                    <Plus size={14} className="mr-1.5" /> New Order
                </Button>
            )}
        </div>
    </div>;
}

const TableHeader = ({ columns }: { columns: { key: SortKey; label: string }[] }) => {
    return (
        <thead className="bg-muted/50">
            <tr className="border-b border-border bg-muted/30">
                {columns.map(({ key, label }) => (
                    <th key={key}
                        className="text-left px-5 py-3.5 font-semibold text-foreground cursor-pointer select-none hover:text-accent transition text-xs uppercase tracking-wider"
                        tabIndex={0} scope="col" aria-sort="none">
                        <span className="inline-flex items-center gap-1">
                            {label}
                        </span>
                    </th>
                ))}
            </tr>
        </thead>
    );
}
function newFunction(search: string, setSearch: (search: string) => void) {
    return <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-border" role="toolbar" aria-label="Orders toolbar">
        <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" placeholder="Search by ID or customer..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-foreground text-sm border-none outline-none focus-visible:ring-2 focus-visible:ring-ring transition" />
        </div>
        <fieldset className="flex items-center gap-1.5 border-none p-0 m-0">
            <legend className="sr-only">Filter by status</legend>
            <Filter size={14} className="text-muted-foreground mr-1" aria-hidden="true" />
            {(["All", "Pending", "Delivered", "Cancelled"] as const).map((s) => (
                <button key={s} onClick={() => { }} aria-pressed={false}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${false ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                    {s}
                </button>
            ))}
        </fieldset>
    </div>;
}

const TableRow = () => {
    const statusColors: Record<string, string> = {
        Pending: "bg-status-pending-bg text-status-pending",
        Delivered: "bg-status-delivered-bg text-status-delivered",
        Cancelled: "bg-destructive/10 text-destructive",
    };
    return (
        <>
            <tr /*key={order.id}*/ className="border-b border-border last:border-none hover:bg-muted/40 transition group" >
                {/* Order ID */}
                <td className="px-5 py-3.5">
                    <span className="font-mono font-semibold text-foreground">#12345</span>
                </td>

                {/* Customer */}
                <td className="px-5 py-3.5">
                    <div>
                        <p className="font-medium text-foreground">Aman Singh</p>
                        {true && <p className="text-xs text-muted-foreground">{7888100592}</p>}
                    </div>
                </td>
                {/* Weight */}
                <td className="px-5 py-3.5">
                    <p className="font-medium">{93.50}</p>

                </td>
                {/* Result */}
                <td className="px-5 py-3.5">
                    <p className="font-medium">{18.6}</p>
                </td>
                {/* Date */}
                <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} aria-hidden="true" /> {"2026-02-03"}
                    </span>
                </td>
                {/* Status */}
                <td className="px-5 py-3.5">
                    <button onClick={() => { }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition hover:opacity-80 ${statusColors["Pending"]}`}
                        aria-label={`Status: $Pending}. Click to toggle`}>{"Pending"}</button>
                </td>
            </tr>
        </>
    );
}