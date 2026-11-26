import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { faChartBar, faPeopleGroup, faUser } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE, getAuthUser } from "../../utils/api";

const Statistiques = () => {
  const userlogin = getAuthUser() || {};
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rep = await axios.get(`${API_BASE}/groups/professor/${userlogin.id}`);
      setGroups(Array.isArray(rep.data) ? rep.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load group statistics.");
    } finally {
      setLoading(false);
    }
  }, [userlogin.id]);

  useEffect(() => {
    if (userlogin.id) fetchGroups();
  }, [fetchGroups, userlogin.id]);

  const metrics = useMemo(() => {
    const totalGroups = groups.length;
    const totalStudents = groups.reduce((acc, g) => acc + (g.student?.length || 0), 0);
    const avgStudents = totalGroups > 0 ? Number((totalStudents / totalGroups).toFixed(1)) : 0;
    return { totalGroups, totalStudents, avgStudents };
  }, [groups]);

  const labels = groups.map((g) => g.code);
  const studentCounts = groups.map((g) => g.student?.length || 0);
  const pwCounts = groups.map((g) => g.pws?.length || 0);

  const commonOptions = (axisLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0 },
        title: { display: true, text: axisLabel, color: "#475569", font: { size: 12 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#0F172A", font: { size: 12, weight: "500" } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0F172A",
        padding: 10,
        cornerRadius: 8,
      },
    },
  });

  const studentsData = {
    labels,
    datasets: [
      {
        label: "Enrolled students",
        backgroundColor: "#0F766E",
        borderRadius: 6,
        data: studentCounts,
      },
    ],
  };

  const pwsData = {
    labels,
    datasets: [
      {
        label: "Assigned practical works",
        backgroundColor: "#14B8A6",
        borderRadius: 6,
        data: pwCounts,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Cohort enrollment and practical-work assignment metrics derived from your active groups."
      />

      {loading ? (
        <LoadingState label="Loading group statistics..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchGroups} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total enrolled students" value={metrics.totalStudents} icon={faUser} />
            <StatCard label="Total groups" value={metrics.totalGroups} icon={faPeopleGroup} />
            <StatCard
              label="Average students / group"
              value={metrics.avgStudents}
              icon={faChartBar}
              hint={metrics.totalGroups ? `Across ${metrics.totalGroups} groups` : "No groups yet"}
            />
          </div>

          {!groups.length ? (
            <EmptyState
              title="No group data available"
              description="Create at least one group to visualize student and practical-work distributions."
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[#0F172A]">Students per group</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Current student headcount in each academic cohort.
                </p>
                <div className="mt-4 h-72">
                  <Bar data={studentsData} options={commonOptions("Enrolled students")} />
                </div>
              </section>

              <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Practical works per group
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Number of practical-work assignments linked to each cohort.
                </p>
                <div className="mt-4 h-72">
                  <Bar data={pwsData} options={commonOptions("Assigned practical works")} />
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Statistiques;
