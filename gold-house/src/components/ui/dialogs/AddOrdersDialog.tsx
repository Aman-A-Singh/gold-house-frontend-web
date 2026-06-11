
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialogs/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Order } from "@/models/order";
import { toast } from "@/components/ui/toast/sonner";


const inputClass = "w-full px-3 py-2.5 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring transition";

const DateInput = ({ id, value, onChange, min, hasError }: { id: string, value: string, onChange: (val: string) => void, min?: string, hasError?: boolean }) => {
    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="relative w-full rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
            {/* Visible formatted text input */}
            <input
                type="text"
                readOnly
                value={formatDisplayDate(value)}
                className={`${inputClass} cursor-pointer focus-visible:ring-0 ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                placeholder="DD/MM/YYYY"
                tabIndex={-1}
            />
            {/* Invisible native date input to trigger the picker */}
            <input
                id={id}
                type="date"
                min={min}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onClick={(e) => (e.target as any).showPicker?.()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
        </div>
    );
};

const emptyOrder: Omit<Order, "id"> = {
    orderId: "",
    weight: 0,
    orderStatus: "Pending",
    orderDate: new Date().toISOString().split("T")[0],
    customer: { phoneNumber: 0, name: "", id: 0 },
    orderTime: new Date().toISOString().split("T")[1].slice(0, 5),
    deliverDate: null,
    deliverTime: null,
    result: 0,
    wastage: 0,
    stampNo: 0
};

interface AddOrdersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AddOrdersDialog = ({ open, onOpenChange }: AddOrdersDialogProps) => {
    const [addForm, setAddForm] = useState<Omit<Order, "id">>({ ...emptyOrder });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const recalcAdd = (updates: Partial<Omit<Order, "id">>) => {
        const next = { ...addForm, ...updates };
        setAddForm(next);

        setErrors(prev => {
            if (Object.keys(prev).length === 0) return prev;
            const newErrors = { ...prev };
            if (updates.customer) delete newErrors.customerName;
            if ('weight' in updates) delete newErrors.weight;
            if ('deliverDate' in updates || 'orderDate' in updates) delete newErrors.deliverDate;
            return newErrors;
        });
    };

    const handleAdd = () => {
        const newErrors: Record<string, string> = {};
        if (!addForm.customer.name.trim()) newErrors.customerName = "Customer name is required";
        if (addForm.weight <= 0) newErrors.weight = "Weight must be greater than 0";
        
        if (addForm.deliverDate && addForm.deliverDate < addForm.orderDate) {
            newErrors.deliverDate = "Expected delivery date cannot be earlier than order date";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill the required fields correctly");
            return;
        }

        toast.success(`Order created successfully`);
        setAddForm({ ...emptyOrder });
        setErrors({});
        onOpenChange(false);
    };

    const handleClose = () => {
        setAddForm({ ...emptyOrder });
        setErrors({});
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Fill in the order details below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="add-customer" className={`text-xs font-medium mb-1.5 block ${errors.customerName ? "text-destructive" : "text-muted-foreground"}`}>Customer Name *</label>
                        <input id="add-customer" className={`${inputClass} ${errors.customerName ? "border-destructive focus-visible:ring-destructive" : ""}`} value={addForm.customer.name} onChange={(e) => recalcAdd({ customer: { ...addForm.customer, name: e.target.value } })} placeholder="Enter customer name" />
                        {errors.customerName && <p className="text-xs text-destructive mt-1.5">{errors.customerName}</p>}
                    </div>
                    <div>
                        <label htmlFor="add-phone" className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
                        <input id="add-phone" className={inputClass} value={addForm.customer.phoneNumber} onChange={(e) => recalcAdd({ customer: { ...addForm.customer, phoneNumber: Number(e.target.value) } })} placeholder="+92 xxx xxxxxxx" />
                    </div>

                    <div>
                        <label htmlFor="add-weight" className={`text-xs font-medium mb-1.5 block ${errors.weight ? "text-destructive" : "text-muted-foreground"}`}>Weight (g) *</label>
                        <input id="add-weight" type="number" className={`${inputClass} ${errors.weight ? "border-destructive focus-visible:ring-destructive" : ""}`} value={addForm.weight || ""} onChange={(e) => recalcAdd({ weight: Number(e.target.value) })} placeholder="0" />
                        {errors.weight && <p className="text-xs text-destructive mt-1.5">{errors.weight}</p>}
                    </div>

                    <div>
                        <label htmlFor="add-date" className="text-xs font-medium text-muted-foreground mb-1.5 block">Order Date</label>
                        <DateInput id="add-date" value={addForm.orderDate} onChange={(val) => {
                            if (addForm.deliverDate && addForm.deliverDate < val) {
                                recalcAdd({ orderDate: val, deliverDate: null });
                            } else {
                                recalcAdd({ orderDate: val });
                            }
                        }} />
                    </div>
                    <div>
                        <label htmlFor="add-delivery" className={`text-xs font-medium mb-1.5 block ${errors.deliverDate ? "text-destructive" : "text-muted-foreground"}`}>Expected Delivery</label>
                        <DateInput id="add-delivery" min={addForm.orderDate} value={addForm.deliverDate || ""} onChange={(val) => recalcAdd({ deliverDate: val })} hasError={!!errors.deliverDate} />
                        {errors.deliverDate && <p className="text-xs text-destructive mt-1.5">{errors.deliverDate}</p>}
                    </div>

                    <div>
                        <label htmlFor="add-status" className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                        <select id="add-status" className={inputClass} value={addForm.orderStatus} onChange={(e) => recalcAdd({ orderStatus: e.target.value as Order["orderStatus"] })}>
                            <option value="Pending">Pending</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleAdd}><Plus size={14} className="mr-1.5" /> Create Order</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    );
}

export default AddOrdersDialog;