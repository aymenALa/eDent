import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import SearchInput from "../ui/SearchInput";
import FilterSelect from "../ui/FilterSelect";
import DataTable from "../ui/DataTable";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import StatusBadge from "../ui/StatusBadge";
import SubmissionReview from "../SubmissionReview";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE, getAuthUser } from "../../utils/api";
import { exportSubmissionPdf } from "../../utils/pdfExport";

const PAGE_SIZE = 10;
const formatScore = (val) => Number((Number(val) || 0).toFixed(2));

const Submissions = () => {
  const userlogin = getAuthUser() || {};
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pws, setPws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [pwFilter, setPwFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [activeReview, setActiveReview] = useState(null);
  const [exporting, setExporting] = useState(false);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studRes, grpRes, pwRes] = await Promise.all([
        axios.get(`${API_BASE}/users/students/${userlogin.id}`),
        axios.get(`${API_BASE}/groups/professor/${userlogin.id}`),
        axios.get(`${API_BASE}/pws/all`),
      ]);
      setStudents(Array.isArray(studRes.data) ? studRes.data : []);
      setGroups(Array.isArray(grpRes.data) ? grpRes.data : []);
      setPws(Array.isArray(pwRes.data) ? pwRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load student submissions.");
    } finally {
      setLoading(false);
    }
  }, [userlogin.id]);

  useEffect(() => {
    if (userlogin.id) loadSubmissions();
  }, [loadSubmissions, userlogin.id]);

  const rows = useMemo(() => {
    const pwMap = new Map(pws.map((p) => [p.id, p]));
    const list = [];
    for (const student of students) {
      const groupPws = student.group?.pws || [];
      for (const gp of groupPws) {
        if (!pwMap.has(gp.id)) pwMap.set(gp.id, gp);
      }
      for (const spw of student.studentPWS || []) {
        const pwId = spw.id?.pw_id || spw.pw?.id;
        const pwObj = spw.pw || pwMap.get(pwId) || { id: pwId, title: `PW #${pwId}` };
        const total = formatScore((spw.noteFront || 0) + (spw.noteSide || 0));
        list.push({
          rowId: `${student.id}-${pwId}`,
          student,
          pw: pwObj,
          submission: spw,
          totalScore: total,
        });
      }
    }
    return list.sort((a, b) => String(b.submission.date || "").localeCompare(String(a.submission.date || "")));
  }, [students, pws]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (groupFilter !== "all" && String(item.student.group?.id) !== groupFilter) return false;
      if (pwFilter !== "all" && String(item.pw?.id) !== pwFilter) return false;
      if (!q) return true;
      return [
        item.student.firstName,
        item.student.lastName,
        item.student.email,
        item.student.group?.code,
        item.pw?.title,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, groupFilter, pwFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleExportPdf = async () => {
    if (!activeReview) return;
    setExporting(true);
    try {
      await exportSubmissionPdf(activeReview);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "student",
      label: "Student",
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar
            photo={r.student.photo}
            firstName={r.student.firstName}
            lastName={r.student.lastName}
            size="sm"
          />
          <div>
            <p className="font-medium text-[#0F172A]">
              {r.student.firstName} {r.student.lastName}
            </p>
            <p className="text-xs text-slate-500">{r.student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "group",
      label: "Group",
      render: (r) => <span className="text-slate-600">{r.student.group?.code || "—"}</span>,
    },
    {
      key: "pw",
      label: "Practical work",
      render: (r) => (
        <div>
          <p className="font-medium text-[#0F172A]">{r.pw?.title}</p>
          {r.pw?.tooth?.name && <p className="text-xs text-slate-500">{r.pw.tooth.name}</p>}
        </div>
      ),
    },
    {
      key: "date",
      label: "Submitted on",
      render: (r) => (
        <span className="text-slate-600">
          {r.submission.date || "—"} {r.submission.time ? `• ${r.submission.time}` : ""}
        </span>
      ),
    },
    {
      key: "score",
      label: "Prototype score",
      render: (r) => <StatusBadge tone="teal">{r.totalScore}/20</StatusBadge>,
    },
    {
      key: "action",
      label: "Review",
      align: "right",
      render: (r) => (
        <Button variant="secondary" size="sm" onClick={() => setActiveReview(r)}>
          <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" aria-hidden="true" />
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student submissions"
        description="Inspect submitted front and side tooth analyses, angles, and prototype scores across your cohorts."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Submitted analyses" value={rows.length} icon={faCheckCircle} />
        <StatCard label="My groups" value={groups.length} />
        <StatCard label="Students in scope" value={students.length} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs font-medium text-slate-500">
          Showing {filtered.length} of {rows.length} submissions
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            id="prof-sub-search"
            label="Search submissions"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search student or PW..."
            className="w-full sm:w-60"
          />
          <FilterSelect
            id="prof-sub-group"
            label="Filter by group"
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
            options={[
              { value: "all", label: "All groups" },
              ...groups.map((g) => ({ value: String(g.id), label: g.code })),
            ]}
          />
          <FilterSelect
            id="prof-sub-pw"
            label="Filter by practical work"
            value={pwFilter}
            onChange={(e) => {
              setPwFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-56"
            options={[
              { value: "all", label: "All practical works" },
              ...pws.map((p) => ({ value: String(p.id), label: p.title })),
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading student submissions..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSubmissions} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={pageRows}
            rowKey={(r) => r.rowId}
            emptyState={
              <EmptyState
                title="No submissions found"
                description="No submitted practical work matches your current filters."
              />
            }
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
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
        open={Boolean(activeReview)}
        onClose={() => setActiveReview(null)}
        bodyId="modal"
        size="xl"
        title={
          activeReview
            ? `${activeReview.student.firstName} ${activeReview.student.lastName} — ${activeReview.pw.title}`
            : "Submission review"
        }
        subtitle="Professor submission inspection"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setActiveReview(null)}>
              Close
            </Button>
            <Button onClick={handleExportPdf} loading={exporting}>
              <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" aria-hidden="true" />
              Export PDF
            </Button>
          </div>
        }
      >
        {activeReview && (
          <SubmissionReview
            student={activeReview.student}
            pw={activeReview.pw}
            submission={activeReview.submission}
          />
        )}
      </Modal>
    </div>
  );
};

export default Submissions;
