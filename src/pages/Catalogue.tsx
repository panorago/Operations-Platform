import { useState } from "react";
import {
  ShoppingBag,
  Milk,
  Wheat,
  Droplets,
  Croissant,
  Sparkles,
  Wine,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore, useCartStore } from "../store";
import { Badge, Button, EmptyState, StatusDot } from "../components/ui";
import { money, stockStatus, supplierStatus, orderTotals } from "../lib/utils";
import PaymentModal from "../components/modules/PaymentModal";
const icons = [Milk, Wheat, Droplets, Croissant, Sparkles, Wine];
export default function Catalogue() {
  const s = useAppStore(),
    cart = useCartStore();
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("name"),
    [categories, setCategories] = useState<string[]>([]),
    [inStock, setInStock] = useState(false),
    [price, setPrice] = useState(15),
    [checkout, setCheckout] = useState<"pay" | "credit" | null>(null);
  const rows = s.products
    .filter(
      (p) =>
        (s.activeSupplier === "all" || p.supplierId === s.activeSupplier) &&
        (!categories.length || categories.includes(p.category)) &&
        (!inStock || p.stock > 0) &&
        p.price <= price &&
        `${p.name} ${p.supplierName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "priceAsc"
        ? a.price - b.price
        : sort === "priceDesc"
          ? b.price - a.price
          : a.name.localeCompare(b.name),
    );
  const totals = cart.totals();
  const affected = s.suppliers.filter((p) =>
    cart.items.some(
      (i) =>
        s.products.find((pr) => pr.id === i.productId)?.supplierId === p.id,
    ),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">SOURCING MADE SIMPLE</p>
          <h1>Supplier catalogue</h1>
          <p className="subtext">
            Trusted partners. Better shelves. Everything your store needs.
          </p>
        </div>
        <Badge variant="success">
          {s.products.length} products · {s.suppliers.length} suppliers
        </Badge>
      </div>
      <div className="grid grid-cols-[170px_1fr_210px] gap-4">
        <aside className="panel h-fit p-3">
          <p className="eyebrow mb-3">SUPPLIER</p>
          <button
            aria-label="All suppliers"
            onClick={() => s.setActiveSupplier("all")}
            className={`mb-1 w-full rounded px-2 py-2 text-left ${s.activeSupplier === "all" ? "bg-noir text-gold" : "text-muted"}`}
          >
            All suppliers
          </button>
          {s.suppliers.map((p) => (
            <button
              aria-label={`Filter ${p.name}`}
              key={p.id}
              onClick={() => s.setActiveSupplier(p.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-2.5 text-left text-sm ${s.activeSupplier === p.id ? "bg-gold/10 text-gold" : "text-muted hover:bg-ivory"}`}
            >
              <StatusDot status={supplierStatus(p, s.invoices)} />
              {p.name}
            </button>
          ))}
          <p className="eyebrow mb-3 mt-6">CATEGORY</p>
          {[...new Set(s.suppliers.map((p) => p.category))].map((c) => (
            <label
              key={c}
              className="mb-3 flex items-center gap-2 text-sm text-muted"
            >
              <input
                type="checkbox"
                checked={categories.includes(c)}
                onChange={() =>
                  setCategories(
                    categories.includes(c)
                      ? categories.filter((x) => x !== c)
                      : [...categories, c],
                  )
                }
              />
              {c}
            </label>
          ))}
          <p className="eyebrow mb-3 mt-6">AVAILABILITY</p>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            In stock only
          </label>
          <p className="eyebrow mb-3 mt-6">PRICE RANGE</p>
          <input
            aria-label="Maximum unit price"
            type="range"
            min="0"
            max="15"
            step="0.1"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>$0.00</span>
            <span>{money(price)}</span>
          </div>
          <p className="mt-6 rounded bg-ivory p-2 text-xs leading-5 text-muted">
            Stock figures are FreshMark shelf levels. Supplier availability is
            confirmed after ordering.
          </p>
        </aside>
        <section className="min-w-0">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                aria-hidden
                size={13}
                className="absolute left-3 top-2.5 text-muted"
              />
              <input
                aria-label="Search products"
                placeholder="Search products or suppliers…"
                className="w-full pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Name A–Z</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
            </select>
            <Badge>{rows.length} items</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {rows.map((p) => {
              const Icon =
                icons[Number(p.supplierId.split("-")[1]) - 1] || ShoppingBag;
              const item = cart.items.find((i) => i.productId === p.id);
              return (
                <article className="panel overflow-hidden" key={p.id}>
                  <div className="relative flex h-[104px] items-center justify-center bg-ivory/80">
                    <Icon
                      aria-hidden
                      size={35}
                      strokeWidth={1}
                      className="text-gold"
                    />
                    <span className="absolute left-3 top-3 text-[8px] uppercase tracking-widest text-muted">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-base" title={p.name}>
                      {p.name}
                    </h3>
                    <p className="mb-2 mt-1 truncate text-xs text-muted">
                      {p.supplierName}
                    </p>
                    <Badge
                      variant={
                        p.stock === 0
                          ? "danger"
                          : p.stock <= p.reorderLevel
                            ? "warning"
                            : "success"
                      }
                    >
                      {stockStatus(p)}
                    </Badge>
                    <p className="mb-3 mt-3 text-xl">
                      {money(p.price)}{" "}
                      <span className="text-xs text-muted">/ unit</span>
                    </p>
                    {item ? (
                      <div className="flex h-8 items-center justify-between rounded bg-ivory">
                        <button
                          aria-label={`Decrease ${p.name}`}
                          className="p-2"
                          onClick={() => cart.updateQty(p.id, item.qty - 1)}
                        >
                          <Minus aria-hidden size={12} />
                        </button>
                        <span>{item.qty} in order</span>
                        <button
                          aria-label={`Increase ${p.name}`}
                          className="p-2"
                          onClick={() => cart.updateQty(p.id, item.qty + 1)}
                        >
                          <Plus aria-hidden size={12} />
                        </button>
                      </div>
                    ) : (
                      <Button
                        className="w-full px-2"
                        aria-label={`Add ${p.name} to order`}
                        onClick={() => {
                          cart.addItem(p.id);
                          toast.success("Added to order");
                        }}
                      >
                        Add to order <Plus aria-hidden size={11} />
                      </Button>
                    )}
                    <button
                      aria-label={`Order ${p.name} on credit`}
                      onClick={() => {
                        cart.addItem(p.id, true);
                        toast.success("Added for credit checkout");
                      }}
                      className="mt-2 w-full py-1 text-xs text-gold"
                    >
                      On credit{" "}
                      <ArrowUpRight aria-hidden className="inline" size={10} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {!rows.length && <EmptyState title="No matching products" />}
        </section>
        <aside className="panel sticky top-0 flex max-h-[calc(100vh-195px)] flex-col self-start">
          <header className="flex items-center justify-between border-b-[0.5px] border-edge p-3">
            <h3>Current order</h3>
            <Badge variant="gold">
              {cart.items.reduce((n, i) => n + i.qty, 0)}
            </Badge>
          </header>
          <div className="min-h-28 flex-1 overflow-y-auto px-3">
            {!cart.items.length ? (
              <EmptyState
                title="Your order is empty"
                description="Add products from the catalogue."
              />
            ) : (
              cart.items.map((i) => {
                const p = s.products.find((p) => p.id === i.productId);
                if (!p) return null;
                return (
                  <div
                    key={i.productId}
                    className="group border-b-[0.5px] border-edge py-3"
                  >
                    <div className="flex justify-between gap-1">
                      <span>{p.name}</span>
                      <button
                        aria-label={`Remove ${p.name}`}
                        onClick={() => cart.removeItem(p.id)}
                        className="text-muted opacity-0 focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 aria-hidden size={11} />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {p.supplierName}
                      {i.credit ? " · credit" : ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded border-[0.5px] border-edge">
                        <button
                          aria-label={`Reduce cart ${p.name}`}
                          className="p-1"
                          onClick={() => cart.updateQty(p.id, i.qty - 1)}
                        >
                          <Minus aria-hidden size={10} />
                        </button>
                        <span>{i.qty}</span>
                        <button
                          aria-label={`Add cart ${p.name}`}
                          className="p-1"
                          onClick={() => cart.updateQty(p.id, i.qty + 1)}
                        >
                          <Plus aria-hidden size={10} />
                        </button>
                      </div>
                      <span>{money(p.price * i.qty)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="space-y-3 border-t-[0.5px] border-edge p-3">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>VAT (15%)</span>
              <span>{money(totals.vat)}</span>
            </div>
            <div className="flex justify-between border-t-[0.5px] border-edge pt-3 text-lg">
              <span>Total</span>
              <span>{money(totals.total)}</span>
            </div>
            <Button
              disabled={!cart.items.length}
              className="w-full"
              onClick={() => setCheckout("pay")}
            >
              Pay now
            </Button>
            <Button
              disabled={!cart.items.length}
              variant="secondary"
              className="w-full"
              onClick={() => setCheckout("credit")}
            >
              Shop on credit
            </Button>
            {affected.map((p) => (
              <div
                className="rounded bg-ivory p-2 text-xs leading-5 text-muted"
                key={p.id}
              >
                <p className="text-noir">{p.name}</p>Limit:{" "}
                {money(p.creditLimit)}
                <br />
                Used: {money(p.creditUsed)}
                <br />
                Available: {money(Math.max(0, p.creditLimit - p.creditUsed))}
                <br />
                After order:{" "}
                {money(
                  Math.max(
                    0,
                    p.creditLimit -
                      p.creditUsed -
                      orderTotals(
                        cart.items.filter(
                          (i) =>
                            s.products.find((pr) => pr.id === i.productId)
                              ?.supplierId === p.id,
                        ),
                        s.products,
                      ).total,
                  ),
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
      {checkout && (
        <PaymentModal mode={checkout} onClose={() => setCheckout(null)} />
      )}
    </>
  );
}
