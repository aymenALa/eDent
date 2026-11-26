import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import SearchInput from "../ui/SearchInput";
import FilterSelect from "../ui/FilterSelect";
import DataTable from "../ui/DataTable";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import FormField from "../ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE, authHeaders, getAuthUser } from "../../utils/api";

const EMPTY_STUDENT = {
  id: "",
  userName: "",
  firstName: "",
  lastName: "",
  password: "",
  email: "",
  number: "",
  group: { id: "" },
};

const PAGE_SIZE = 10;

const Student = () => {
  const userlogin = getAuthUser() || {};
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [student, setStudent] = useState(EMPTY_STUDENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studRes, grpRes] = await Promise.all([
        axios.get(`${API_BASE}/users/students/${userlogin.id}`),
        axios.get(`${API_BASE}/groups/professor/${userlogin.id}`),
      ]);
      setStudents(Array.isArray(studRes.data) ? studRes.data : []);
      setGroups(Array.isArray(grpRes.data) ? grpRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, [userlogin.id]);

  useEffect(() => {
    if (userlogin.id) loadData();
  }, [loadData, userlogin.id]);

  const openCreate = () => {
    setStudent(EMPTY_STUDENT);
    setUpdateMode(false);
    setFormErr("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setStudent({
      id: item.id,
      userName: item.userName || "",
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      password: "",
      email: item.email || "",
      number: item.number || "",
      group: { id: item.group?.id ? String(item.group.id) : "" },
    });
    setUpdateMode(true);
    setFormErr("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStudent(EMPTY_STUDENT);
    setUpdateMode(false);
    setFormErr("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!student.firstName.trim() || !student.lastName.trim() || !student.email.trim()) {
      setFormErr("First name, last name, and email are required.");
      return;
    }
    if (!updateMode && (!student.userName.trim() || !student.password || !student.group.id)) {
      setFormErr("Username, password, and group are required for new students.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      if (updateMode) {
        await axios.put(`${API_BASE}/users/update/${student.id}`, student);
        toast.success("Student updated successfully.");
      } else {
        await axios.post(`${API_BASE}/users/register/student`, student);
        toast.success("Student created successfully.");
      }
      closeModal();
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "Could not save student.";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const rep = await axios.delete(
        `${API_BASE}/users/delete/student/${userlogin.id}/${deleteTarget.id}`,
        { headers: authHeaders() }
      );
      toast.success(rep.data?.message || "Student deleted successfully.");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete this student.");
      setDeleteTarget(null);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (groupFilter !== "all" && String(s.group?.id) !== groupFilter) return false;
      if (!q) return true;
      return [s.firstName, s.lastName, s.userName, s.email, s.number, s.group?.code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [students, search, groupFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = [
    {
      key: "student",
      label: "Student",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar photo={s.photo} firstName={s.firstName} lastName={s.lastName} size="sm" />
          <div>
            <p className="font-medium text-[#0F172A]">
              {s.firstName} {s.lastName}
            </p>
            <p className="text-xs text-slate-500">@{s.userName}</p>
          </div>
        </div>
      ),
    },
    { key: "email", label: "Email", render: (s) => <span className="text-slate-600">{s.email}</span> },
    { key: "number", label: "Phone", render: (s) => <span className="text-slate-600">{s.number || "—"}</span> },
    { key: "group", label: "Group", render: (s) => <span className="text-slate-600">{s.group?.code || "—"}</span> },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (s) => (
        <div className="inline-flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
            <FontAwesomeIcon icon={faPen} className="h-3 w-3" aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(s)}
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
        title="Students"
        description="Enroll students into your academic groups and maintain their contact details."
        actions={
          <Button onClick={openCreate}>
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" aria-hidden="true" />
            Add student
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          id="prof-student-search"
          label="Search students"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, email, or phone..."
          className="sm:w-72"
        />
        <FilterSelect
          id="prof-student-group-filter"
          label="Filter by group"
          value={groupFilter}
          onChange={(e) => {
            setGroupFilter(e.target.value);
            setPage(1);
          }}
          className="sm:w-48"
          options={[
            { value: "all", label: "All groups" },
            ...groups.map((g) => ({ value: String(g.id), label: g.code })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingState label="Loading students..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={pageRows}
            rowKey={(s) => s.id}
            emptyState={
              <EmptyState
                title="No students found"
                description="Add a student to one of your groups or adjust your search filter."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3" aria-hidden="true" />
                    Add student
                  </Button>
                }
              />
            }
          />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={updateMode ? "Edit student" : "Add student"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="student-form" loading={saving}>
              {updateMode ? "Save changes" : "Create student"}
            </Button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="stu-firstName" label="First name" required>
              <input
                id="stu-firstName"
                name="firstName"
                value={student.firstName}
                onChange={(e) => setStudent((s) => ({ ...s, firstName: e.target.value }))}
                required
                className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
              />
            </FormField>
            <FormField id="stu-lastName" label="Last name" required>
              <input
                id="stu-lastName"
                name="lastName"
                value={student.lastName}
                onChange={(e) => setStudent((s) => ({ ...s, lastName: e.target.value }))}
                required
                className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="stu-userName" label="Username" required={!updateMode}>
              <input
                id="stu-userName"
                name="userName"
                value={student.userName}
                onChange={(e) => setStudent((s) => ({ ...s, userName: e.target.value }))}
                required={!updateMode}
                className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
              />
            </FormField>
            <FormField id="stu-number" label="Phone number">
              <input
                id="stu-number"
                name="number"
                value={student.number}
                onChange={(e) => setStudent((s) => ({ ...s, number: e.target.value }))}
                className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
              />
            </FormField>
          </div>
          <FormField id="stu-email" label="Email" required>
            <input
              id="stu-email"
              type="email"
              name="email"
              value={student.email}
              onChange={(e) => setStudent((s) => ({ ...s, email: e.target.value }))}
              required
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            />
          </FormField>
          {!updateMode && (
            <FormField id="stu-password" label="Password" required>
              <input
                id="stu-password"
                type="password"
                name="password"
                value={student.password}
                onChange={(e) => setStudent((s) => ({ ...s, password: e.target.value }))}
                required
                className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
              />
            </FormField>
          )}
          <FormField id="stu-group" label="Group" required={!updateMode}>
            <select
              id="stu-group"
              value={student.group.id}
              onChange={(e) =>
                setStudent((s) => ({ ...s, group: { ...s.group, id: e.target.value } }))
              }
              required={!updateMode}
              className="block w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E]"
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code}
                </option>
              ))}
            </select>
          </FormField>
          {formErr && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formErr}
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete student"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.email}) and their submissions?`
            : ""
        }
        confirmLabel="Delete student"
      />
    </div>
  );
};

export default Student;
