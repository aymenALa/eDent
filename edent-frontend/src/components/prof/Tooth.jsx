import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCircleInfo,
  faLock,
  faPen,
  faPlus,
  faTooth,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import SearchInput from "../ui/SearchInput";
import FilterSelect from "../ui/FilterSelect";
import DataTable from "../ui/DataTable";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import FormField from "../ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE } from "../../utils/api";

const Tooth = () => {
  const [teeth, setTeeth] = useState([]);
  const [pws, setPws] = useState(null);
  const [tooth, setTooth] = useState({ id: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [usageFilter, setUsageFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeeth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [teethRes, pwsRes] = await Promise.all([
        axios.get(`${API_BASE}/teeth/all`),
        axios.get(`${API_BASE}/pws/all`).catch(() => null),
      ]);
      setTeeth(Array.isArray(teethRes.data) ? teethRes.data : []);
      setPws(pwsRes && Array.isArray(pwsRes.data) ? pwsRes.data : null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load teeth.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeeth();
  }, [fetchTeeth]);

  const dependenciesKnown = Array.isArray(pws);

  const usageByToothId = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(pws)) return map;
    for (const item of pws) {
      const tId = item?.tooth?.id;
      if (tId === undefined || tId === null) continue;
      const key = Number(tId);
      const entry = map.get(key) || { count: 0, titles: [] };
      entry.count += 1;
      if (item.title) entry.titles.push(item.title);
      map.set(key, entry);
    }
    return map;
  }, [pws]);

  const counts = useMemo(() => {
    const total = teeth.length;
    if (!dependenciesKnown) {
      return { total, inUse: "—", unused: "—" };
    }
    let inUse = 0;
    for (const t of teeth) {
      if ((usageByToothId.get(Number(t.id))?.count || 0) > 0) inUse += 1;
    }
    return { total, inUse, unused: total - inUse };
  }, [teeth, dependenciesKnown, usageByToothId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tooth.name.trim()) {
      toast.error("Tooth name is required.");
      return;
    }
    setSaving(true);
    try {
      if (updateMode) {
        const rep = await axios.put(`${API_BASE}/teeth/update/${tooth.id}`, tooth);
        toast.success(rep.data?.message || "Tooth updated successfully.");
      } else {
        const rep = await axios.post(`${API_BASE}/teeth/add`, tooth);
        toast.success(rep.data?.message || "Tooth added successfully.");
      }
      setModalOpen(false);
      setTooth({ id: "", name: "" });
      setUpdateMode(false);
      await fetchTeeth();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save tooth.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const rep = await axios.delete(`${API_BASE}/teeth/delete/${deleteTarget.id}`);
      toast.success(rep.data?.message || "Tooth deleted successfully.");
      setDeleteTarget(null);
      await fetchTeeth();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete this tooth.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teeth.filter((t) => {
      if (q && (!t.name || !t.name.toLowerCase().includes(q))) return false;
      if (usageFilter !== "all" && dependenciesKnown) {
        const refCount = usageByToothId.get(Number(t.id))?.count || 0;
        if (usageFilter === "in-use" && refCount === 0) return false;
        if (usageFilter === "unused" && refCount > 0) return false;
      }
      return true;
    });
  }, [teeth, search, usageFilter, dependenciesKnown, usageByToothId]);

  const columns = [
    {
      key: "name",
      label: "Tooth name",
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
            <FontAwesomeIcon icon={faTooth} className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="font-medium text-[#0F172A]">{t.name}</span>
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (t) => {
        if (!dependenciesKnown) {
          return <StatusBadge tone="neutral">Unknown</StatusBadge>;
        }
        const usage = usageByToothId.get(Number(t.id)) || { count: 0, titles: [] };
        if (usage.count === 0) {
          return <StatusBadge tone="neutral">0 PWs (Unused)</StatusBadge>;
        }
        return (
          <div className="space-y-0.5">
            <StatusBadge tone="teal">
              {usage.count} {usage.count === 1 ? "PW" : "PWs"}
            </StatusBadge>
            <p className="max-w-xs truncate text-xs text-slate-500" title={usage.titles.join(", ")}>
              {usage.titles.join(", ")}
            </p>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (t) => {
        const usage = dependenciesKnown
          ? usageByToothId.get(Number(t.id)) || { count: 0, titles: [] }
          : null;
        const isReferenced = usage ? usage.count > 0 : false;
        return (
          <div className="inline-flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTooth({ id: t.id, name: t.name || "" });
                setUpdateMode(true);
                setModalOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faPen} className="h-3 w-3" aria-hidden="true" />
              Edit
            </Button>
            {isReferenced ? (
              <Button
                variant="ghost"
                size="sm"
                disabled
                title={`Protected: referenced by ${usage.titles.join(", ")}`}
                aria-label={`Cannot delete ${t.name}: referenced by ${usage.count} practical work(s)`}
                className="text-slate-400"
              >
                <FontAwesomeIcon icon={faLock} className="h-3 w-3" aria-hidden="true" />
                In use
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(t)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" aria-hidden="true" />
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teeth catalog"
        description="Define anatomical tooth types referenced by practical-work assignments."
        actions={
          <Button
            onClick={() => {
              setTooth({ id: "", name: "" });
              setUpdateMode(false);
              setModalOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" aria-hidden="true" />
            Add tooth
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total teeth" value={counts.total} icon={faTooth} />
        <StatCard label="In use" value={counts.inUse} icon={faLock} />
        <StatCard label="Unused" value={counts.unused} icon={faCheckCircle} />
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
        <span>
          Teeth referenced by practical works are protected from deletion to preserve assignments,
          student submissions, and PDF reports. Reassign or delete referencing practical works first
          to unlock deletion.
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          id="prof-tooth-search"
          label="Search teeth"
          value={search}
          onChange={setSearch}
          placeholder="Search tooth name..."
          className="sm:w-72"
        />
        <FilterSelect
          id="prof-tooth-usage-filter"
          label="Filter by usage"
          value={usageFilter}
          onChange={(e) => setUsageFilter(e.target.value)}
          className="sm:w-48"
          options={[
            { value: "all", label: "All teeth" },
            { value: "in-use", label: "In use" },
            { value: "unused", label: "Unused" },
          ]}
        />
      </div>

      {loading ? (
        <LoadingState label="Loading teeth catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTeeth} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          emptyState={<EmptyState title="No teeth found" description="No tooth entries match the current filter." />}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={updateMode ? "Edit tooth" : "Add tooth"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="tooth-form" loading={saving}>
              {updateMode ? "Save changes" : "Add tooth"}
            </Button>
          </>
        }
      >
        <form id="tooth-form" onSubmit={handleSave}>
          <FormField id="tooth-name" label="Tooth name" required>
            <input
              id="tooth-name"
              name="name"
              value={tooth.name}
              onChange={(e) => setTooth((t) => ({ ...t, name: e.target.value }))}
              placeholder="e.g. Maxillary First Molar #16"
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete tooth"
        message={deleteTarget ? `Delete tooth "${deleteTarget.name}"?` : ""}
        confirmLabel="Delete tooth"
      />
    </div>
  );
};

export default Tooth;
