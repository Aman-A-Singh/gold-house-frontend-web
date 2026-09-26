import { Order } from "@/models/order";

type Typography = { fontSize?: number; bold?: boolean };
export type BillLine =
  | ({ id: string; type: "field"; label: string; field: OrderFieldKey; valueSize?: number; valueBold?: boolean } & Typography)
  | ({ id: string; type: "text"; text: string; align: "left" | "center" | "right" } & Typography)
  | { id: string; type: "divider"; style: "dashed" | "solid" | "double" }
  | { id: string; type: "spacer" }
  | ({ id: string; type: "printedAt"; align: "left" | "center" | "right" } & Typography);

export type BillTemplate = {
  id: string;
  name: string;
  paperWidth: 58 | 80; // mm
  fontSize: number; // px
  topLines: BillLine[];
  lines: BillLine[];
  bottomLines: BillLine[];
  margins: BillMargins; // mm
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BillTemplateRequestDTO = {
  name: string;
  paperWidth: 58 | 80;
  fontSize: number;
  margins: BillMargins;
  topLines: BillLine[];
  lines: BillLine[];
  bottomLines: BillLine[];
  isDefault?: boolean;
};

export type BillMargins = { top: number; right: number; bottom: number; left: number };
export const DEFAULT_MARGINS: BillMargins = { top: 2, right: 0, bottom: 2, left: 0 };
const mm = (n: unknown, f: number) => { const v = Number(n); return Number.isFinite(v) ? Math.min(30, Math.max(0, v)) : f; };

export const MAX_TEMPLATES = 5;

export const ORDER_FIELDS = {
  id: { label: "Order ID", get: (o: Order) => o.orderId },
  customer: { label: "Customer Name", get: (o: Order) => o.customer?.name ?? "—" },
  phone: { label: "Phone", get: (o: Order) => o.customer?.phoneNumber?.toString() || "—" },
  date: { label: "Order Date", get: (o: Order) => o.orderDate },
  expectedDelivery: { label: "Expected Delivery", get: (o: Order) => o.deliverDate?.toString() || "—" },
  status: { label: "Status", get: (o: Order) => o.orderStatus },
  weight: { label: "Weight", get: (o: Order) => `${o.weight} g` },
  result: { label: "Result", get: (o: Order) => o.result?.toString() || "0" },
  stampNo: { label: "Stamp No", get: (o: Order) => o.stampNo?.toString() || "—" },
  wastage: { label: "Wastage", get: (o: Order) => o.wastage != null ? `${o.wastage} g` : "—" },

} satisfies Record<string, { label: string; get: (o: Order) => string }>;

export type OrderFieldKey = keyof typeof ORDER_FIELDS;

export const dummyOrder: Order = {
  orderId: "#ORDXXX",
  customer: {
    id: 1,
    name: "Customer Name",
    phoneNumber: 91000000000,
  },
  weight: 12.5,
  result: 11.8,
  orderDate: new Date().toISOString().split("T")[0],
  orderTime: "14:30",
  deliverDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
  deliverTime: "18:00",
  orderStatus: "PENDING",
  stampNo: 1,
  wastage: 0.7,
};

export const dummyOrders: Order[] = [
  dummyOrder,
  {
    orderId: "1002",
    customer: {
      id: 2,
      name: "Fatima Noor",
      phoneNumber: 923219876543,
    },
    weight: 25.0,
    result: 23.5,
    orderDate: new Date().toISOString().split("T")[0],
    orderTime: "11:15",
    deliverDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    deliverTime: "16:00",
    orderStatus: "DELIVERED",
    stampNo: 2,
    wastage: 1.5,
  },
];

export const DUMMY_ORDER = dummyOrder;
export const DUMMY_ORDERS = dummyOrders;

export const uid = () => Math.random().toString(36).slice(2, 10);



// ---------- rendering ----------
const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
const size = (n: number | undefined, fallback: number) => Math.min(24, Math.max(8, Number.isFinite(n) ? Math.round(n as number) : fallback));
const typography = (fontSize: number | undefined, bold: boolean | undefined, fallback: number) =>
  `font-size:${size(fontSize, fallback)}px;font-weight:${bold ? 700 : 400}`;

export function renderBillBody(t: BillTemplate | null | undefined, o: Order | null | undefined): string {
  if (!t || !o) return "";
  const renderLines = (lines: BillLine[]) => (lines ?? []).map((l) => {
    switch (l.type) {
      case "field": {
        const value = ORDER_FIELDS[l.field]?.get(o) ?? "—";
        return `<div class="row"><span class="k" style="${typography(l.fontSize, l.bold, t.fontSize)}">${esc(l.label)}</span><span class="c">:</span><span class="v" style="${typography(l.valueSize, l.valueBold, t.fontSize)}">${esc(value)}</span></div>`;
      }
      case "text":
        return `<div style="text-align:${["left", "center", "right"].includes(l.align) ? l.align : "left"};${typography(l.fontSize, l.bold, t.fontSize)}">${esc(l.text)}</div>`;
      case "printedAt":
        return `<div style="text-align:${["left", "center", "right"].includes(l.align) ? l.align : "center"};${typography(l.fontSize, l.bold, 10)}">${esc(new Date().toLocaleString())}</div>`;
      case "divider":
        return `<div class="hr ${["solid", "double", "dashed"].includes(l.style) ? l.style : "dashed"}"></div>`;
      case "spacer":
        return `<div style="height:0.8em"></div>`;
    }
  }).join("");
  const m = t.margins ?? DEFAULT_MARGINS;
  return `<div class="bill" style="width:${t.paperWidth === 58 ? 48 : 72}mm;padding:${mm(m?.top, 2)}mm ${mm(m?.right, 0)}mm ${mm(m?.bottom, 2)}mm ${mm(m?.left, 0)}mm;font-size:${size(t.fontSize, 12)}px">
    ${renderLines(t.topLines ?? [])}
    ${renderLines(t.lines ?? [])}
    ${renderLines(t.bottomLines ?? [])}
  </div>`;
}

export const BILL_CSS = `.bill{font-family:'Courier New',monospace;color:#000;background:#fff;line-height:1.35;box-sizing:border-box;margin:0 auto;overflow-wrap:anywhere}
.bill .row{display:flex;gap:5px;align-items:baseline}.bill .row>span{min-width:0}
.bill .row .k{flex:0 0 50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bill .row .c{flex:0 0 auto}
.bill .row .v{flex:1 1 auto;text-align:left;overflow-wrap:anywhere}
.bill .hr{margin:.4em 0}.bill .hr.dashed{border-top:1px dashed #000}.bill .hr.solid{border-top:1px solid #000}.bill .hr.double{border-top:3px double #000}`;

export function printBill(t: BillTemplate | null | undefined, o: Order | null | undefined) {
  if (!t || !o) return;
  const w = window.open("", "_blank", "width=420,height=700");
  if (!w) return;
  w.document.write(`<html><head><title>Bill #${esc(o.orderId)}</title><style>@page{size:${t.paperWidth}mm auto;margin:0}body{margin:0}${BILL_CSS}</style></head><body>${renderBillBody(t, o)}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 200);
}
