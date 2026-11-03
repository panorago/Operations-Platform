import {
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  ClipboardList,
  Package,
  CreditCard,
  Bell,
  Settings,
} from "lucide-react";
export const links = [
  {
    path: "dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    group: "MAIN",
  },
  {
    path: "tracking",
    label: "Live tracking",
    icon: MapPin,
    group: "OPERATIONS",
  },
  { path: "catalogue", label: "Supplier catalogue", icon: ShoppingBag },
  { path: "orders", label: "Orders", icon: ClipboardList },
  { path: "inventory", label: "Inventory", icon: Package },
  { path: "credits", label: "Credit & payments", icon: CreditCard },
  {
    path: "alerts",
    label: "Alerts & reminders",
    icon: Bell,
    group: "ACCOUNT",
  },
  { path: "settings", label: "Settings", icon: Settings },
];
