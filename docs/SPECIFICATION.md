# VENDA — FreshMark Operations Intelligence Platform
# Full-stack web application — build the complete project

## PROJECT OVERVIEW
Build VENDA, a premium B2B retail operations management web app for
FreshMark Retail Zimbabwe. The app manages logistics (live truck
tracking), supplier ordering (e-commerce style), inventory management,
and credit/payment tracking. This is a real, fully functional
application — not a prototype.

---

## TECH STACK
- React 18 + TypeScript (strict mode)
- Vite (build tool)
- React Router v6 (client-side routing)
- Zustand (global state)
- TailwindCSS v3 (styling — utility classes only, no inline styles)
- Recharts (charts and graphs)
- Leaflet + react-leaflet (interactive map for truck tracking)
- Lucide React (icons throughout)
- Axios (API calls)
- date-fns (date formatting)
- React Hot Toast (notifications)

---

## FOLDER STRUCTURE
src/
  components/
    ui/           # Reusable primitives
    layout/       # Sidebar, Topbar, Shell
    modules/      # Feature-specific components
  pages/          # One file per route
  store/          # Zustand stores
  data/           # Mock data (seeds)
  hooks/          # Custom hooks
  lib/            # Utilities, API client
  types/          # TypeScript interfaces
  styles/         # globals.css

---

## DESIGN SYSTEM — ENFORCE EVERYWHERE

### Colours (add to tailwind.config.js as custom tokens)
noir:    #1C1C2E   → bg-noir, text-noir, border-noir
gold:    #C9933A   → bg-gold, text-gold, border-gold
ivory:   #F8F6F1   → bg-ivory (page background)
surface: #FFFFFF   → bg-surface (cards, panels)
border:  #E2DDD6   → border-edge (0.5px only — never 1px)
muted:   #6B6B7B   → text-muted
success: #2D7A4F   → text-success, bg-success-tint
danger:  #C0392B   → text-danger, bg-danger-tint
warning: #C9933A   → (reuse gold)

### Typography
Font: Inter (import from Google Fonts)
Weights: 400 (regular) and 500 (medium) ONLY — never 600 or 700
Sizes: 22px h1, 18px h2, 13px h3, 11px body, 10px label, 9px caption

### Spacing & Shape
Border radius: rounded-xl (10px) for cards, rounded (6px) for inputs/buttons
Borders: always border-[0.5px] border-edge — never border or border-2
Shadows: NONE — flat design throughout
Sidebar width: 200px fixed
Topbar height: 48px fixed

### Component Rules
- Status dots: w-1.5 h-1.5 rounded-full
  green = #2D7A4F, amber = #C9933A, red = #C0392B
- Progress bars: h-1 rounded-full bg-edge overflow-hidden
- Pills/badges: text-[9px] px-1.5 py-0.5 rounded-full font-medium
- Metric cards: bg-surface border-[0.5px] border-edge rounded-xl p-3
- Tables: text-[11px], border-b border-[#F0EBE3] on rows
- Buttons primary: bg-noir text-gold rounded px-4 py-2 text-[11px] font-medium
- Buttons secondary: border-[0.5px] border-edge text-muted rounded px-4 py-2 text-[11px]
- Buttons destructive: bg-danger text-white rounded px-4 py-2 text-[11px]
- Active nav item: border-l-2 border-gold bg-gold/[0.08] text-gold

---

## DATA LAYER — src/data/

### suppliers.ts — 6 suppliers
[
  { id: "sup-1", name: "Dairiboard Foods Ltd", category: "Dairy",
    color: "#2D7A4F", creditLimit: 5000, creditUsed: 2800,
    contactEmail: "orders@dairiboard.co.zw", phone: "+263 4 700 000",
    trucks: ["ZW-01", "ZW-07"] },

  { id: "sup-2", name: "National Foods Ltd", category: "Staples",
    color: "#2D7A4F", creditLimit: 4000, creditUsed: 1200,
    contactEmail: "sales@nationalfoods.co.zw", phone: "+263 4 621 000",
    trucks: ["ZW-02", "ZW-08"] },

  { id: "sup-3", name: "Olivine Industries Ltd", category: "Oils and Soap",
    color: "#C9933A", creditLimit: 3000, creditUsed: 3200,
    contactEmail: "orders@olivine.co.zw", phone: "+263 4 480 000",
    trucks: ["ZW-03"] },

  { id: "sup-4", name: "Lobels Bread Ltd", category: "Bakery",
    color: "#2D7A4F", creditLimit: 2500, creditUsed: 800,
    contactEmail: "orders@lobels.co.zw", phone: "+263 4 302 000",
    trucks: ["ZW-04"] },

  { id: "sup-5", name: "ProBrands Ltd", category: "Household",
    color: "#C9933A", creditLimit: 4500, creditUsed: 4200,
    contactEmail: "trade@probrands.co.zw", phone: "+263 4 440 000",
    trucks: ["ZW-05"] },

  { id: "sup-6", name: "Mazoe Beverages Ltd", category: "Beverages",
    color: "#C0392B", creditLimit: 3000, creditUsed: 0,
    contactEmail: "sales@mazoe.co.zw", phone: "+263 4 770 000",
    trucks: ["ZW-06"] }
]

### products.ts — 29 products
Dairiboard (sup-1):
  Fresh Milk 2L        $1.80   stock:84  reorder:40
  Skim Milk 1L         $1.10   stock:60  reorder:30
  Cheddar Slices 200g  $3.20   stock:18  reorder:24
  Full Cream Yoghurt   $2.10   stock:45  reorder:20
  Unsalted Butter 250g $2.60   stock:52  reorder:25
  Cream Cheese 180g    $4.50   stock:30  reorder:15

National Foods (sup-2):
  Roller Meal 10kg     $4.70   stock:0   reorder:15
  Spaghetti 500g       $1.20   stock:88  reorder:30
  Wheat Flour 2kg      $1.80   stock:64  reorder:30
  Sugar 2kg            $1.60   stock:72  reorder:30
  Iodated Salt 500g    $0.60   stock:12  reorder:20
  Maize Porridge 1kg   $1.30   stock:44  reorder:20

Olivine Industries (sup-3):
  Cooking Oil 2L       $3.90   stock:7   reorder:25
  Laundry Soap 750g    $1.10   stock:38  reorder:30
  Dishwash Liquid 500ml $1.40  stock:29  reorder:20
  Cooking Margarine 500g $2.20 stock:41  reorder:20

Lobels Bread (sup-4):
  Sliced Bread 700g    $1.00   stock:11  reorder:30
  Whole Wheat Loaf     $1.20   stock:26  reorder:20
  Burger Buns 6pk      $1.50   stock:34  reorder:15
  Teacakes 6pk         $1.30   stock:20  reorder:15

ProBrands (sup-5):
  Toothpaste 100ml     $1.80   stock:55  reorder:20
  Shampoo 400ml        $2.50   stock:40  reorder:15
  Body Lotion 200ml    $2.20   stock:33  reorder:15
  Washing Powder 2kg   $3.60   stock:9   reorder:20
  Toilet Paper 9pk     $4.20   stock:48  reorder:15

Mazoe Beverages (sup-6):
  Mazoe Orange 2L      $3.20   stock:0   reorder:20
  Mazoe Raspberry 2L   $3.20   stock:56  reorder:20
  Mazoe Blackcurrant 2L $3.20  stock:38  reorder:20
  Sparkling Water 1.5L $0.90   stock:66  reorder:25

### trucks.ts — 8 trucks
Use Harare coordinates. Simulate movement with setInterval every 30s
nudging lat/lng by ±0.001.

ZW-01  sup-1  Dairiboard     Departed 07:00  ETA 10:45  Progress 78%
       Driver: T. Muriro   Plate: ABE 4821  Speed: 62km/h
       Route: Ruwa → Borrowdale → HQ
       Coords start: { lat: -17.890, lng: 31.120 }

ZW-02  sup-2  National Foods  Departed 07:30  ETA 11:50  Progress 61%
       Driver: F. Chigamba  Plate: ACD 2210  Speed: 55km/h
       Coords start: { lat: -17.980, lng: 31.060 }

ZW-03  sup-3  Olivine Ind.   Departed 08:00  ETA 13:30  Progress 44%
       Driver: M. Dube      Plate: ADE 7734  Speed: 48km/h
       Coords start: { lat: -18.120, lng: 31.030 }

ZW-04  sup-4  Lobels Bread   Departed 07:45  ETA 11:10  Progress 65%
       Driver: R. Mutendi   Plate: ACF 9901  Speed: 58km/h
       Coords start: { lat: -17.920, lng: 30.980 }

ZW-05  sup-5  ProBrands      Departed 08:15  ETA 14:00  Progress 35%
       Driver: S. Nhongo    Plate: ABG 3345  Speed: 52km/h
       Coords start: { lat: -18.200, lng: 31.100 }

ZW-06  sup-6  Mazoe Bev.     Departed 09:00  ETA 17:00  Progress 18%
       Driver: K. Sibanda   Plate: ADF 6672  Speed: 44km/h
       Status: DELAYED (+2h — road works on Seke Rd)
       Coords start: { lat: -18.350, lng: 31.150 }

ZW-07  sup-1  Dairiboard 2nd Departed 09:30  ETA 12:20  Progress 30%
       Driver: P. Makoni    Plate: ABH 1190  Speed: 60km/h
       Coords start: { lat: -17.860, lng: 31.200 }

ZW-08  sup-2  National 2nd   Departed 10:00  ETA 14:45  Progress 15%
       Driver: C. Zvobgo    Plate: ACJ 4418  Speed: 50km/h
       Coords start: { lat: -18.050, lng: 30.920 }

HQ coordinates: { lat: -17.8292, lng: 31.0522 }  (Borrowdale, Harare)

### invoices.ts — credit invoices
INV-0419  sup-3  Olivine     $3,200  Due: 28 Oct 2026  OVERDUE 6 days
INV-0421  sup-4  Lobels      $1,800  Due: 01 Nov 2026  OVERDUE 2 days
INV-0422  sup-5  ProBrands   $4,200  Due: 24 Nov 2026  Due in 10 days
INV-0423  sup-5  ProBrands   $800    Due: 15 Dec 2026  On track
INV-0424  sup-1  Dairiboard  $2,800  Due: 18 Dec 2026  On track
INV-0425  sup-2  National    $1,200  Due: 22 Dec 2026  On track
INV-0416  sup-3  Olivine     $400    Due: 15 Oct 2026  PAID
INV-0410  sup-6  Mazoe       $1,100  Due: 01 Oct 2026  PAID

Reminder logic — store per invoice:
  reminders: [
    { days: 15, sent: boolean, sentAt: Date | null, channels: ['email','inapp'] },
    { days: 10, sent: boolean, sentAt: Date | null, channels: ['email','sms','inapp'] },
    { days: 5,  sent: boolean, sentAt: Date | null, channels: ['email','sms','inapp'] },
  ]
  overduePing: boolean  (daily ping while overdue until paid)

---

## PAGES — 8 ROUTES

### 1. /dashboard
Layout: topbar greeting (user name + date) | content area
Sections:
  a) 4 metric cards in a row:
     - Trucks In Transit (count, status breakdown)
     - Orders This Week (count + % change)
     - Stock Alerts (count, critical vs low split)
     - Credit Due 30 Days (total $, overdue $ in red if > 0)

  b) Supplier status strip — 6 mini cards in 2 rows of 3:
     each shows supplier name, category, status dot, truck count
     Status dot: green = on time, amber = credit warning, red = overdue

  c) Two-column layout:
     LEFT — Live deliveries panel (60% width):
       Mini Leaflet map (non-interactive, overview only) showing
       all truck dots + HQ marker
       Below map: list of 4 trucks currently closest to HQ,
       each with status dot, truck ID, supplier, items count,
       progress bar, and ETA time
       "View all 8 trucks →" link to /tracking

     RIGHT — (40% width, two stacked panels):
       Stock alerts panel:
         List all out-of-stock and low-stock products
         Each row: product name, supplier, qty, status pill
         "Go to inventory →" link

       Active credit reminder card (dark bg #1C1C2E):
         Shows the most urgent unpaid invoice
         Invoice number, supplier, amount, days overdue or days left
         "Pay Now" button + "View Details" button

### 2. /tracking
Layout: three-column — truck list (220px) | full Leaflet map | detail drawer (240px)

Truck list (left panel):
  Header: "In Transit · 8" badge
  Each truck row (clickable, shows selected state):
    Status dot + Truck ID
    Supplier name
    ETA + distance remaining
  Clicking a truck updates the map view and opens detail drawer

Map (center — takes remaining width):
  Full Leaflet map centered on Harare
  Tile layer: OpenStreetMap
  Each truck = custom colored marker (green/amber/red by status)
  HQ = distinct marker (dark square pin)
  Selected truck: draw dotted polyline route from current pos to HQ
  Map top overlay chips: "On route: X" and delay warning if any

Detail drawer (right panel) — shows selected truck:
  Truck ID + status dot
  Supplier name
  Stats rows: ETA, Distance left, Departed, Current speed,
              Driver name, Plate number
  Route progress bar (% complete)
  Manifest section: list first 4 products in the truck's order,
    "show all" toggle for the rest
  Footer: "Alert Supplier" button (triggers toast notification),
          "Download Manifest" button

### 3. /catalogue
Layout: filter sidebar (170px) | product grid | cart panel (210px)

Filter sidebar:
  SUPPLIER section: list all 6 suppliers as clickable tabs
    each with a status dot (green/amber/red based on credit status)
    clicking switches the product grid to that supplier
  CATEGORY section: checkboxes for all 6 categories
  AVAILABILITY: In stock only / Show all toggle
  PRICE RANGE: slider ($0 - $15)

Product grid:
  Toolbar: search input | sort dropdown | count chip
  Grid: 3 columns of product cards
    Each card:
      Icon area (category-appropriate Lucide icon, gold on ivory bg)
      Product name (truncated if long)
      Supplier name + stock badge (In stock / Low stock / Out of stock)
      Price per unit
      Two buttons: "Add to order" and "On credit"
  Clicking "Add to order" → adds to cart, shows qty controller on card
  Clicking "On credit" → adds to cart with credit flag

Cart panel:
  Header: "Current order" + item count badge
  Scrollable item list:
    Each item: name, supplier, qty controller (- N +), line total
    Remove icon on hover
  Totals section: subtotal, VAT 15%, total
  Actions:
    "Pay now" button → opens payment modal
    "Shop on credit" button → opens credit checkout modal
  Credit availability note below actions:
    "Limit: $X · Used: $X · Available: $X"
    Updates live as items are added/removed

Payment modal:
  Order summary
  Payment method: EcoCash / Bank Transfer / Cash on Delivery
  Confirm button → clears cart, creates order record, shows success toast

Credit checkout modal:
  Order summary
  Credit terms: Net 30 (default), Net 15, Net 7
  Confirm → creates order with invoice, adds to credit used,
  Shows reminder schedule preview (15/10/5 day alerts)

### 4. /orders
Toolbar: search | filter by supplier dropdown | filter by status | date range
Orders table columns:
  Invoice # | Supplier | Items (count) | Total | Date | Status | Actions

Status options with pills:
  Pending (gray) | Processing (amber) | Dispatched (blue) |
  Delivered (green) | Cancelled (red)

Row click → slide-in order detail panel from the right:
  Full order details, product list, supplier info, delivery status timeline

Pagination: 10 rows per page

### 5. /inventory
Top section:
  4 summary cards: Total SKUs | In Stock | Low Stock | Out of Stock

AI Banner (Anthropic API integration):
  Card with brain icon, dark background
  Static default message showing 2-3 reorder suggestions
  "Refresh AI suggestions" button → calls Anthropic API:
    POST to https://api.anthropic.com/v1/messages
    Model: claude-sonnet-4-6
    System: "You are an inventory manager for a Zimbabwean
             retail store. Analyse the stock data and give
             concise reorder recommendations in 2-3 sentences."
    User message: JSON of current stock levels
    Display streaming response in the banner
  "Dismiss" button hides banner until next refresh

Toolbar: search | filter by supplier | filter by category |
  "Issues only" toggle (filters to low + out of stock)

Inventory table columns:
  Product | Supplier | Category | In Stock | Reorder Level |
  Stock bar (visual) | Status pill | Last Updated | Action

Stock bar: colored progress bar
  > reorder level = green, < reorder level = amber, 0 = red

Action column:
  "Reorder" button for low/out items → pre-fills catalogue
  order for that product

### 6. /credits
Summary row (4 cards):
  Total Credit Limit | Currently Used + % bar | Due This Month | Available

Outstanding invoices table:
  Invoice # | Supplier | Amount | Due Date | Days Left/Over | Status | Actions

Status pills:
  On track (green) | Due soon — 15 days (amber) |
  Urgent — 5 days (orange) | Overdue (red) | Paid (gray)

Actions per row:
  Unpaid: "Pay Now" button + "View" button
  Paid: "Receipt" button

Side panel (appears when row is clicked):
  Invoice details header
  Escalation timeline:
    Step 1: 15-day reminder
      Sent date, channels (email + in-app), delivery status
    Step 2: 10-day reminder
      Sent date, channels (email + SMS + in-app), delivery status
    Step 3: 5-day reminder
      Sent date, channels, delivery status
    Step 4: Overdue — credit suspended
      Trigger date, "Continues daily until paid" note
  Each step: numbered circle (green→amber→red→dark),
  title, date, channels, status badge (Delivered / Active / Pending)
  "Pay [amount] — Clear reminders" CTA button at bottom

Payment flow:
  Modal: amount confirmation, payment method, confirm
  On confirm: mark invoice paid, clear all pending reminders,
  update credit used, show success toast

### 7. /alerts
Feed header: unread count + "Mark all read" button
Filter tabs: All | Stock | Credit | Delivery | System

Alert card structure:
  Icon (category color) | Title | Description | Timestamp | Action button
  Unread alerts: slightly highlighted background
  Read alerts: normal white background

Alert types to seed:
  STOCK: "Mazoe Orange 2L — Out of stock" → "View inventory"
  STOCK: "Roller Meal 10kg — Out of stock" → "View inventory"
  STOCK: "Cooking Oil 2L — Low stock (7 units)" → "Reorder"
  CREDIT: "INV-0419 Olivine — 6 days overdue" → "Pay now"
  CREDIT: "INV-0421 Lobels — 2 days overdue" → "Pay now"
  CREDIT: "INV-0422 ProBrands — Due in 10 days" → "View invoice"
  DELIVERY: "ZW-06 Mazoe Beverages — Delayed +2h" → "Track truck"
  SYSTEM: "Catalogue synced — 29 products updated" → dismiss
  SYSTEM: "Credit limit warning: Olivine at 107% of limit" → "View"

### 8. /settings
Tabs: Company | Suppliers | Users | Notifications | Credits

Company tab:
  Company name, address, phone, email — editable form
  Save button

Suppliers tab:
  Table of all 6 suppliers with credit limit, status, edit button
  "Add supplier" button → modal form

Users tab:
  Table: name, email, role (Admin / Operations / Finance), status
  Roles control what pages they can access
  "Invite user" button

Notifications tab:
  Toggle matrix:
    Rows: Stock alerts | Credit reminders | Delivery delays | System
    Columns: Email | SMS | In-app
  Each cell = toggle switch

Credits tab:
  Reminder thresholds: editable inputs for 15/10/5 day defaults
  Overdue escalation: toggle for daily pings, credit suspension
  Save button

---

## STATE MANAGEMENT — Zustand stores

useSupplierStore:
  suppliers[], activeSupplier, setActiveSupplier

useProductStore:
  products[], getBySupplier(id), getAlerts()

useTruckStore:
  trucks[], selectedTruck, setSelectedTruck
  startSimulation() — setInterval moving coords

useCartStore:
  items[], addItem, removeItem, updateQty, clearCart
  totals (computed: subtotal, vat, total)
  paymentMode: 'pay' | 'credit'

useInvoiceStore:
  invoices[], markPaid(id), getOverdue(), getDueSoon()
  triggerReminders() — checks dates and sets reminder flags

useAlertStore:
  alerts[], markRead(id), markAllRead(), getUnread()

useInventoryStore:
  products (synced from useProductStore)
  aiSuggestion: string | null
  setAiSuggestion, clearAiSuggestion

---

## AI INTEGRATION — Anthropic API

File: src/lib/anthropic.ts

export async function getReorderSuggestions(stockData: Product[]) {
  const lowItems = stockData.filter(p => p.stock <= p.reorderLevel)
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are the inventory AI for FreshMark Retail Zimbabwe.
Current low/out-of-stock items: ${JSON.stringify(lowItems.map(p => ({
  name: p.name,
  supplier: p.supplierName,
  inStock: p.stock,
  reorderLevel: p.reorderLevel,
  weeklyAvgSales: p.weeklyAvgSales
})))}
Give a concise 2-3 sentence reorder recommendation. Mention specific
product names, urgency, and estimated reorder quantities. Be direct.`
      }]
    })
  })
  const data = await response.json()
  return data.content[0].text
}

Add VITE_ANTHROPIC_API_KEY to .env.local (user provides key).
Show a loading state in the banner while the API call is in flight.
Handle errors gracefully with a fallback message.

---

## SHARED LAYOUT — src/components/layout/

Shell.tsx — wraps every authenticated page:
  <div className="flex h-screen bg-ivory overflow-hidden">
    <Sidebar />
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar />
      <main className="flex-1 overflow-y-auto p-[18px_20px] bg-ivory">
        <Outlet />
      </main>
    </div>
  </div>

Sidebar.tsx:
  Fixed 200px, bg-noir
  Logo section: "VENDA" text-gold tracking-widest text-lg font-medium
    Subtitle: "FreshMark Zimbabwe" text-[10px] text-white/30
  Nav sections with labels (MAIN, OPERATIONS, ACCOUNT)
  NavItem component:
    default: text-white/40 border-l-2 border-transparent
    active: text-gold bg-gold/[0.08] border-l-2 border-gold
    badge (optional): bg-gold text-noir text-[9px] px-1 rounded-full
  Icons: Lucide, size 14px
  Bottom: user avatar (initials) + name + role

Topbar.tsx:
  h-12 bg-surface border-b border-[0.5px] border-edge
  Left: page title (from route)
  Right: contextual chips + notification bell with unread count

---

## REUSABLE UI COMPONENTS — src/components/ui/

Button.tsx — variants: primary | secondary | destructive | ghost
Badge.tsx — variants: success | warning | danger | neutral | gold
StatusDot.tsx — size: sm | md, status: online | warning | offline
ProgressBar.tsx — value (0-100), color variant
MetricCard.tsx — label, value, sub, trend (optional)
DataTable.tsx — columns config + data array, sortable headers
Modal.tsx — title, children, footer actions
Toast — via react-hot-toast, styled with brand colors
Spinner.tsx — loading indicator
EmptyState.tsx — icon + title + description + optional CTA

---

## ROUTING — src/App.tsx

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Shell />}>
      <Route index element={<Navigate to="/dashboard" />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="tracking" element={<Tracking />} />
      <Route path="catalogue" element={<Catalogue />} />
      <Route path="orders" element={<Orders />} />
      <Route path="inventory" element={<Inventory />} />
      <Route path="credits" element={<Credits />} />
      <Route path="alerts" element={<Alerts />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  </Routes>
</BrowserRouter>

---

## TAILWIND CONFIG — tailwind.config.js

module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        noir:    '#1C1C2E',
        gold:    '#C9933A',
        ivory:   '#F8F6F1',
        surface: '#FFFFFF',
        edge:    '#E2DDD6',
        muted:   '#6B6B7B',
        success: '#2D7A4F',
        danger:  '#C0392B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderWidth: {
        DEFAULT: '0.5px',
      }
    }
  },
  plugins: []
}

---

## QUALITY REQUIREMENTS
- TypeScript: no `any` types — define all interfaces in src/types/
- All data flows through Zustand — no prop drilling beyond 2 levels
- All dates formatted with date-fns
- All currency formatted as USD with 2 decimal places
- Leaflet map: lazy-load to avoid SSR issues
- Mobile: not required — desktop-first, min-width 1280px
- Accessibility: all buttons have aria-labels, icons have aria-hidden
- No placeholder text like "Lorem ipsum" — use real Zimbabwean context

---

## BUILD ORDER
1. tailwind.config.js + globals.css + Inter font import
2. src/types/index.ts — all interfaces
3. src/data/ — all seed files
4. src/store/ — all Zustand stores
5. src/lib/anthropic.ts — AI integration
6. src/components/ui/ — all primitives
7. src/components/layout/ — Shell, Sidebar, Topbar
8. Pages in order: Dashboard → Tracking → Catalogue →
   Orders → Inventory → Credits → Alerts → Settings
9. src/App.tsx — routing
10. index.html + main.tsx — entry point

Build the complete project. Every file. No placeholders.