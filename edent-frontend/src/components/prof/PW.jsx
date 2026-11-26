import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import SearchInput from "../ui/SearchInput";
import DataTable from "../ui/DataTable";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import FormField from "../ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE } from "../../utils/api";

const EMPTY_PW = { id: "", title: "", objectif: "", docs: null, tooth: { id: "" } };

const PW = () => {
  const [pws, setPWs] = useState([]);
  const [teeth, setTeeth] = useState([]);
  const [pw, setPW] = useState(EMPTY_PW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pwRes, toothRes] = await Promise.all([
        axios.get(`${API_BASE}/pws/all`),
        axios.get(`${API_BASE}/teeth/all`),
      ]);
      setPWs(Array.isArray(pwRes.data) ? pwRes.data : []);
      setTeeth(Array.isArray(toothRes.data) ? toothRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load practical works.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!pw.title.trim() || !pw.objectif.trim()) {
      toast.error("Title and objective are required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...pw,
      docs: pw.docs || null,
      tooth: pw.tooth?.id ? { id: pw.tooth.id } : null,
    };
    try {
      if (updateMode) {
        const rep = await axios.put(`${API_BASE}/pws/update/${pw.id}`, payload);
        toast.success(rep.data?.message || "Practical work updated.");
      } else {
        const rep = await axios.post(`${API_BASE}/pws/add`, payload);
        toast.success(rep.data?.message || "Practical work created.");
      }
      setModalOpen(false);
      setPW(EMPTY_PW);
      setUpdateMode(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save practical work.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const rep = await axios.delete(`${API_BASE}/pws/delete/${deleteTarget.id}`);
      toast.success(rep.data?.message || "Practical work deleted.");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete practical work.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pws;
    return pws.filter((item) =>
      [item.title, item.objectif, item.tooth?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [pws, search]);

  const columns = [
    { key: "title", label: "Title", render: (p) => <span className="font-semibold">{p.title}</span> },
    {
      key: "objectif",
      label: "Objective",
      render: (p) => <span className="line-clamp-2 max-w-md whitespace-normal text-slate-600">{p.objectif}</span>,
    },
    {
      key: "tooth",
      label: "Target tooth",
      render: (p) => <StatusBadge tone="teal">{p.tooth?.name || "Unassigned"}</StatusBadge>,
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (p) => (
        <div className="inline-flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPW({
                id: p.id,
                title: p.title || "",
                objectif: p.objectif || "",
                docs: p.docs || null,
                tooth: { id: p.tooth?.id ? String(p.tooth.id) : "" },
              });
              setUpdateMode(true);
              setModalOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faPen} className="h-3 w-3" aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(p)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" aria-hidden="true" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Practical work"
        description="Create and maintain dental practical-work assignments for your student groups."
        actions={
          <Button
            onClick={() => {
              setPW(EMPTY_PW);
              setUpdateMode(false);
              setModalOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" aria-hidden="true" />
            Create PW
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          id="prof-pw-search"
          label="Search practical works"
          value={search}
          onChange={setSearch}
          placeholder="Search by title, objective, or tooth..."
          className="sm:w-72"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading practical works..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(p) => p.id}
          emptyState={
            <EmptyState
              title="No practical works found"
              description="Create a practical work module to assign to your groups."
            />
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={updateMode ? "Edit practical work" : "Create practical work"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="pw-form" loading={saving}>
              {updateMode ? "Save changes" : "Create PW"}
            </Button>
          </>
        }
      >
        <form id="pw-form" onSubmit={handleSave} className="space-y-4">
          <FormField id="pw-title" label="Title" required>
            <input
              id="pw-title"
              name="title"
              value={pw.title}
              onChange={(e) => setPW((prev) => ({ ...prev, title: e.target.value }))}
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
          <FormField id="pw-objectif" label="Objective" required>
            <textarea
              id="pw-objectif"
              name="objectif"
              rows={3}
              value={pw.objectif}
              onChange={(e) => setPW((prev) => ({ ...prev, objectif: e.target.value }))}
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
          <FormField id="pw-tooth" label="Target tooth">
            <select
              id="pw-tooth"
              value={pw.tooth?.id || ""}
              onChange={(e) =>
                setPW((prev) => ({ ...prev, tooth: { id: e.target.value } }))
              }
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            >
              <option value="">Select a tooth...</option>
              {teeth.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete practical work"
        message={deleteTarget ? `Delete "${deleteTarget.title}"?` : ""}
        confirmLabel="Delete PW"
      />
    </div>
  );
};

export default PW;
