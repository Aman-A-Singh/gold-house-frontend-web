import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialogs/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Order } from "@/models/order";
import { toast } from "@/components/ui/toast/sonner";
import { addOrder, updateOrder, getOrderById } from "@/lib/Api/orderApi";
import { searchCustomers, CustomerSuggestion } from "@/lib/Api/customerApi";

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
    orderStatus: "PENDING",
    orderDate: new Date().toISOString().split("T")[0],
    customer: { phoneNumber: 0, name: "", id: null },
    orderTime: new Date().toISOString().split("T")[1].slice(0, 5),
    deliverDate: null,
    deliverTime: null,
    result: 0,
    wastage: 0,
    stampNo: 1,
};

interface AddOrdersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderToEdit?: Order | null;
    onOrderSaved?: (savedOrder: Order) => void;
}

const AddOrdersDialog = ({ open, onOpenChange, orderToEdit = null, onOrderSaved }: AddOrdersDialogProps) => {
    const isEditMode = Boolean(orderToEdit);
    const [addForm, setAddForm] = useState<Omit<Order, "id">>({ ...emptyOrder });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [query, setQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Track whether a query change was done programmatically (dialog open, suggestion picked)
    // so we don't open the dropdown or re-search automatically.
    const isProgrammaticChangeRef = useRef(false);
    // Track whether the user has started manually editing fields to prevent slow API overwrites
    const hasUserEditedRef = useRef(false);

    // Populate or reset form whenever dialog opens or orderToEdit changes
    useEffect(() => {
        if (!open) return;

        hasUserEditedRef.current = false;
        setSuggestions([]);
        setShowSuggestions(false);

        if (orderToEdit) {
            const cleanId = String(orderToEdit.orderId).trim().replace(/^#/, "");
            const initial: Omit<Order, "id"> = {
                orderId: cleanId,
                weight: orderToEdit.weight ?? 0,
                orderStatus: orderToEdit.orderStatus ?? "PENDING",
                orderDate: orderToEdit.orderDate ?? new Date().toISOString().split("T")[0],
                customer: {
                    id: orderToEdit.customer?.id ?? null,
                    name: orderToEdit.customer?.name ?? "",
                    phoneNumber: orderToEdit.customer?.phoneNumber ?? 0,
                },
                orderTime: orderToEdit.orderTime ?? new Date().toISOString().split("T")[1].slice(0, 5),
                deliverDate: orderToEdit.deliverDate ?? null,
                deliverTime: orderToEdit.deliverTime ?? null,
                result: orderToEdit.result ?? 0,
                wastage: orderToEdit.wastage ?? 0,
                stampNo: orderToEdit.stampNo ?? 1,
            };
            setAddForm(initial);
            isProgrammaticChangeRef.current = true;
            setQuery(orderToEdit.customer?.name ?? "");
            setErrors({});
            setIsLoadingDetails(true);

            // Fetch fresh details from backend using getOrderById API
            getOrderById(cleanId)
                .then((fresh) => {
                    if (fresh && !hasUserEditedRef.current) {
                        setAddForm((prev) => ({
                            ...prev,
                            weight: fresh.weight ?? prev.weight,
                            orderStatus: fresh.orderStatus ?? prev.orderStatus,
                            orderDate: fresh.orderDate ?? prev.orderDate,
                            orderTime: fresh.orderTime ?? prev.orderTime,
                            deliverDate: fresh.deliverDate ?? prev.deliverDate,
                            deliverTime: fresh.deliverTime ?? prev.deliverTime,
                            result: fresh.result ?? prev.result,
                            wastage: fresh.wastage ?? prev.wastage,
                            stampNo: fresh.stampNo ?? prev.stampNo,
                            customer: {
                                id: fresh.customer?.id ?? prev.customer.id,
                                name: fresh.customer?.name ?? prev.customer.name,
                                phoneNumber: fresh.customer?.phoneNumber ?? prev.customer.phoneNumber,
                            },
                        }));
                        if (fresh.customer?.name) {
                            isProgrammaticChangeRef.current = true;
                            setQuery(fresh.customer.name);
                        }
                    }
                })
                .catch((err) => {
                    console.warn("Could not fetch latest order details from API, using row data:", err);
                })
                .finally(() => {
                    setIsLoadingDetails(false);
                });
        } else {
            setAddForm({ ...emptyOrder });
            isProgrammaticChangeRef.current = true;
            setQuery("");
            setErrors({});
            setIsLoadingDetails(false);
        }
    }, [open, orderToEdit]);

    const recalcAdd = (updates: Partial<Omit<Order, "id">>) => {
        hasUserEditedRef.current = true;
        setAddForm(prev => ({ ...prev, ...updates }));

        setErrors(prev => {
            if (Object.keys(prev).length === 0) return prev;
            const newErrors = { ...prev };
            if (updates.customer) delete newErrors.customerName;
            if ('weight' in updates) delete newErrors.weight;
            if ('result' in updates) delete newErrors.result;
            if ('deliverDate' in updates || 'orderDate' in updates) delete newErrors.deliverDate;
            return newErrors;
        });
    };

    // Customer Auto-suggestion search effect
    useEffect(() => {
        if (isProgrammaticChangeRef.current) {
            isProgrammaticChangeRef.current = false;
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const name = query.trim();
        if (!name || name.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const fetchCustomer = async () => {
            try {
                const customerSuggestions = await searchCustomers(name);
                if (customerSuggestions.length > 0) {
                    setSuggestions(customerSuggestions);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (error) {
                console.error("Failed to fetch customer suggestions", error);
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timeoutId = setTimeout(fetchCustomer, 300); // 300ms debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        hasUserEditedRef.current = true;
        isProgrammaticChangeRef.current = false;
        const val = e.target.value;
        setQuery(val);
        setAddForm(prev => ({
            ...prev,
            customer: {
                ...prev.customer,
                name: val,
                // Unlink previous customer ID if name was manually changed
                id: prev.customer.name === val ? prev.customer.id : null,
            }
        }));
        setErrors(prev => {
            if (!prev.customerName) return prev;
            const newErrors = { ...prev };
            delete newErrors.customerName;
            return newErrors;
        });
    };

    const handleSelectSuggestion = (customer: CustomerSuggestion) => {
        hasUserEditedRef.current = true;
        isProgrammaticChangeRef.current = true;
        setQuery(customer.name);
        setSuggestions([]);
        setShowSuggestions(false);
        setAddForm(prev => ({
            ...prev,
            customer: {
                id: customer.id,
                name: customer.name,
                phoneNumber: customer.phoneNumber || prev.customer.phoneNumber || 0,
            }
        }));
        setErrors(prev => {
            if (!prev.customerName) return prev;
            const newErrors = { ...prev };
            delete newErrors.customerName;
            return newErrors;
        });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setAddForm({ ...emptyOrder });
            setQuery("");
            setSuggestions([]);
            setShowSuggestions(false);
            setErrors({});
            onOpenChange(false);
        }
    };

    const handleSubmit = async () => {
        const customerName = (query || addForm.customer.name).trim();
        const newErrors: Record<string, string> = {};
        if (!customerName) newErrors.customerName = "Customer name is required";
        if (addForm.weight <= 0) newErrors.weight = "Weight must be greater than 0";
        if (addForm.result <= 0) newErrors.result = "Result must be greater than 0";

        if (addForm.deliverDate && addForm.deliverDate < addForm.orderDate) {
            newErrors.deliverDate = "Expected delivery date cannot be earlier than order date";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill the required fields correctly");
            return;
        }

        const payload: Omit<Order, "id"> = {
            ...addForm,
            customer: {
                ...addForm.customer,
                name: customerName,
            }
        };

        setIsSubmitting(true);
        try {
            if (isEditMode && orderToEdit) {
                const cleanId = String(orderToEdit.orderId).trim().replace(/^#/, "");
                const updated = await updateOrder(cleanId, payload);
                toast.success(`Order #${cleanId} updated successfully`);
                onOrderSaved?.(updated);
            } else {
                const created = await addOrder(payload as Order);
                toast.success("Order created successfully");
                onOrderSaved?.(created);
            }
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving order:", error);
            toast.error(error.message || `Failed to ${isEditMode ? "update" : "create"} order. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const cleanDisplayId = orderToEdit ? String(orderToEdit.orderId).replace(/^#/, "") : "";

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? (
                            <>
                                <span>Edit Order #{cleanDisplayId}</span>
                                {isLoadingDetails && <Loader2 size={15} className="animate-spin text-muted-foreground" />}
                            </>
                        ) : (
                            "Create New Order"
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "Update the order details below" : "Fill in the order details below"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 relative">
                            <label htmlFor="add-customer" className={`text-xs font-medium mb-1.5 block ${errors.customerName ? "text-destructive" : "text-muted-foreground"}`}>
                                Customer Name *
                            </label>
                            <input
                                id="add-customer"
                                className={`${inputClass} ${errors.customerName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                value={query}
                                onChange={handleCustomerNameChange}
                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Enter customer name"
                                autoComplete="off"
                            />
                            {errors.customerName && <p className="text-xs text-destructive mt-1.5">{errors.customerName}</p>}

                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-20 w-full bg-popover border border-border rounded-md shadow-lg mt-1 max-h-40 overflow-auto">
                                    {suggestions.map((customer) => (
                                        <li
                                            key={customer.id}
                                            className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground transition-colors"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectSuggestion(customer);
                                            }}
                                        >
                                            <div className="font-medium">{customer.name}</div>
                                            <div className="text-xs text-muted-foreground opacity-80">{customer.phoneNumber ? `+${customer.phoneNumber}` : "No Phone"}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label htmlFor="add-phone" className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
                            <input
                                id="add-phone"
                                type="tel"
                                className={inputClass}
                                value={addForm.customer.phoneNumber || ""}
                                onChange={(e) => {
                                    hasUserEditedRef.current = true;
                                    const val = e.target.value.replace(/\D/g, "");
                                    setAddForm(prev => ({
                                        ...prev,
                                        customer: {
                                            ...prev.customer,
                                            phoneNumber: val ? Number(val) : 0,
                                        }
                                    }));
                                }}
                                placeholder="Phone number"
                            />
                        </div>

                        <div>
                            <label htmlFor="add-weight" className={`text-xs font-medium mb-1.5 block ${errors.weight ? "text-destructive" : "text-muted-foreground"}`}>Weight (g) *</label>
                            <input
                                id="add-weight"
                                type="number"
                                step="any"
                                className={`${inputClass} ${errors.weight ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                value={addForm.weight || ""}
                                onChange={(e) => recalcAdd({ weight: Number(e.target.value) })}
                                placeholder="0"
                            />
                            {errors.weight && <p className="text-xs text-destructive mt-1.5">{errors.weight}</p>}
                        </div>

                        <div>
                            <label htmlFor="add-date" className="text-xs font-medium text-muted-foreground mb-1.5 block">Order Date</label>
                            <DateInput
                                id="add-date"
                                value={addForm.orderDate}
                                onChange={(val) => {
                                    if (addForm.deliverDate && addForm.deliverDate < val) {
                                        recalcAdd({ orderDate: val, deliverDate: null });
                                    } else {
                                        recalcAdd({ orderDate: val });
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="add-delivery" className={`text-xs font-medium mb-1.5 block ${errors.deliverDate ? "text-destructive" : "text-muted-foreground"}`}>Expected Delivery</label>
                            <DateInput
                                id="add-delivery"
                                min={addForm.orderDate}
                                value={addForm.deliverDate || ""}
                                onChange={(val) => recalcAdd({ deliverDate: val })}
                                hasError={!!errors.deliverDate}
                            />
                            {errors.deliverDate && <p className="text-xs text-destructive mt-1.5">{errors.deliverDate}</p>}
                        </div>

                        <div>
                            <label htmlFor="add-status" className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                            <select
                                id="add-status"
                                className={inputClass}
                                value={addForm.orderStatus}
                                onChange={(e) => recalcAdd({ orderStatus: e.target.value as Order["orderStatus"] })}
                            >
                                <option value="PENDING">Pending</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="add-stamp" className="text-xs font-medium text-muted-foreground mb-1.5 block">Stamp No</label>
                            <select
                                id="add-stamp"
                                className={inputClass}
                                value={addForm.stampNo}
                                onChange={(e) => recalcAdd({ stampNo: parseInt(e.target.value, 10) })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="add-result" className={`text-xs font-medium mb-1.5 block ${errors.result ? "text-destructive" : "text-muted-foreground"}`}>Result (g) *</label>
                            <input
                                id="add-result"
                                type="number"
                                step="any"
                                className={`${inputClass} ${errors.result ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                value={addForm.result || ""}
                                onChange={(e) => recalcAdd({ result: Number(e.target.value) })}
                                placeholder="0"
                            />
                            {errors.result && <p className="text-xs text-destructive mt-1.5">{errors.result}</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingDetails} className="cursor-pointer">
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="mr-1.5 animate-spin" />
                                {isEditMode ? "Updating..." : "Creating..."}
                            </>
                        ) : isEditMode ? (
                            <>
                                <Pencil size={14} className="mr-1.5" /> Update Order
                            </>
                        ) : (
                            <>
                                <Plus size={14} className="mr-1.5" /> Create Order
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddOrdersDialog;