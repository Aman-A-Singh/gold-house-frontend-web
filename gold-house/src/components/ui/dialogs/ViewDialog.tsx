import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialogs/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/models/order";
import { User, Phone, Scale, Calendar, CheckCircle2, Award, CreditCard, Printer } from "lucide-react";

interface ViewDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatDisplayDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
};

const statusColors: Record<string, string> = {
    PENDING: "bg-status-pending-bg text-status-pending border border-status-pending/20",
    DELIVERED: "bg-status-delivered-bg text-status-delivered border border-status-delivered/20",
    CANCELLED: "bg-destructive/10 text-destructive border border-destructive/20",
};

export const ViewDialog = ({ order, open, onOpenChange }: ViewDialogProps) => {
    if (!order) return null;

    const details: { label: string; value: string | number; icon?: React.ReactNode }[] = [
        { label: "Customer Name", value: order.customer.name, icon: <User size={13} className="text-muted-foreground" /> },
        { label: "Phone Number", value: order.customer.phoneNumber || "—", icon: <Phone size={13} className="text-muted-foreground" /> },
        { label: "Weight", value: `${order.weight} g`, icon: <Scale size={13} className="text-muted-foreground" /> },
        { label: "Result", value: order.result, icon: <Award size={13} className="text-muted-foreground" /> },
        { label: "Stamp No", value: order.stampNo || "—" },
        { label: "Wastage", value: `${order.wastage ?? 0} g` },
        { label: "Order Date", value: `${formatDisplayDate(order.orderDate)}${order.orderTime ? ` (${order.orderTime})` : ""}`, icon: <Calendar size={13} className="text-muted-foreground" /> },
        { label: "Delivery Date", value: order.deliverDate ? `${formatDisplayDate(order.deliverDate)}${order.deliverTime ? ` (${order.deliverTime})` : ""}` : "—", icon: <CheckCircle2 size={13} className="text-muted-foreground" /> },
    ];

    return (<Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Order #{order.orderId}</DialogTitle>
                <DialogDescription>Complete order information</DialogDescription>
            </DialogHeader>
            {order && (
                <div className="space-y-3 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        {details.map(({ label, value, icon }) => (
                            <div key={label}>
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                    {/* <p className="text-xs text-muted-foreground mb-0.5"> */}
                                    {icon}
                                    <span>{label}</span></p>
                                <p className="font-medium text-foreground text-sm">{value}</p>
                            </div>
                        ))}
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus]}`}>{order.orderStatus}</span>
                        </div>
                        {order.orderStatus === "DELIVERED" && order.wastage !== undefined && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Wastage</p>
                                <p className="font-medium text-foreground text-sm flex items-center gap-1.5">
                                    <Scale size={13} className="text-accent" aria-hidden="true" />
                                    {order.wastage}g
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                <Button onClick={() => { /*if (viewOrder) handlePrint(viewOrder);*/ }}><Printer size={14} className="mr-1.5" /> Print</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    );
};

export default ViewDialog;
