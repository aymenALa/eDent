import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPen, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import SearchInput from "../ui/SearchInput";
import DataTable from "../ui/DataTable";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import FormField from "../ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE, authHeaders, getAuthUser, useDemoMode } from "../../utils/api";

const EMPTY_GROUP = { id: "", code: "", year: "" };

const Group = () => {
  const userlogin = getAuthUser() || {};
  const demoReadOnly = useDemoMode();
  const [groups, setGroups] = useState([]);
  const [pws, setPws] = useState([]);
  const [group, setGroup] = useState(EMPTY_GROUP);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [pwModalGroup, setPwModalGroup] = useState(null);
  const [pwId, setPwId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [grpRes, pwRes] = await Promise.all([
        axios.get(`${API_BASE}/groups/professor/${userlogin.id}`),
        axios.get(`${API_BASE}/pws/all`),
      ]);
      setGroups(Array.isArray(grpRes.data) ? grpRes.data : []);
      setPws(Array.isArray(pwRes.data) ? pwRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load groups.");
    } finally {
      setLoading(false);
    }
  }, [userlogin.id]);

  useEffect(() => {
    if (userlogin.id) loadData();
  }, [loadData, userlogin.id]);

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!group.code.trim() || !group.year.trim()) {
      toast.error("Group code and academic year are required.");
      return;
    }
    setSaving(true);
    try {
      if (updateMode) {
        const rep = await axios.put(`${API_BASE}/groups/update/${group.id}`, group);
        toast.success(rep.data?.message || "Group updated successfully.");
      } else {
        const rep = await axios.post(`${API_BASE}/groups/add/${userlogin.id}`, group);
        toast.success(rep.data?.message || "Group created successfully.");
      }
      setModalOpen(false);
      setGroup(EMPTY_GROUP);
      setUpdateMode(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save group.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const rep = await axios.delete(`${API_BASE}/groups/delete/${deleteTarget.id}`, {
        headers: authHeaders(),
      });
      toast.success(rep.data?.message || "Group deleted successfully.");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete this group.");
      setDeleteTarget(null);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const assignPw = async () => {
    if (!pwModalGroup || !pwId) return;
    try {
      const rep = await axios.post(`${API_BASE}/groups/pw/${pwModalGroup.id}/${pwId}`);
      setPwModalGroup(rep.data);
      setPwId("");
      toast.success("Practical work assigned.");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not assign practical work.");
    }
  };

  const removePw = async (groupId, targetPwId) => {
    try {
      const rep = await axios.delete(`${API_BASE}/groups/pw/${groupId}/${targetPwId}`);
      setPwModalGroup(rep.data);
      toast.success("Practical work removed.");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove practical work.");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        (g.code && g.code.toLowerCase().includes(q)) ||
        (g.year && String(g.year).toLowerCase().includes(q))
    );
  }, [groups, search]);

  const columns = [
    { key: "code", label: "Group code", render: (g) => <span className="font-semibold">{g.code}</span> },
    { key: "year", label: "Academic year", render: (g) => <span className="text-slate-600">{g.year}</span> },
    {
      key: "students",
      label: "Students",
      render: (g) => <StatusBadge tone="neutral">{g.student?.length || 0} enrolled</StatusBadge>,
    },
    {
      key: "pws",
      label: "Practical works",
      render: (g) => <StatusBadge tone="teal">{g.pws?.length || 0} assigned</StatusBadge>,
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (g) => (
        <div className="inline-flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPwModalGroup(g);
              setPwId("");
            }}
          >
            <FontAwesomeIcon icon={faPaperclip} className="h-3 w-3" aria-hidden="true" />
            Assign PWs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setGroup({ id: g.id, code: g.code || "", year: g.year || "" });
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
            disabled={demoReadOnly}
            title={demoReadOnly ? "Disabled in public demo mode" : undefined}
            onClick={() => setDeleteTarget(g)}
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
        title="Groups"
        description="Organize student cohorts and assign practical-work modules to each group."
        actions={
          <Button
            disabled={demoReadOnly}
            title={demoReadOnly ? "Disabled in public demo mode" : undefined}
            onClick={() => {
              setGroup(EMPTY_GROUP);
              setUpdateMode(false);
              setModalOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" aria-hidden="true" />
            Add group
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          id="prof-group-search"
          label="Search groups"
          value={search}
          onChange={setSearch}
          placeholder="Search by group code or year..."
          className="sm:w-72"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading groups..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(g) => g.id}
          emptyState={
            <EmptyState
              title="No groups found"
              description="Create a group to enroll students and assign practical work."
            />
          }
        />
      )}

      {/* Create / Edit Group */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={updateMode ? "Edit group" : "Create group"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="group-form" loading={saving}>
              {updateMode ? "Save changes" : "Create group"}
            </Button>
          </>
        }
      >
        <form id="group-form" onSubmit={handleSaveGroup} className="space-y-4">
          <FormField id="grp-code" label="Group code" required>
            <input
              id="grp-code"
              name="code"
              value={group.code}
              onChange={(e) => setGroup((g) => ({ ...g, code: e.target.value }))}
              placeholder="e.g. GRP-DENT-01"
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
          <FormField id="grp-year" label="Academic year" required>
            <input
              id="grp-year"
              name="year"
              value={group.year}
              onChange={(e) => setGroup((g) => ({ ...g, year: e.target.value }))}
              placeholder="e.g. 2026"
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
        </form>
      </Modal>

      {/* Assign PWs Modal */}
      <Modal
        open={Boolean(pwModalGroup)}
        onClose={() => setPwModalGroup(null)}
        title={pwModalGroup ? `Practical works — ${pwModalGroup.code}` : "Assign practical works"}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setPwModalGroup(null)}>
            Done
          </Button>
        }
      >
        {pwModalGroup && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                aria-label="Select practical work to assign"
                value={pwId}
                onChange={(e) => setPwId(e.target.value)}
                className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
              >
                <option value="">Select practical work...</option>
                {pws.map((item) => {
                  const alreadyAssigned = pwModalGroup.pws?.some((p) => Number(p.id) === Number(item.id));
                  return (
                    <option key={item.id} value={item.id} disabled={alreadyAssigned}>
                      {item.title}{alreadyAssigned ? " (already assigned)" : ""}
                    </option>
                  );
                })}
              </select>
              <Button onClick={assignPw} disabled={!pwId}>
                Assign
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Currently assigned ({pwModalGroup.pws?.length || 0})
              </p>
              {!pwModalGroup.pws?.length ? (
                <p className="text-sm text-slate-500">No practical work assigned to this group yet.</p>
              ) : (
                <ul className="divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0]">
                  {pwModalGroup.pws.map((assigned) => (
                    <li
                      key={assigned.id}
                      className="flex items-center justify-between px-3.5 py-2.5 text-sm"
                    >
                      <span className="font-medium text-[#0F172A]">{assigned.title}</span>
                      <button
                        type="button"
                        onClick={() => removePw(pwModalGroup.id, assigned.id)}
                        aria-label={`Remove ${assigned.title}`}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete group"
        message={deleteTarget ? `Delete group ${deleteTarget.code} and its assignments?` : ""}
        confirmLabel="Delete group"
      />
    </div>
  );
};

export default Group;
