import { useSearchParams } from "react-router-dom";
import { defaultCreditPolicy } from "../lib/credit";
import { isPreview } from "../lib/runtime";
import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "../store";
import { Badge, Button, DataTable, Modal } from "../components/ui";
import { money, supplierStatus } from "../lib/utils";
import { api, errorMessage } from "../lib/api";
import type { Settings as SettingsType, Supplier, User, Role } from "../types";
export default function Settings() {
  const s = useAppStore();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "Company");
  const [draft, setDraft] = useState<SettingsType>(structuredClone(s.settings));
  const [supplier, setSupplier] = useState<Supplier | null>(null),
    [invite, setInvite] = useState(false),
    [busy, setBusy] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Operations" as Role,
    password: "",
  });
  useEffect(() => {
    if (tab === "Users") void s.loadUsers();
  }, [tab, s.loadUsers]);
  const save = async () => {
    setBusy(true);
    if (await s.command({ type: "saveSettings", settings: draft }))
      toast.success("Settings saved");
    setBusy(false);
  };
  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/users", newUser);
      await s.loadUsers();
      setInvite(false);
      setNewUser({ name: "", email: "", role: "Operations", password: "" });
      toast.success(
        "User account created. Share initial credentials securely.",
      );
    } catch (e) {
      toast.error(errorMessage(e));
    }
    setBusy(false);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">WORKSPACE ADMINISTRATION</p>
          <h1>Settings</h1>
          <p className="subtext">
            Your business, partners, people, and preferences.
          </p>
        </div>
        <Badge variant="gold">Administrator</Badge>
      </div>
      <div className="panel">
        <div className="flex gap-6 border-b-[0.5px] border-edge px-5">
          {["Company", "Suppliers", "Users", "Notifications", "Credits"].map(
            (t) => (
              <button
                key={t}
                aria-label={`${t} settings`}
                onClick={() => setTab(t)}
                className={`border-b-[0.5px] py-4 ${tab === t ? "border-gold text-gold" : "border-transparent text-muted"}`}
              >
                {t}
              </button>
            ),
          )}
        </div>
        <div className="p-5">
          {tab === "Company" && (
            <form
              className="max-w-2xl"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <h3 className="mb-5">Company profile</h3>
              <div className="grid grid-cols-2 gap-5">
                {(
                  Object.keys(
                    draft.company,
                  ) as (keyof SettingsType["company"])[]
                ).map((key) => (
                  <label key={key} className="field capitalize">
                    {key}
                    <input
                      aria-label={`Company ${key}`}
                      required
                      type={key === "email" ? "email" : "text"}
                      value={draft.company[key]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          company: { ...draft.company, [key]: e.target.value },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <Button type="submit" disabled={busy} className="mt-6">
                Save company details
              </Button>
            </form>
          )}
          {tab === "Suppliers" && (
            <>
              <div className="mb-4 flex justify-between">
                <h3>Supplier directory</h3>
                <Button
                  onClick={() =>
                    setSupplier({
                      id: crypto.randomUUID(),
                      name: "",
                      category: "Staples",
                      color: "#2D7A4F",
                      creditLimit: 1000,
                      creditUsed: 0,
                      contactEmail: "",
                      phone: "",
                      trucks: [],
                    })
                  }
                >
                  <Plus aria-hidden size={12} />
                  Add supplier
                </Button>
              </div>
              <DataTable<Supplier>
                data={s.suppliers}
                columns={[
                  {
                    key: "name",
                    label: "Supplier",
                    sortValue: (p) => p.name,
                    render: (p) => p.name,
                  },
                  {
                    key: "category",
                    label: "Category",
                    render: (p) => p.category,
                  },
                  {
                    key: "limit",
                    label: "Credit limit",
                    render: (p) => money(p.creditLimit),
                  },
                  {
                    key: "used",
                    label: "Used",
                    render: (p) => money(p.creditUsed),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (p) => (
                      <Badge variant={supplierStatus(p, s.invoices)}>
                        {p.creditUsed > p.creditLimit
                          ? "Over limit"
                          : p.creditUsed / p.creditLimit >= 0.85
                            ? "Near limit"
                            : "Active"}
                      </Badge>
                    ),
                  },
                  {
                    key: "edit",
                    label: "Action",
                    render: (p) => (
                      <Button
                        variant="secondary"
                        onClick={() => setSupplier({ ...p })}
                      >
                        Edit
                      </Button>
                    ),
                  },
                ]}
              />
            </>
          )}
          {tab === "Users" && (
            <>
              <div className="mb-4 flex justify-between">
                <div>
                  <h3>Workspace users</h3>
                  <p className="subtext">
                    Admin: all pages · Operations: logistics and stock ·
                    Finance: invoices and orders.
                  </p>
                </div>
                <Button onClick={() => setInvite(true)}>
                  <Plus aria-hidden size={12} />
                  Invite user
                </Button>
              </div>
              <DataTable<User>
                data={s.users}
                columns={[
                  { key: "name", label: "Name", render: (u) => u.name },
                  { key: "email", label: "Email", render: (u) => u.email },
                  {
                    key: "role",
                    label: "Role",
                    render: (u) => <Badge variant="gold">{u.role}</Badge>,
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (u) => <Badge variant="success">{u.status}</Badge>,
                  },
                ]}
              />
              <p className="mt-4 text-sm text-muted">
                Invitations create a local account with an initial password. No
                invitation email is sent until an email provider is connected.
              </p>
            </>
          )}
          {tab === "Notifications" && (
            <div className="max-w-2xl">
              <h3>Notification preferences</h3>
              <p className="subtext">
                Channel preferences are saved. Live email and SMS delivery
                require provider integration.
              </p>
              <table className="my-5 w-full">
                <thead>
                  <tr>
                    <th>Alert category</th>
                    {["Email", "SMS", "In-app"].map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(draft.notifications).map(([type, value]) => (
                    <tr key={type}>
                      <td>
                        {type}
                        {type === "Credit"
                          ? " reminders"
                          : type === "Delivery"
                            ? " delays"
                            : " alerts"}
                      </td>
                      {(["email", "sms", "inapp"] as const).map((channel) => (
                        <td key={channel}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={value[channel]}
                            aria-label={`${type} ${channel} notifications`}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                notifications: {
                                  ...draft.notifications,
                                  [type]: {
                                    ...value,
                                    [channel]: !value[channel],
                                  },
                                },
                              })
                            }
                            className={`relative h-4 w-7 rounded-full ${value[channel] ? "bg-gold" : "bg-edge"}`}
                          >
                            <span
                              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${value[channel] ? "left-3.5" : "left-0.5"}`}
                            />
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <section className="mb-5 rounded-xl border-[0.5px] border-edge p-4">
                <h3>Continuous AI monitoring</h3>
                <p className="subtext">
                  Connect ANTHROPIC_API_KEY securely in the server hosting
                  settings. No key is stored in this browser.
                </p>
                <label className="my-4 flex items-center gap-2">
                  <input
                    aria-label="Enable automatic AI monitoring"
                    type="checkbox"
                    checked={draft.monitoring?.enabled !== false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        monitoring: {
                          intervalMinutes:
                            draft.monitoring?.intervalMinutes || 5,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  Analyze changing operations automatically when connected
                </label>
                <label className="field">
                  Minimum analysis interval (minutes)
                  <input
                    aria-label="AI analysis interval"
                    type="number"
                    min="5"
                    max="60"
                    value={draft.monitoring?.intervalMinutes || 5}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        monitoring: {
                          enabled: draft.monitoring?.enabled !== false,
                          intervalMinutes: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
                <p className="mt-3 text-xs text-muted">
                  Local checks remain live. AI calls require provider access and
                  can incur provider charges.
                </p>
              </section>
              <Button disabled={busy} onClick={() => void save()}>
                Save preferences
              </Button>
            </div>
          )}
          {tab === "Credits" && (
            <div className="max-w-2xl">
              <h3>Reminder thresholds</h3>
              <p className="subtext">
                Days before payment is due. Applies to new credit invoices.
              </p>
              <div className="my-5 grid grid-cols-3 gap-4">
                {draft.thresholds.map((days, i) => (
                  <label className="field" key={i}>
                    Reminder {i + 1} · days
                    <input
                      aria-label={`Reminder ${i + 1} days`}
                      type="number"
                      min="1"
                      max="90"
                      value={days}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          thresholds: draft.thresholds.map((d, j) =>
                            i === j ? Number(e.target.value) : d,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="mb-6 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={draft.dailyPings}
                    onChange={(e) =>
                      setDraft({ ...draft, dailyPings: e.target.checked })
                    }
                  />
                  Send daily in-app pings while overdue
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={draft.suspendCredit}
                    onChange={(e) =>
                      setDraft({ ...draft, suspendCredit: e.target.checked })
                    }
                  />
                  Suspend new credit orders when a supplier invoice is overdue
                </label>
              </div>
              <section className="mb-6 rounded-xl border-[0.5px] border-edge p-4">
                <h3>Credit interest</h3>
                <p className="subtext">
                  Simple daily interest on new purchases, calculated through the
                  actual settlement date. Existing invoices retain their agreed
                  rate.
                </p>
                <label className="my-4 flex items-center gap-2">
                  <input
                    aria-label="Enable credit interest"
                    type="checkbox"
                    checked={draft.creditPolicy?.enabled || false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        creditPolicy: {
                          ...(draft.creditPolicy || defaultCreditPolicy),
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  Charge interest on new credit purchases
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="field">
                    Annual rate (APR %)
                    <input
                      aria-label="Annual credit interest rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={draft.creditPolicy?.annualRate || 0}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          creditPolicy: {
                            ...(draft.creditPolicy || defaultCreditPolicy),
                            annualRate: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    Interest-free grace days
                    <input
                      aria-label="Interest grace days"
                      type="number"
                      min="0"
                      max="365"
                      value={draft.creditPolicy?.graceDays || 0}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          creditPolicy: {
                            ...(draft.creditPolicy || defaultCreditPolicy),
                            graceDays: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                </div>
                <p className="mt-3 text-xs text-muted">
                  Set only an approved business rate. Rates are currently zero
                  until configured.
                </p>
              </section>
              <Button disabled={busy} onClick={() => void save()}>
                Save credit policy
              </Button>
            </div>
          )}
        </div>
      </div>
      {supplier && (
        <Modal
          title={
            s.suppliers.some((p) => p.id === supplier.id)
              ? "Edit supplier"
              : "Add supplier"
          }
          onClose={() => setSupplier(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              void s.command({ type: "saveSupplier", supplier }).then((ok) => {
                setBusy(false);
                if (ok) {
                  setSupplier(null);
                  toast.success("Supplier saved");
                }
              });
            }}
          >
            {(["name", "category", "contactEmail", "phone"] as const).map(
              (k) => (
                <label className="field capitalize" key={k}>
                  {k.replace("contactEmail", "Contact email")}
                  <input
                    aria-label={`Supplier ${k}`}
                    required
                    value={supplier[k]}
                    type={k === "contactEmail" ? "email" : "text"}
                    onChange={(e) =>
                      setSupplier({ ...supplier, [k]: e.target.value })
                    }
                  />
                </label>
              ),
            )}
            <label className="field">
              Credit limit (USD)
              <input
                aria-label="Supplier credit limit"
                required
                type="number"
                min="1"
                step="0.01"
                value={supplier.creditLimit}
                onChange={(e) =>
                  setSupplier({
                    ...supplier,
                    creditLimit: Number(e.target.value),
                  })
                }
              />
            </label>
            <Button type="submit" disabled={busy}>
              Save supplier
            </Button>
          </form>
        </Modal>
      )}
      {invite && (
        <Modal title="Invite a team member" onClose={() => setInvite(false)}>
          <form className="space-y-4" onSubmit={(e) => void addUser(e)}>
            {(["name", "email", "password"] as const)
              .filter((k) => !isPreview || k !== "password")
              .map((k) => (
                <label key={k} className="field capitalize">
                  {k === "password" ? "Initial password (12+ characters)" : k}
                  <input
                    aria-label={`New user ${k}`}
                    autoComplete={k === "password" ? "new-password" : undefined}
                    required
                    minLength={k === "password" ? 12 : undefined}
                    type={
                      k === "email"
                        ? "email"
                        : k === "password"
                          ? "password"
                          : "text"
                    }
                    value={newUser[k]}
                    onChange={(e) =>
                      setNewUser({ ...newUser, [k]: e.target.value })
                    }
                  />
                </label>
              ))}
            <label className="field">
              Role
              <select
                aria-label="Role"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value as Role })
                }
              >
                {["Admin", "Operations", "Finance"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={busy}>
              Create user account
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
