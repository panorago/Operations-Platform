import atlas from "../../assets/product-atlas.png";
import { products } from "../../data/products";
import type { Product } from "../../types";
export default function ProductImage({ product }: { product: Product }) {
  const index = Math.max(
    0,
    products.findIndex((p) => p.id === product.id),
  );
  const column = index % 6,
    row = Math.floor(index / 6);
  return (
    <svg
      role="img"
      aria-label={`${product.name} — illustrative product photograph`}
      viewBox={`${column * 100} ${row * 100} 100 100`}
      className="h-full w-full overflow-hidden"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        {product.name} · illustrative image; supplier packaging may vary
      </title>
      <image href={atlas} width="600" height="500" preserveAspectRatio="none" />
    </svg>
  );
}
