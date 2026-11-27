import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Dumbbell,
  Apple,
  LifeBuoy,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  ShieldAlert,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import {
  getAdminStats,
  getAdminUsers,
  toggleUserRole,
  deleteUserByAdmin,
  getAdminTickets,
  updateTicketByAdmin,
  AdminStats,
  AdminUserItem,
  AdminTicketItem,
} from "../services/adminService";

export function AdminPage() {
  const { notify } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [tickets, setTickets] = useState<AdminTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "resolved">("all");
  const [activeTab, setActiveTab] = useState<"users" | "tickets">("users");

  // Ticket reply modal
  const [selectedTicket, setSelectedTicket] = useState<AdminTicketItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Load everything
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, ticketsData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(userSearch),
        getAdminTickets(ticketFilter === "all" ? undefined : ticketFilter),
      ]);
      setStats(statsData);
      setUsers(usersData.users);
      setTickets(ticketsData.tickets);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      notify(err.response?.data?.message || err.response?.data?.msg || "Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ticketFilter]);

  // Handle user search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      getAdminUsers(userSearch)
        .then((res) => setUsers(res.users))
        .catch((err) => console.error("Search error:", err));
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleToggleRole = async (user: AdminUserItem) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`Are you sure you want to change ${user.name}'s role to ${nextRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await toggleUserRole(user._id || (user.id as string), nextRole);
      setUsers(users.map((u) => (u._id === user._id ? { ...u, role: res.user.role } : u)));
      notify(res.msg);
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to update role");
    }
  };

  const handleDeleteUser = async (user: AdminUserItem) => {
    if (!confirm(`CAUTION: Permanently delete ${user.name} (${user.email}) and all their workouts, nutrition logs, and records?`)) {
      return;
    }

    try {
      const res = await deleteUserByAdmin(user._id || (user.id as string));
      setUsers(users.filter((u) => u._id !== user._id));
      notify(res.msg);
      // Refresh stats
      getAdminStats().then(setStats);
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to delete user");
    }
  };

  const handleUpdateTicketStatus = async (ticket: AdminTicketItem, newStatus: "open" | "resolved") => {
    try {
      const res = await updateTicketByAdmin(ticket._id, { status: newStatus });
      setTickets(tickets.map((t) => (t._id === ticket._id ? res.ticket : t)));
      notify(`Ticket marked as ${newStatus}`);
      getAdminStats().then(setStats);
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to update ticket status");
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await updateTicketByAdmin(selectedTicket._id, {
        status: "resolved",
        reply: replyText.trim(),
      });
      setTickets(tickets.map((t) => (t._id === selectedTicket._id ? res.ticket : t)));
      notify("Email response sent and ticket marked as resolved!");
      setSelectedTicket(null);
      setReplyText("");
      getAdminStats().then(setStats);
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to send reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status === "open").length;

  return (
    <>
      <PageHeader
        eyebrow="ADMIN CONSOLE"
        title="System Administration"
        description="Monitor system-wide metrics, manage user roles, and respond to member support inquiries."
        action={
          <Button variant="secondary" icon={RefreshCw} onClick={loadData}>
            Refresh Data
          </Button>
        }
      />

      {/* SECTION 1: PLATFORM OVERVIEW (4 KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="metric-label">TOTAL MEMBERS</span>
            <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Users size={20} />
            </span>
          </div>
          <div className="metric-value">{stats?.totalUsers ?? "--"}</div>
          <p className="text-xs text-muted mt-1">
            <strong className="text-emerald-400">{stats?.verifiedUsers ?? "--"}</strong> verified accounts
          </p>
        </Card>

        <Card className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="metric-label">TRAINING VOLUME</span>
            <span className="p-2 rounded-xl bg-[color-mix(in_srgb,var(--color-lime)_15%,transparent)] text-[var(--color-lime)]">
              <Dumbbell size={20} />
            </span>
          </div>
          <div className="metric-value">{stats?.totalWorkouts ?? "--"}</div>
          <p className="text-xs text-muted mt-1">
            <strong style={{ color: "var(--color-white, white)" }}>{stats?.totalSessions ?? "--"}</strong> completed sessions
          </p>
        </Card>

        <Card className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="metric-label">NUTRITION LOGS</span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Apple size={20} />
            </span>
          </div>
          <div className="metric-value">{stats?.totalNutritionLogs ?? "--"}</div>
          <p className="text-xs text-muted mt-1">Meals and macro logs recorded</p>
        </Card>

        <Card className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="metric-label">SUPPORT TICKETS</span>
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <LifeBuoy size={20} />
            </span>
          </div>
          <div className="metric-value">{stats?.totalTickets ?? "--"}</div>
          <p className="text-xs text-muted mt-1">
            <span className="text-amber-400 font-bold">{stats?.openTickets ?? "--"} open</span> ·{" "}
            <span className="text-emerald-400">{stats?.resolvedTickets ?? "--"} resolved</span>
          </p>
        </Card>
      </div>

      {/* TABS SWITCHER */}
      <div className="flex border-b border-[var(--line)] mb-6 gap-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition cursor-pointer border-b-2 ${
            activeTab === "users"
              ? "border-[var(--color-lime)] text-[var(--color-white,white)]"
              : "border-transparent text-muted hover:text-white"
          }`}
        >
          <UserCheck size={18} />
          <span>User Management</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tickets")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition cursor-pointer border-b-2 ${
            activeTab === "tickets"
              ? "border-[var(--color-lime)] text-[var(--color-white,white)]"
              : "border-transparent text-muted hover:text-white"
          }`}
        >
          <Mail size={18} />
          <span>Help Center Tickets</span>
          {openTicketsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-black font-bold">
              {openTicketsCount} open
            </span>
          )}
        </button>
      </div>

      {/* SECTION 2: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--color-white, white)" }}>
                Platform Accounts
              </h2>
              <p className="text-xs text-muted">
                Manage roles and data ownership across all registered users.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="field-input pl-9 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--line)] text-muted">
                <tr>
                  <th className="py-3 px-3">USER</th>
                  <th className="py-3 px-3">ROLE</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3">JOINED</th>
                  <th className="py-3 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {users.map((u) => {
                  const uId = u._id || (u.id as string);
                  const isUserAdmin = u.role === "admin";
                  return (
                    <tr key={uId} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="size-8 rounded-full object-cover" />
                          ) : (
                            <span className="size-8 rounded-full bg-white/10 grid place-items-center font-bold text-[var(--color-lime)]">
                              {u.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          )}
                          <div>
                            <strong className="block font-medium" style={{ color: "var(--color-white, white)" }}>
                              {u.name}
                            </strong>
                            <span className="text-muted block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold cursor-pointer transition ${
                            isUserAdmin
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                              : "bg-white/10 text-white/70 hover:bg-white/15"
                          }`}
                          title="Click to toggle role"
                        >
                          {isUserAdmin ? <ShieldCheck size={13} /> : <UserCheck size={13} />}
                          <span>{isUserAdmin ? "ADMIN" : "USER"}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                            <Clock size={13} /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "--"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Delete user and all records"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      No users match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SECTION 3: SUPPORT TICKETS INBOX */}
      {activeTab === "tickets" && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--color-white, white)" }}>
                Help Center Inquiries
              </h2>
              <p className="text-xs text-muted">
                Review member messages, reply directly via email, and mark issues resolved.
              </p>
            </div>
            <div className="flex rounded-xl border border-[var(--line)] p-1 bg-[var(--surface)]">
              {(["all", "open", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTicketFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                    ticketFilter === st
                      ? "bg-[var(--color-lime)] text-[var(--color-ink)]"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => {
              const isResolved = t.status === "resolved";
              return (
                <div
                  key={t._id}
                  className="border border-[var(--line)] rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2.5 rounded-full ${
                          isResolved ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                        }`}
                      />
                      <strong className="text-sm font-semibold" style={{ color: "var(--color-white, white)" }}>
                        {t.topic}
                      </strong>
                      <span className="text-xs text-muted">· {new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isResolved
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">
                    {t.message}
                  </p>

                  {/* Previous Admin Reply if exists */}
                  {t.adminReply && (
                    <div className="bg-emerald-500/10 border-l-2 border-emerald-400 p-3 rounded-r-lg text-xs text-emerald-200">
                      <strong className="block mb-1 text-emerald-300">Previous Admin Reply:</strong>
                      {t.adminReply}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                    <div className="text-xs text-muted flex items-center gap-1.5">
                      <Mail size={13} />
                      <span>{t.user?.name || "Member"}</span>
                      <span>({t.user?.email || "No email"})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isResolved ? (
                        <button
                          onClick={() => handleUpdateTicketStatus(t, "open")}
                          className="px-3 py-1 rounded-lg text-xs border border-[var(--line)] text-muted hover:text-white cursor-pointer transition"
                        >
                          Reopen
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateTicketStatus(t, "resolved")}
                          className="px-3 py-1 rounded-lg text-xs border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 cursor-pointer transition"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <Button
                        icon={Send}
                        className="py-1 px-3 text-xs"
                        onClick={() => {
                          setSelectedTicket(t);
                          setReplyText(t.adminReply || "");
                        }}
                      >
                        Reply via Email
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {tickets.length === 0 && (
              <div className="text-center py-12 text-muted text-xs">
                No support tickets found for this filter.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* REPLY MODAL */}
      {selectedTicket && (
        <Modal
          title={`Reply to ${selectedTicket.user?.name || "User"}`}
          onClose={() => setSelectedTicket(null)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-xl text-xs space-y-1">
              <span className="text-muted block">Ticket Topic:</span>
              <strong className="text-white block">{selectedTicket.topic}</strong>
              <p className="text-muted mt-2">{selectedTicket.message}</p>
            </div>

            <label className="field">
              <span>Your Email Response</span>
              <textarea
                rows={5}
                required
                placeholder="Type your official response to the user. This will be sent directly to their registered email address..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="field-input text-xs"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
                Cancel
              </Button>
              <Button icon={Send} disabled={submittingReply || !replyText.trim()} onClick={handleSendReply}>
                {submittingReply ? "Sending..." : "Send & Resolve"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
