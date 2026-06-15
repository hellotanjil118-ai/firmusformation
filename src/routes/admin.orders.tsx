import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Search, X, Save, LayoutGrid, List } from "lucide-react";
import { ORDER_STATUSES, STATUS_LABEL, STATUS_COLOR, DEFAULT_STAGES, type OrderStatus } from "@/lib/orderConstants";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Admin — Orders" }, { name: "robots", content: "noindex" }] }),
  component: OrdersAdmin,
});

type Client = { id: string; name: string; email: string };
type Order = {
  id: string;
  client_id: string;
  package_name: string;
  price: number;
  currency: string;
  status: OrderStatus;
  due_at: string | null;
  created_at: string;
  client?: Client;
};

const BOARD_STAGES: OrderStatus[] = ["pending", "in_progress", "waiting_documents", "under_review", "completed", "delivered"];

function OrdersAdmin() {
  const [items, setItems] = useState<Order[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"board" | "table">("board");
  const [dragging, setDragging] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ client_id: "", package_name: "", price: "0", currency: "USD", status: "pending" as OrderStatus, notes: "", due_at: "" });
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, client:clients(id,name,email)")
      .order("created_at", { ascending: false });
    setItems((data as unknown as Order[]) ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("clients").select("id,name,email").order("name").then(({ data }) => setClients((data as Client[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    return items.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        return o.package_name.toLowerCase().includes(s) || (o.client?.name ?? "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [items, q, statusFilter]);

  const moveOrder = async (orderId: string, status: OrderStatus) => {
    const prev = items;
    setItems((cur) => cur?.map((o) => (o.id === orderId ? { ...o, status } : o)) ?? null);
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      setItems(prev);
      toast.error(error.message);
    } else {
      toast.success(`Moved to ${STATUS_LABEL[status]}`);
    }
  };

  const createOrder = async () => {
    if (!draft.client_id || !draft.package_name) { setErr("Client and package are required"); return; }
    setErr(null);
    const { data: order, error } = await supabase.from("orders").insert({
      client_id: draft.client_id,
      package_name: draft.package_name,
      price: Number(draft.price) || 0,
      currency: draft.currency || "USD",
      status: draft.status,
      notes: draft.notes || null,
      due_at: draft.due_at || null,
      started_at: new Date().toISOString(),
    }).select().single();
    if (error || !order) { setErr(error?.message ?? "Failed"); return; }
    await supabase.from("order_stages").insert(
      DEFAULT_STAGES.map((name, i) => ({ order_id: order.id, name, order_index: i, status: "pending" }))
    );
    setCreating(false);
    setDraft({ client_id: "", package_name: "", price: "0", currency: "USD", status: "pending", notes: "", due_at: "" });
    load();
  };

  return (
    <AdminShell title="Orders">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by package or client" className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm" />
        </div>
        {view === "table" && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        )}
        <div className="inline-flex rounded-md border border-input bg-background p-0.5 text-xs">
          <button onClick={() => setView("board")} className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 ${view === "board" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}><LayoutGrid size={13} /> Board</button>
          <button onClick={() => setView("table")} className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 ${view === "table" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}><List size={13} /> Table</button>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          <Plus size={14} /> New Order
        </button>
      </div>

      {filtered === null ? <Loader2 className="animate-spin" /> : view === "board" ? (
        <div className="grid grid-cols-1 gap-3 overflow-x-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {BOARD_STAGES.map((stage) => {
            const stageOrders = filtered.filter((o) => o.status === stage);
            const total = stageOrders.reduce((sum, o) => sum + Number(o.price || 0), 0);
            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragging) { moveOrder(dragging, stage); setDragging(null); } }}
                className="flex min-h-[300px] flex-col rounded-xl border border-border bg-secondary/30 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{STATUS_LABEL[stage]}</h3>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium">{stageOrders.length}</span>
                </div>
                <p className="mb-3 text-[11px] text-muted-foreground">${total.toLocaleString()}</p>
                <div className="flex-1 space-y-2">
                  {stageOrders.map((o) => (
                    <Link
                      key={o.id}
                      to="/admin/orders/$id"
                      params={{ id: o.id }}
                      draggable
                      onDragStart={() => setDragging(o.id)}
                      onDragEnd={() => setDragging(null)}
                      className={`block cursor-grab rounded-lg border border-border bg-card p-3 text-xs shadow-sm transition hover:border-primary ${dragging === o.id ? "opacity-40" : ""}`}
                    >
                      <p className="line-clamp-2 text-sm font-medium">{o.package_name}</p>
                      <p className="mt-1 text-muted-foreground">{o.client?.name ?? "—"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold">{o.currency} {Number(o.price).toFixed(0)}</span>
                        {o.due_at && <span className="text-[10px] text-muted-foreground">Due {new Date(o.due_at).toLocaleDateString()}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No orders found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="hover:text-primary">{o.package_name}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.client?.name ?? "—"}</td>
                  <td className="px-4 py-3">{o.currency} {Number(o.price).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{o.due_at ? new Date(o.due_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="rounded-md border border-input px-3 py-1 text-xs hover:bg-secondary">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setCreating(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">New Order</h2>
              <button onClick={() => setCreating(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Client *</label>
                <select value={draft.client_id} onChange={(e) => setDraft({ ...draft, client_id: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— Select client —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Package / Service *</label>
                <input value={draft.package_name} onChange={(e) => setDraft({ ...draft, package_name: e.target.value })} placeholder="e.g. Amazon FBA A-Z" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Price</label>
                  <input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Currency</label>
                  <input value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Due Date</label>
                  <input type="date" value={draft.due_at} onChange={(e) => setDraft({ ...draft, due_at: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as OrderStatus })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">5 default stages (LLC → EIN → Seller Central → Listing → Launch) will be created. Customize them after.</p>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <button onClick={createOrder} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
                <Save size={14} /> Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
