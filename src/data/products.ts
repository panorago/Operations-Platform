import { suppliers } from "./suppliers";
import type { Product } from "../types";
const groups: [string, number, number, number][][] = [
  [
    ["Fresh Milk 2L", 1.8, 84, 40],
    ["Skim Milk 1L", 1.1, 60, 30],
    ["Cheddar Slices 200g", 3.2, 18, 24],
    ["Full Cream Yoghurt", 2.1, 45, 20],
    ["Unsalted Butter 250g", 2.6, 52, 25],
    ["Cream Cheese 180g", 4.5, 30, 15],
  ],
  [
    ["Roller Meal 10kg", 4.7, 0, 15],
    ["Spaghetti 500g", 1.2, 88, 30],
    ["Wheat Flour 2kg", 1.8, 64, 30],
    ["Sugar 2kg", 1.6, 72, 30],
    ["Iodated Salt 500g", 0.6, 12, 20],
    ["Maize Porridge 1kg", 1.3, 44, 20],
  ],
  [
    ["Cooking Oil 2L", 3.9, 7, 25],
    ["Laundry Soap 750g", 1.1, 38, 30],
    ["Dishwash Liquid 500ml", 1.4, 29, 20],
    ["Cooking Margarine 500g", 2.2, 41, 20],
  ],
  [
    ["Sliced Bread 700g", 1, 11, 30],
    ["Whole Wheat Loaf", 1.2, 26, 20],
    ["Burger Buns 6pk", 1.5, 34, 15],
    ["Teacakes 6pk", 1.3, 20, 15],
  ],
  [
    ["Toothpaste 100ml", 1.8, 55, 20],
    ["Shampoo 400ml", 2.5, 40, 15],
    ["Body Lotion 200ml", 2.2, 33, 15],
    ["Washing Powder 2kg", 3.6, 9, 20],
    ["Toilet Paper 9pk", 4.2, 48, 15],
  ],
  [
    ["Mazoe Orange 2L", 3.2, 0, 20],
    ["Mazoe Raspberry 2L", 3.2, 56, 20],
    ["Mazoe Blackcurrant 2L", 3.2, 38, 20],
    ["Sparkling Water 1.5L", 0.9, 66, 25],
  ],
];
export const products: Product[] = groups.flatMap((rows, i) =>
  rows.map(([name, price, stock, reorderLevel], j) => ({
    id: `prod-${i + 1}-${j + 1}`,
    name,
    price,
    stock,
    reorderLevel,
    supplierId: suppliers[i].id,
    supplierName: suppliers[i].name,
    category: suppliers[i].category,
    weeklyAvgSales: Math.round(reorderLevel * 1.4),
    updatedAt: "2026-11-03T07:00:00+02:00",
  })),
);
