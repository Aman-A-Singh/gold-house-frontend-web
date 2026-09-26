import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast/sonner";

import {
  BILL_CSS,
  ORDER_FIELDS,
  printBill,
  renderBillBody,
  uid,
  type BillLine,
  type BillMargins,
  type BillTemplate,
  type BillTemplateRequestDTO,
  type OrderFieldKey,
  dummyOrders,
} from "./billTemplate";
import {
  getTemplateById,
  getDefaultTemplate,
  createTemplate,
  updateTemplate,
  setDefaultTemplate,
  deleteTemplate as deleteTemplateApi,
} from "@/lib/Api/billTemplateApi";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Minus,
  Printer,
  Save,
  Star,
  Trash2,
  Type,
  Rows3,
  Tag,
  Clock3,
} from "lucide-react";

const inputClass = "w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring transition";
const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

type SectionKey = "topLines" | "lines" | "bottomLines";
const makeLine = (type: BillLine["type"]): BillLine =>
  type === "field"
    ? { id: uid(), type, label: "Label", field: "id", valueBold: false }
    : type === "text"
      ? { id: uid(), type, text: "New line", align: "center" }
      : type === "divider"
        ? { id: uid(), type, style: "dashed" }
        : type === "printedAt"
          ? { id: uid(), type, align: "center", fontSize: 10 }
          : { id: uid(), type: "spacer" };

const compactInput = "w-full px-2 py-1.5 rounded-md bg-background border border-border text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition";
const iconBtn = "inline-flex items-center justify-center h-7 w-7 shrink-0 rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

function LineSection({
  title,
  lines,
  onChange,
  showDate,
}: {
  title: string;
  lines: BillLine[];
  onChange: (lines: BillLine[]) => void;
  showDate?: boolean;
}) {
  const change = (id: string, patch: Partial<BillLine>) =>
    onChange(lines.map((line) => (line.id === id ? ({ ...line, ...patch } as BillLine) : line)));
  const move = (index: number, offset: number) => {
    const next = [...lines];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const typeName = (line: BillLine) =>
    line.type === "field"
      ? "Key / Value"
      : line.type === "text"
        ? "Text"
        : line.type === "divider"
          ? "Separator"
          : line.type === "printedAt"
            ? "Print date"
            : "Space";
  const getName = (line: BillLine, value?: boolean) =>
    `${title} line · ${typeName(line)} ${value ? "value" : line.type === "field" ? "key" : "text"}`;

  const sizeSelect = (line: Extract<BillLine, { type: "field" | "text" | "printedAt" }>, value = false) => {
    const current = value && line.type === "field" ? line.valueSize : line.fontSize;
    return (
      <select
        aria-label={`${getName(line, value)} font size`}
        title="Font size"
        className="h-7 w-[64px] shrink-0 rounded-md bg-background border border-border text-xs px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={current ?? ""}
        onChange={(e) =>
          change(
            line.id,
            value
              ? { valueSize: e.target.value ? Number(e.target.value) : undefined }
              : { fontSize: e.target.value ? Number(e.target.value) : undefined }
          )
        }
      >
        <option value="">Auto</option>
        {Array.from({ length: 17 }, (_, i) => i + 8).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    );
  };
  const boldBtn = (line: Extract<BillLine, { type: "field" | "text" | "printedAt" }>, value = false) => {
    const active = !!(value && line.type === "field" ? line.valueBold : line.bold);
    return (
      <button
        type="button"
        className={`h-7 w-7 shrink-0 rounded-md border text-xs font-bold transition cursor-pointer ${active
          ? "bg-secondary text-secondary-foreground border-secondary"
          : "bg-background text-muted-foreground border-border hover:bg-muted"
          }`}
        aria-label={`${getName(line, value)} bold`}
        aria-pressed={active}
        title={`${value ? "Value" : line.type === "field" ? "Key" : "Text"} bold`}
        onClick={() =>
          change(line.id, value && line.type === "field" ? { valueBold: !line.valueBold } : { bold: !line.bold })
        }
      >
        B
      </button>
    );
  };

  return (
    <section className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onChange([...lines, makeLine("text")])}>
            <Type size={13} className="mr-1" />Text
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange([...lines, makeLine("field")])}>
            <Tag size={13} className="mr-1" />Key / Value
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange([...lines, makeLine("divider")])}>
            <Minus size={13} className="mr-1" />Line
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange([...lines, makeLine("spacer")])}>
            <Rows3 size={13} className="mr-1" />Space
          </Button>
          {showDate && (
            <Button size="sm" variant="outline" onClick={() => onChange([...lines, makeLine("printedAt")])}>
              <Clock3 size={13} className="mr-1" />Print date
            </Button>
          )}
        </div>
      </div>
      {lines.length === 0 && <p className="text-sm text-muted-foreground py-2">No lines yet.</p>}
      <ul className="space-y-2">
        {lines.map((line, index) => (
          <li key={line.id} className="rounded-xl bg-muted/40 border border-border px-2.5 py-2 space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground mr-auto whitespace-nowrap">
                {typeName(line)} · {index + 1}
              </span>
              {line.type === "field" && (
                <>
                  <span className="text-[10px] text-muted-foreground" title="Key style">Key</span>
                  {sizeSelect(line)}
                  {boldBtn(line)}
                  <span className="text-[10px] text-muted-foreground ml-1" title="Value style">Value</span>
                  {sizeSelect(line, true)}
                  {boldBtn(line, true)}
                </>
              )}
              {(line.type === "text" || line.type === "printedAt") && (
                <>
                  {sizeSelect(line)}
                  {boldBtn(line)}
                </>
              )}
              <span className="w-px h-5 bg-border mx-1" aria-hidden="true" />
              <button
                type="button"
                className={iconBtn}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                title="Move up"
                aria-label={`Move ${title} line ${index + 1} up`}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className={iconBtn}
                disabled={index === lines.length - 1}
                onClick={() => move(index, 1)}
                title="Move down"
                aria-label={`Move ${title} line ${index + 1} down`}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className={`${iconBtn} hover:text-destructive`}
                onClick={() => onChange(lines.filter((item) => item.id !== line.id))}
                title="Remove line"
                aria-label={`Remove ${title} line ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {line.type === "field" && (
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  aria-label={`${title} line ${index + 1} key`}
                  className={compactInput}
                  placeholder="Key label"
                  value={line.label}
                  onChange={(e) => change(line.id, { label: e.target.value })}
                />
                <select
                  aria-label={`${title} line ${index + 1} value field`}
                  className={compactInput}
                  value={line.field}
                  onChange={(e) => change(line.id, { field: e.target.value as OrderFieldKey })}
                >
                  {(Object.keys(ORDER_FIELDS) as OrderFieldKey[]).map((key) => (
                    <option key={key} value={key}>
                      {ORDER_FIELDS[key].label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {line.type === "text" && (
              <div className="grid sm:grid-cols-[minmax(0,1fr)_96px] gap-2">
                <input
                  aria-label={`${title} line ${index + 1} text`}
                  className={compactInput}
                  placeholder="Text"
                  value={line.text}
                  onChange={(e) => change(line.id, { text: e.target.value })}
                />
                <select
                  aria-label={`${title} line ${index + 1} alignment`}
                  className={compactInput}
                  value={line.align}
                  onChange={(e) => change(line.id, { align: e.target.value as "left" | "center" | "right" })}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            )}
            {line.type === "printedAt" && (
              <select
                aria-label={`${title} line ${index + 1} alignment`}
                className={`${compactInput} sm:max-w-[96px]`}
                value={line.align}
                onChange={(e) => change(line.id, { align: e.target.value as "left" | "center" | "right" })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            )}
            {line.type === "divider" && (
              <select
                aria-label={`${title} line ${index + 1} style`}
                className={`${compactInput} sm:max-w-[120px]`}
                value={line.style}
                onChange={(e) => change(line.id, { style: e.target.value as "dashed" | "solid" | "double" })}
              >
                <option value="dashed">Dashed</option>
                <option value="solid">Solid</option>
                <option value="double">Double</option>
              </select>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const BillTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [draft, setDraft] = useState<BillTemplate | null>(null);
  const [dirty, setDirty] = useState(false);
  const orders = dummyOrders;
  const [previewOrderId, setPreviewOrderId] = useState(orders[0]?.orderId ?? "");

  const isNew = !id;

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);

        if (id) {
          const existing = await getTemplateById(id);
          if (isCancelled) return;
          setDraft(existing);
        } else {
          const defaultTemplate = await getDefaultTemplate();
          if (isCancelled) return;
          setDraft({
            ...structuredClone(defaultTemplate),
            id: uid(),
            name: "New Template",
            isDefault: false,
          });
          setDirty(true);
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Failed to load template";
          toast.error(message);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const update = (patch: Partial<BillTemplate>) => {
    setDraft((d) => (d ? { ...d, ...patch } : null));
    setDirty(true);
  };
  const updateSection = (section: SectionKey, lines: BillLine[]) => update({ [section]: lines });
  const setMargin = (side: keyof BillMargins, v: number) =>
    update({ margins: draft ? { ...draft.margins, [side]: Math.min(30, Math.max(0, v || 0)) } : undefined });

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      setIsSaving(true);
      const dto: BillTemplateRequestDTO = {
        name: draft.name.trim(),
        paperWidth: draft.paperWidth,
        fontSize: draft.fontSize,
        margins: draft.margins,
        topLines: draft.topLines,
        lines: draft.lines,
        bottomLines: draft.bottomLines,
        isDefault: draft.isDefault,
      };

      if (isNew) {
        await createTemplate(dto);
      } else {
        await updateTemplate(id, dto);
      }

      setDirty(false);
      toast.success("Template saved");
      navigate("/bill-templates");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save template";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async () => {
    if (!draft || !draft.id || isNew) return;
    try {
      await setDefaultTemplate(draft.id);
      setDraft((d) => (d ? { ...d, isDefault: true } : null));
      toast.success(`"${draft.name}" is now the default bill`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set default template";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!draft || !draft.id || isNew) return;

    try {
      setIsDeleting(true);
      await deleteTemplateApi(draft.id);
      toast.success("Template deleted");
      navigate("/bill-templates");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete template";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const previewOrder = orders.find((o) => o.orderId === previewOrderId) ?? orders[0];
  const previewHtml = useMemo(
    () => (draft && previewOrder ? renderBillBody(draft, previewOrder) : ""),
    [draft, previewOrder]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Loading template...</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div>
        <p className="text-muted-foreground">Template not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/bill-templates")}>
          Back to templates
        </Button>
      </div>
    );
  }



  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h2 className="text-2xl font-display text-foreground">
            {isNew ? "Create Bill Template" : "Edit Bill Template"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Changes appear in the live preview. Click Save when done.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Editor */}
        <div className="space-y-6 min-w-0">
          <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Template Settings</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className={labelClass} htmlFor="t-name">
                  Template Name
                </label>
                <input
                  id="t-name"
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-paper">
                  Paper Width
                </label>
                <select
                  id="t-paper"
                  className={inputClass}
                  value={draft.paperWidth}
                  onChange={(e) => update({ paperWidth: Number(e.target.value) as 58 | 80 })}
                >
                  <option value={58}>58 mm (small)</option>
                  <option value={80}>80 mm (standard)</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="t-font">
                  Font Size ({draft.fontSize}px)
                </label>
                <input
                  id="t-font"
                  type="range"
                  min={9}
                  max={16}
                  value={draft.fontSize}
                  onChange={(e) => update({ fontSize: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--secondary))] mt-2"
                />
              </div>
            </div>
            <div>
              <span className={labelClass}>Print margins (mm)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["top", "right", "bottom", "left"] as const).map((side) => (
                  <div key={side}>
                    <label className="text-[11px] text-muted-foreground capitalize block mb-1" htmlFor={`m-${side}`}>
                      {side}
                    </label>
                    <input
                      id={`m-${side}`}
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      className={inputClass}
                      value={draft.margins[side]}
                      onChange={(e) => setMargin(side, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <LineSection title="Top section" lines={draft.topLines} onChange={(lines) => updateSection("topLines", lines)} />
          <LineSection title="Order details" lines={draft.lines} onChange={(lines) => updateSection("lines", lines)} />
          <LineSection title="Bottom section" lines={draft.bottomLines} onChange={(lines) => updateSection("bottomLines", lines)} showDate />
        </div>

        {/* Live Preview Pane */}
        <aside className="lg:sticky lg:top-4 self-start space-y-4">
          <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Live Preview</h3>
              {dirty && <span className="text-xs text-secondary font-medium">Unsaved changes</span>}
            </div>
            <div>
              <label className={labelClass} htmlFor="p-order">
                Preview with order
              </label>
              <select
                id="p-order"
                className={inputClass}
                value={previewOrder?.orderId ?? ""}
                onChange={(e) => setPreviewOrderId(e.target.value)}
              >
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    #{o.orderId} — {o.customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl bg-muted p-4 overflow-auto max-h-[60vh] flex justify-center">
              <style>{BILL_CSS}</style>
              <div
                className="bg-background shadow-md rounded-sm px-2 [&_.bill]:!bg-transparent"
                style={{ background: "white" }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleSave} disabled={(!dirty && !isNew) || isSaving}>
                {isSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                Save
              </Button>
              <Button
                variant="outline"
                disabled={!previewOrder}
                onClick={() => previewOrder && printBill(draft, previewOrder)}
              >
                <Printer size={14} className="mr-1.5" />
                Test Print
              </Button>
              <Button
                variant="outline"
                disabled={isNew || Boolean(draft.isDefault)}
                onClick={handleSetDefault}
              >
                <Star size={14} className="mr-1.5" />
                Set Default
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isNew || isDeleting}
              >
                {isDeleting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Trash2 size={14} className="mr-1.5" />}
                Delete
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default BillTemplateEditor;
