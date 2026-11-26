import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDownload,
  faNoteSticky,
  faPaperclip,
  faPeopleGroup,
  faPlus,
  faRefresh,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import "chart.js/auto";
import { Bar } from "react-chartjs-2";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import SearchInput from "../ui/SearchInput";
import FilterSelect from "../ui/FilterSelect";
import DataTable from "../ui/DataTable";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import StudentDetails from "./StudentDetails";
import { API_BASE, getAuthUser } from "../../utils/api";
import { exportStudentDirectoryPdf } from "../../utils/pdfExport";

const Dashboard = () => {
  const userlogin = getAuthUser() || {};
  const [groups, setGroups] = useState([]);
  const [pws, setPws] = useState([]);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState("");
  const [groupId, setGroupId] = useState("-1");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [profInfo, setProfInfo] = useState(userlogin);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studentsRes, groupsRes, pwsRes, profRes] = await Promise.all([
        axios.get(`${API_BASE}/users/students/${userlogin.id}`),
        axios.get(`${API_BASE}/groups/professor/${userlogin.id}`),
        axios.get(`${API_BASE}/pws/all`),
        axios.get(`${API_BASE}/users/${userlogin.id}`),
      ]);
      const studentList = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      setStudents(studentList);
      setTotalStudents(studentList.length);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      setPws(Array.isArray(pwsRes.data) ? pwsRes.data : []);
      if (profRes.data) setProfInfo(profRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load professor dashboard.");
    } finally {
      setLoading(false);
    }
  }, [userlogin.id]);

  useEffect(() => {
    if (userlogin.id) loadOverview();
  }, [loadOverview, userlogin.id]);

  const handleGroupChange = async (e) => {
    const selectedGroupId = e.target.value;
    setGroupId(selectedGroupId);
    setFiltering(true);
    setError("");
    try {
      if (selectedGroupId === "-1") {
        const rep = await axios.get(`${API_BASE}/users/students/${userlogin.id}`);
        const list = Array.isArray(rep.data) ? rep.data : [];
        setStudents(list);
        setTotalStudents(list.length);
      } else {
        const rep = await axios.get(`${API_BASE}/users/students/group/${selectedGroupId}`);
        setStudents(Array.isArray(rep.data) ? rep.data : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not filter students by group.");
    } finally {
      setFiltering(false);
    }
  };

  const resetFilter = () => {
    setGroupId("-1");
    setSearch("");
    loadOverview();
  };

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.firstName, s.lastName, s.email, s.number, s.group?.code]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }, [students, search]);

  const downloadPdf = async () => {
    const selectedGroup =
      groupId === "-1"
        ? "All groups"
        : groups.find((g) => String(g.id) === groupId)?.code || "Selected group";
    await exportStudentDirectoryPdf({
      students: filteredStudents,
      professor: profInfo,
      groupLabel: selectedGroup,
    });
  };

  if (selectedStudentId) {
    return (
      <div>
        <div className="mb-5">
          <Button variant="secondary" size="sm" onClick={() => setSelectedStudentId(null)}>
            <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" aria-hidden="true" />
            Back to student directory
          </Button>
        </div>
        <StudentDetails id={selectedStudentId} />
      </div>
    );
  }

  const groupChartData = {
    labels: groups.map((g) => g.code),
    datasets: [
      {
        label: "Students",
        data: groups.map((g) => g.student?.length || 0),
        backgroundColor: "#0F766E",
        borderRadius: 5,
      },
      {
        label: "Assigned PWs",
        data: groups.map((g) => g.pws?.length || 0),
        backgroundColor: "#14B8A6",
        borderRadius: 5,
      },
    ],
  };

  const groupChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
      y: { grid: { display: false } },
    },
    plugins: { legend: { position: "top" } },
  };

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
            {s.userName && <p className="text-xs text-slate-500">@{s.userName}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (s) => <span className="text-slate-600">{s.email}</span>,
    },
    {
      key: "number",
      label: "Phone",
      render: (s) => <span className="text-slate-600">{s.number || "—"}</span>,
    },
    {
      key: "group",
      label: "Group",
      render: (s) => <span className="text-slate-600">{s.group?.code || "—"}</span>,
    },
    {
      key: "action",
      label: "Submission review",
      align: "right",
      render: (s) => (
        <Button variant="secondary" size="sm" onClick={() => setSelectedStudentId(s.id)}>
          Inspect work
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professor dashboard"
        description="Overview of your assigned groups, enrolled students, and practical-work modules."
        actions={
          <Button variant="secondary" onClick={downloadPdf} disabled={!filteredStudents.length}>
            <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" aria-hidden="true" />
            Export PDF
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My groups" value={groups.length} icon={faPeopleGroup} />
        <StatCard label="My students" value={totalStudents} icon={faUser} />
        <StatCard label="Catalog PWs" value={pws.length} icon={faNoteSticky} />
      </div>

      {/* Group Distribution + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Cohort &amp; assignment distribution
              </h2>
              <p className="text-xs text-slate-500">
                Students and assigned practical works across your active groups.
              </p>
            </div>
            <Link
              to="/professor/stats"
              className="text-xs font-medium text-[#0F766E] hover:underline"
            >
              Full analytics
            </Link>
          </div>
          {groups.length ? (
            <div className="h-56">
              <Bar data={groupChartData} options={groupChartOptions} />
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              No groups created yet.
            </p>
          )}
        </section>

        <section className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Quick actions</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Jump directly to your academic management workflows.
            </p>
            <div className="mt-4 space-y-2.5">
              <Link
                to="/professor/student"
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3.5 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#0F766E] hover:bg-teal-50/40"
              >
                <span className="inline-flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
                  Manage students
                </span>
                <span className="text-xs text-slate-500">{totalStudents}</span>
              </Link>
              <Link
                to="/professor/group"
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3.5 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#0F766E] hover:bg-teal-50/40"
              >
                <span className="inline-flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faPeopleGroup} className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
                  Manage groups &amp; PWs
                </span>
                <span className="text-xs text-slate-500">{groups.length}</span>
              </Link>
              <Link
                to="/professor/pw"
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3.5 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#0F766E] hover:bg-teal-50/40"
              >
                <span className="inline-flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faPaperclip} className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
                  Practical-work catalog
                </span>
                <span className="text-xs text-slate-500">{pws.length}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Student Directory Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Student list</h2>
          <p className="text-xs text-slate-500">
            Showing {filteredStudents.length} of {students.length} students
            {groupId !== "-1" ? " in selected group" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            id="prof-dash-search"
            label="Search students"
            value={search}
            onChange={setSearch}
            placeholder="Search students..."
            className="w-full sm:w-64"
          />
          <FilterSelect
            id="prof-dash-group"
            label="Filter by group"
            value={groupId}
            onChange={handleGroupChange}
            className="w-full sm:w-44"
            options={[
              { value: "-1", label: "All groups" },
              ...groups.map((g) => ({ value: String(g.id), label: g.code })),
            ]}
          />
          <Button variant="ghost" size="sm" onClick={resetFilter} aria-label="Reset student filter">
            <FontAwesomeIcon icon={faRefresh} className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      {loading || filtering ? (
        <LoadingState label="Loading students..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadOverview} />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredStudents}
          rowKey={(s) => s.id}
          emptyState={
            <EmptyState
              title="No students found"
              description={
                search || groupId !== "-1"
                  ? "No students match the selected group or search term."
                  : "No students are assigned to your groups yet."
              }
            />
          }
        />
      )}
    </div>
  );
};

export default Dashboard;
