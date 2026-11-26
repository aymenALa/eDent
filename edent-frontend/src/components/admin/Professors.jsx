import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { faCheckCircle, faClock, faTrash, faUserTie } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import SearchInput from "../ui/SearchInput";
import FilterSelect from "../ui/FilterSelect";
import DataTable from "../ui/DataTable";
import StatusBadge from "../ui/StatusBadge";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE, authHeaders, getAuthUser, useDemoMode } from "../../utils/api";

const Professors = () => {
  const userlogin = getAuthUser() || {};
  const demoReadOnly = useDemoMode();
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProfessors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE}/users/allProfessor`);
      setProfessors(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load professor accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  const handleActivateToggle = async (prof) => {
    const nextState = !prof.activate;
    setTogglingId(prof.id);
    setProfessors((prev) =>
      prev.map((item) => (item.id === prof.id ? { ...item, activate: nextState } : item))
    );
    try {
      const response = await axios.post(`${API_BASE}/users/activate/${prof.id}`);
      toast.success(
        response.data?.message ||
          `Professor account ${nextState ? "activated" : "deactivated"}.`
      );
    } catch (err) {
      setProfessors((prev) =>
        prev.map((item) => (item.id === prof.id ? { ...item, activate: prof.activate } : item))
      );
      toast.error(err.response?.data?.message || "Could not update activation status.");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const response = await axios.delete(
        `${API_BASE}/users/delete/professor/${userlogin.id}/${confirmTarget.id}`,
        { headers: authHeaders() }
      );
      setProfessors((prev) => prev.filter((item) => item.id !== confirmTarget.id));
      toast.success(response.data?.message || "Professor deleted successfully.");
      setConfirmTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete this professor.");
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const total = professors.length;
    const active = professors.filter((p) => p.activate).length;
    return { total, active, inactive: total - active };
  }, [professors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return professors.filter((p) => {
      if (statusFilter === "active" && !p.activate) return false;
      if (statusFilter === "inactive" && p.activate) return false;
      if (!q) return true;
      return [p.firstName, p.lastName, p.userName, p.email, p.grade]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    });
  }, [professors, search, statusFilter]);

  const columns = [
    {
      key: "name",
      label: "Professor",
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar photo={item.photo} firstName={item.firstName} lastName={item.lastName} size="sm" />
          <div>
            <p className="font-medium text-[#0F172A]">
              {item.firstName} {item.lastName}
            </p>
            <p className="text-xs text-slate-500">@{item.userName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (item) => <span className="text-slate-600">{item.email}</span>,
    },
    {
      key: "grade",
      label: "Grade",
      render: (item) => <span className="text-slate-600">{item.grade || "—"}</span>,
    },
    {
      key: "status",
      label: "Account status",
      render: (item) => (
        <StatusBadge tone={item.activate ? "success" : "neutral"}>
          {item.activate ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      key: "activation",
      label: "Access",
      render: (item) => (
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            id={`activate-checkbox-${item.id}`}
            checked={Boolean(item.activate)}
            disabled={togglingId === item.id || demoReadOnly}
            onChange={() => handleActivateToggle(item)}
            title={demoReadOnly ? "Disabled in public demo mode" : undefined}
            aria-label={`Toggle activation for ${item.firstName} ${item.lastName}`}
            className="h-4 w-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
          />
          <span className="text-xs font-medium text-slate-600">
            {item.activate ? "Enabled" : "Disabled"}
          </span>
        </label>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={demoReadOnly}
          title={demoReadOnly ? "Disabled in public demo mode" : undefined}
          onClick={() => setConfirmTarget(item)}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Professor management"
        description="Activate, review, and manage faculty accounts across the eDent platform."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total professors" value={stats.total} icon={faUserTie} />
        <StatCard label="Active accounts" value={stats.active} icon={faCheckCircle} />
        <StatCard label="Inactive accounts" value={stats.inactive} icon={faClock} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            id="admin-prof-search"
            label="Search professors"
            value={search}
            onChange={setSearch}
            placeholder="Search by name, username, or email..."
            className="sm:w-80"
          />
          <FilterSelect
            id="admin-prof-status"
            label="Filter by account status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-48"
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active only" },
              { value: "inactive", label: "Inactive only" },
            ]}
          />
        </div>
        {!loading && !error && (
          <p className="text-xs font-medium text-slate-500">
            Showing {filtered.length} of {professors.length} professors
          </p>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading professor accounts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProfessors} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(item) => item.id}
          emptyState={
            <EmptyState
              title="No matching professors"
              description={
                search || statusFilter !== "all"
                  ? "Try clearing your search or status filter."
                  : "No professor accounts are currently registered."
              }
            />
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete professor account"
        message={
          confirmTarget
            ? `Are you sure you want to delete ${confirmTarget.firstName || ""} ${confirmTarget.lastName || ""} (${confirmTarget.email})? Professors linked to existing groups cannot be deleted.`
            : ""
        }
        confirmLabel="Delete professor"
      />
    </div>
  );
};

export default Professors;
