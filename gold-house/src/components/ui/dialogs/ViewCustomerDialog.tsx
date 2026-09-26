import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialogs/dialog";
import { Button } from "@/components/ui/button";
import { User, Phone, Hash, Copy } from "lucide-react";
import { Customer } from "@/lib/Api/customerApi";
import { toast } from "@/components/ui/toast/sonner";

interface ViewCustomerDialogProps {
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

export const ViewCustomerDialog = ({
    customer,
    open,
    onOpenChange,
}: ViewCustomerDialogProps) => {
    if (!customer) return null;

    const handleCopyPhone = (phoneNumber: number) => {
        const text = String(phoneNumber);
        navigator.clipboard.writeText(text);
        toast.success(`Copied phone: ${text}`);
    };

    const handleCopyId = (id: number) => {
        navigator.clipboard.writeText(String(id));
        toast.success(`Copied Customer ID: #${id}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{customer.name}</DialogTitle>
                    <DialogDescription>Customer Profile & Details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {/* Profile Header Badge */}
                    <div className="flex items-center gap-3.5 p-4 rounded-xl bg-muted/40 border border-border">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                            {getInitials(customer.name)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-base leading-tight">
                                {customer.name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                Customer ID #{customer.id}
                            </p>
                        </div>
                    </div>

                    {/* Details List */}
                    <div className="grid grid-cols-1 gap-3">
                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                    <User size={13} className="text-muted-foreground" />
                                    <span>Full Name</span>
                                </p>
                                <p className="font-semibold text-foreground text-sm">
                                    {customer.name}
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                    <Phone size={13} className="text-muted-foreground" />
                                    <span>Phone Number</span>
                                </p>
                                <p className="font-semibold text-foreground text-sm font-mono">
                                    {formatPhone(customer.phoneNumber)}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyPhone(customer.phoneNumber)}
                                className="h-8 px-2.5 text-xs cursor-pointer"
                            >
                                <Copy size={12} className="mr-1" /> Copy
                            </Button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                    <Hash size={13} className="text-muted-foreground" />
                                    <span>Customer ID</span>
                                </p>
                                <p className="font-semibold text-foreground text-sm font-mono">
                                    #{customer.id}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyId(customer.id)}
                                className="h-8 px-2.5 text-xs cursor-pointer"
                            >
                                <Copy size={12} className="mr-1" /> Copy
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ViewCustomerDialog;
