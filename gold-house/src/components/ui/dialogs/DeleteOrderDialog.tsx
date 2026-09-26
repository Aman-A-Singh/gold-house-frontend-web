import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialogs/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Order } from "@/models/order";

interface DeleteOrderDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (orderId: string) => void;
}

export const DeleteOrderDialog = ({
    order,
    open,
    onOpenChange,
    onConfirm,
}: DeleteOrderDialogProps) => {
    if (!order) return null;

    const cleanId = String(order.orderId).trim().replace(/^#/, "");
    const customerName = order.customer?.name || "Unknown Customer";

    const handleConfirm = () => {
        onConfirm(cleanId);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Delete Order #{cleanId}</DialogTitle>
                            <DialogDescription className="text-sm mt-0.5">
                                Please confirm if you want to remove this order
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-2 text-sm text-muted-foreground space-y-3">
                    <p>
                        Are you sure you want to delete order <span className="font-semibold text-foreground">#{cleanId}</span> for customer <span className="font-semibold text-foreground">{customerName}</span>?
                    </p>
                    <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Weight:</span>
                            <span className="font-medium text-foreground">{order.weight}g</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="font-medium text-foreground">{order.orderStatus}</span>
                        </div>
                    </div>
                    <p className="text-xs text-destructive font-medium">
                        This action cannot be undone and will permanently remove this order.
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        className="cursor-pointer gap-1.5"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteOrderDialog;
