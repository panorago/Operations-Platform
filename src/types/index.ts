import type { ReactNode } from "react";
export type Role = "Admin" | "Operations" | "Finance";
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Invited";
}
export interface Supplier {
  id: string;
  name: string;
  category: string;
  color: string;
  creditLimit: number;
  creditUsed: number;
  contactEmail: string;
  phone: string;
  trucks: string[];
}
export interface Product {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
  weeklyAvgSales: number;
  updatedAt: string;
}
export interface Truck {
  id: string;
  supplierId: string;
  name: string;
  departed: string;
  eta: string;
  progress: number;
  driver: string;
  plate: string;
  speed: number;
  route: string;
  lat: number;
  lng: number;
  delayed: boolean;
  delayReason?: string;
}
export interface Reminder {
  channelDelivery?: Partial<
    Record<
      "email" | "sms",
      {
        status: "Accepted" | "Blocked" | "Failed";
        detail: string;
        at: string;
        providerId?: string;
      }
    >
  >;
  days: number;
  sent: boolean;
  sentAt: string | null;
  channels: ("email" | "sms" | "inapp")[];
  delivery: "Pending" | "In-app delivered" | "Cancelled";
}
export interface CreditPolicy {
  enabled: boolean;
  annualRate: number;
  graceDays: number;
}
export interface ActivityEvent {
  id: string;
  type: "order" | "payment" | "delivery" | "system";
  title: string;
  description: string;
  timestamp: string;
  entityId: string;
  amount?: number;
}
export interface MonitorIssue {
  id: string;
  kind: "Stock" | "Credit" | "Delivery";
  severity: "critical" | "warning";
  title: string;
  detail: string;
  action: string;
  entityId: string;
  quantity?: number;
}
export interface MonitorState {
  providerReady: boolean;
  providerConfigured: boolean;
  automatic: boolean;
  status: "local" | "watching" | "analyzing" | "error" | "paused";
  summary: string | null;
  checkedAt: string;
  analyzedAt?: string;
  error?: string;
  issues: MonitorIssue[];
}
export interface Invoice {
  credit?: { annualRate: number; graceDays: number; issuedDate: string };
  paidAmount?: number;
  paymentReference?: string;
  bankName?: string;
  receiptId?: string;
  id: string;
  supplierId: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
  paymentMethod?: string;
  reminders: Reminder[];
  overduePing: boolean;
  lastPing?: string;
}
export type OrderStatus =
  "Pending" | "Processing" | "Dispatched" | "Delivered" | "Cancelled";
export interface CartItem {
  productId: string;
  qty: number;
  credit: boolean;
}
export interface Order {
  paymentReference?: string;
  bankName?: string;
  truckId?: string;
  id: string;
  invoiceId?: string;
  supplierId: string;
  items: CartItem[];
  total: number;
  date: string;
  status: OrderStatus;
  paymentMode: "pay" | "credit";
  paymentMethod: string;
  terms: number;
}
export interface Alert {
  id: string;
  type: "Stock" | "Credit" | "Delivery" | "System";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  route: string;
  entityId?: string;
}
export interface Settings {
  creditPolicy?: CreditPolicy;
  monitoring?: { enabled: boolean; intervalMinutes: number };
  company: { name: string; address: string; phone: string; email: string };
  notifications: Record<
    string,
    { email: boolean; sms: boolean; inapp: boolean }
  >;
  thresholds: number[];
  dailyPings: boolean;
  suspendCredit: boolean;
}
export interface AppState {
  activity?: ActivityEvent[];
  suppliers: Supplier[];
  products: Product[];
  trucks: Truck[];
  invoices: Invoice[];
  orders: Order[];
  alerts: Alert[];
  settings: Settings;
}
export type Command =
  | {
      type: "checkout";
      items: CartItem[];
      mode: "pay" | "credit";
      method: string;
      terms: number;
      quotedAnnualRate?: number;
      quotedGraceDays?: number;
      paymentReference?: string;
      bankName?: string;
    }
  | {
      type: "payInvoice";
      id: string;
      method: string;
      paymentDate?: string;
      paymentReference?: string;
      bankName?: string;
    }
  | { type: "readAlert"; id: string }
  | { type: "readAll" }
  | { type: "saveSettings"; settings: Settings }
  | { type: "saveSupplier"; supplier: Supplier }
  | { type: "orderStatus"; id: string; status: OrderStatus }
  | { type: "triggerReminders" };

export interface Store extends AppState {
  loaded: boolean;
  user: User | null;
  needsSetup: boolean;
  setupProtected: boolean;
  authChecked: boolean;
  activeSupplier: string;
  selectedTruck: string;
  aiSuggestion: string | null;
  aiHidden: boolean;
  users: User[];
  refresh: () => Promise<void>;
  checkAuth: () => Promise<void>;
  command: (c: Command) => Promise<boolean>;
  setActiveSupplier: (id: string) => void;
  setSelectedTruck: (id: string) => void;
  setAiSuggestion: (s: string | null) => void;
  clearAiSuggestion: () => void;
  loadUsers: () => Promise<void>;
  getBySupplier: (id: string) => AppState["products"];
  getAlerts: () => AppState["products"];
  getOverdue: () => AppState["invoices"];
  getDueSoon: () => AppState["invoices"];
  markPaid: (id: string) => Promise<boolean>;
  triggerReminders: () => Promise<boolean>;
  markRead: (id: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
  getUnread: () => AppState["alerts"];
  startSimulation: () => () => void;
  simulationRunning: boolean;
  simulationSpeed: number;

  setSimulationRunning: (running: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  resetFleet: () => void;
  monitor: MonitorState | null;
  monitorBusy: boolean;
  refreshMonitor: () => Promise<void>;
  runAnalysis: () => Promise<void>;
}
export interface CartStore {
  items: CartItem[];
  paymentMode: "pay" | "credit";
  addItem: (id: string, credit?: boolean, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totals: () => { subtotal: number; vat: number; total: number };
}

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

export type DeliveryOutcome = {
  status: "Accepted" | "Blocked" | "Failed";
  detail: string;
  providerId?: string;
};
export interface ProviderConfig {
  resendKey?: string;
  emailFrom?: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioAuthorization?: string;
  smsFrom?: string;
  emailTo?: string;
  smsTo?: string;
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface SelectProps {
  value: string | number;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  className?: string;
  placeholder?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
}
export interface PaymentCompletion {
  id: string;
  title: string;
  amount: number;
  interest: number;
  method: string;
  reference: string;
  bank: string;
  date: string;
  documentIds: string[];
  supplierNames: string[];
}
