import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast/sonner";
import {
  BILL_CSS,
  MAX_TEMPLATES,
  renderBillBody,
  type BillTemplate,
  type BillTemplateRequestDTO,
  printBill,
  dummyOrder,
} from "./billTemplate";
import {
  getAllTemplates,
  createTemplate,
  setDefaultTemplate,
  deleteTemplate as deleteTemplateApi,
} from "@/lib/Api/billTemplateApi";
import { Check, Copy, MoreHorizontal, Pencil, Plus, Printer, Star, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/ordersTable/DropDownMenu";

const BillTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BillTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load templates";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const defaultId = templates.find((t) => t.isDefault)?.id || templates[0]?.id;

  const handleNew = () => {
    if (templates.length >= MAX_TEMPLATES) {
      toast.error(`You can save up to ${MAX_TEMPLATES} templates. Delete one first.`);
      return;
    }
    navigate("/bill-templates/new");
  };

  const handleDuplicate = async (t: BillTemplate) => {
    if (templates.length >= MAX_TEMPLATES) {
      toast.error(`You can save up to ${MAX_TEMPLATES} templates. Delete one first.`);
      return;
    }

    try {
      setActionLoadingId(t.id);
      const dto: BillTemplateRequestDTO = {
        name: `${t.name} (copy)`,
        paperWidth: t.paperWidth,
        fontSize: t.fontSize,
        margins: t.margins,
        topLines: t.topLines,
        lines: t.lines,
        bottomLines: t.bottomLines,
        isDefault: false,
      };
      await createTemplate(dto);
      toast.success("Template duplicated");
      await loadTemplates();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to duplicate template";
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSetDefault = async (t: BillTemplate) => {
    try {
      setActionLoadingId(t.id);
      await setDefaultTemplate(t.id);
      setTemplates((prev) => prev.map((item) => ({ ...item, isDefault: item.id === t.id })));
      toast.success(`"${t.name}" will be printed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set default template";
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoadingId(id);
      await deleteTemplateApi(id);
      toast.success("Template deleted");
      await loadTemplates();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete template";
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const previewOrder = dummyOrder;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-display text-foreground">Bill Templates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Design your thermal printer bill. Click a card to edit it, and use its more menu (⋮) to choose which bill gets printed. Up to {MAX_TEMPLATES} templates.
        </p>
      </div>

      <style>{BILL_CSS}</style>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Loading templates...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {templates.map((t) => {
            const isDefault = t.id === defaultId;
            const thumb = previewOrder ? renderBillBody(t, previewOrder) : "";
            const isBusy = actionLoadingId === t.id;

            return (
              <div
                key={t.id}
                className={`relative bg-card rounded-2xl border p-3 transition ${
                  isDefault ? "border-secondary/80 ring-1 ring-secondary/30" : "border-border hover:border-secondary/50"
                } ${isBusy ? "opacity-60 pointer-events-none" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/bill-templates/${t.id}/edit`)}
                  className="block w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <div className="rounded-xl bg-muted p-2 h-72 overflow-hidden flex justify-center pointer-events-none">
                    <div
                      className="bg-background shadow-sm [&_.bill]:!bg-transparent"
                      style={{ background: "white" }}
                      dangerouslySetInnerHTML={{ __html: thumb }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 px-0.5">
                    {isDefault && <Star size={13} className="fill-secondary text-secondary shrink-0" aria-label="Prints by default" />}
                    <span className="font-medium text-foreground truncate text-sm">{t.name}</span>
                    {isDefault && <span className="ml-auto shrink-0 text-[11px] font-semibold text-secondary">Printing</span>}
                  </div>
                  <span className="block text-xs text-muted-foreground px-0.5 mt-0.5">
                    {t.paperWidth} mm paper · {(t.topLines?.length || 0) + (t.lines?.length || 0) + (t.bottomLines?.length || 0)} lines
                  </span>
                </button>

                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`More options for ${t.name}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-background/90 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        {isBusy ? <Loader2 size={13} className="animate-spin" /> : <MoreHorizontal size={15} />}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => navigate(`/bill-templates/${t.id}/edit`)}>
                        <Pencil size={14} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!previewOrder} onClick={() => previewOrder && printBill(t, previewOrder)}>
                        <Printer size={14} className="mr-2" />
                        Test print
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isDefault} onClick={() => handleSetDefault(t)}>
                        <Check size={14} className="mr-2" />
                        Select for printing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                        <Copy size={14} className="mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {templates.length < MAX_TEMPLATES && (
            <button
              type="button"
              onClick={handleNew}
              className="min-h-[340px] rounded-2xl border-2 border-dashed border-border hover:border-secondary/60 hover:bg-muted/40 transition flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <span className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Plus size={18} />
              </span>
              <span className="text-sm font-medium">Add template</span>
              <span className="text-xs">{templates.length}/{MAX_TEMPLATES} used</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BillTemplates;
