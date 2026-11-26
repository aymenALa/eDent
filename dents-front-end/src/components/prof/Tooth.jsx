import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faPlus, faTooth, faTrash } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import SearchInput from "../ui/SearchInput";
import DataTable from "../ui/DataTable";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import FormField from "../ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE } from "../../utils/api";

const Tooth = () => {
  const [teeth, setTeeth] = useState([]);
  const [tooth, setTooth] = useState({ id: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeeth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rep = await axios.get(`${API_BASE}/teeth/all`);
      setTeeth(Array.isArray(rep.data) ? rep.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load teeth.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeeth();
  }, [fetchTeeth]);

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
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teeth;
    return teeth.filter((t) => t.name && t.name.toLowerCase().includes(q));
  }, [teeth, search]);

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
      key: "actions",
      label: "Actions",
      align: "right",
      render: (t) => (
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(t)}
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

      <div className="mb-4">
        <SearchInput
          id="prof-tooth-search"
          label="Search teeth"
          value={search}
          onChange={setSearch}
          placeholder="Search tooth name..."
          className="sm:w-72"
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
          emptyState={<EmptyState title="No teeth defined" description="Add a tooth type to link with practical work." />}
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
