import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faDownload,
  faEnvelope,
  faPeopleGroup,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import "chart.js/auto";
import { Line } from "react-chartjs-2";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import StatusBadge from "../ui/StatusBadge";
import SubmissionReview from "../SubmissionReview";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { API_BASE } from "../../utils/api";
import { exportSubmissionPdf } from "../../utils/pdfExport";

const formatScore = (val) => Number((Number(val) || 0).toFixed(2));

const StudentDetails = ({ id }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doTp, setDoTp] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [studentPw, setStudentPw] = useState(null);
  const [selectedPw, setSelectedPw] = useState(null);
  const [exporting, setExporting] = useState(false);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [userRes, tpRes] = await Promise.all([
        axios.get(`${API_BASE}/users/${id}`),
        axios.get(`${API_BASE}/users/testpw/${id}`),
      ]);
      setStudent(userRes.data);
      setDoTp(Array.isArray(tpRes.data) ? tpRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load student details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadStudent();
  }, [id, loadStudent]);

  const chartSeries = useMemo(() => {
    const pws = student?.group?.pws || [];
    const submissions = student?.studentPWS || [];
    const labels = [];
    const notes = [];
    for (const pw of pws) {
      labels.push(pw.title);
      const match = submissions.find(
        (s) => s.id?.pw_id === pw.id || s.id?.pwId === pw.id || s.pw?.id === pw.id
      );
      notes.push(match ? formatScore((match.noteSide || 0) + (match.noteFront || 0)) : 0);
    }
    return { labels, notes };
  }, [student]);

  const openSubmissionModal = (pwItem) => {
    const submissions = student?.studentPWS || [];
    const found =
      submissions.find(
        (s) => s.id?.pw_id === pwItem.id || s.id?.pwId === pwItem.id || s.pw?.id === pwItem.id
      ) || null;
    if (!found) {
      toast.error("Submission record could not be loaded for this practical work.");
      return;
    }
    setSelectedPw(pwItem);
    setStudentPw(found);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStudentPw(null);
    setSelectedPw(null);
  };

  const downloadPdfDocument = async () => {
    if (!student || !selectedPw || !studentPw) return;
    setExporting(true);
    try {
      await exportSubmissionPdf({ student, pw: selectedPw, submission: studentPw });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingState label="Loading student submission history..." />;
  if (error) return <ErrorState message={error} onRetry={loadStudent} />;
  if (!student) return <EmptyState title="Student not found" />;

  const pws = student.group?.pws || [];
  const chartData = {
    labels: chartSeries.labels,
    datasets: [
      {
        label: "Prototype total score (/20)",
        backgroundColor: "rgba(15, 118, 110, 0.15)",
        borderColor: "#0F766E",
        pointBackgroundColor: "#0F766E",
        tension: 0.25,
        data: chartSeries.notes,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: "Practical work" } },
      y: { title: { display: true, text: "Score (/20)" }, suggestedMin: 0, suggestedMax: 20 },
    },
    plugins: { legend: { display: true, position: "top" } },
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-start gap-5 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <Avatar
          photo={student.photo}
          firstName={student.firstName}
          lastName={student.lastName}
          size="lg"
        />
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#0F172A]">
            {student.firstName} {student.lastName}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {student.email}
            </span>
            {student.number && (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {student.number}
              </span>
            )}
            {student.group?.code && (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPeopleGroup} className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {student.group.code}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Assigned practical work
        </h3>
        {pws.length === 0 ? (
          <EmptyState
            title="No practical work assigned"
            description="This student's group has no practical-work assignments yet."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pws.map((pwItem, index) => {
              const submitted = Boolean(doTp[index]);
              return (
                <div
                  key={pwItem.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-[#0F172A]">{pwItem.title}</h4>
                      <StatusBadge tone={submitted ? "success" : "warning"}>
                        <FontAwesomeIcon
                          icon={submitted ? faCheckCircle : faClock}
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        {submitted ? "Submitted" : "Pending"}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{pwItem.objectif}</p>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant={submitted ? "primary" : "secondary"}
                      size="sm"
                      disabled={!submitted}
                      onClick={() => openSubmissionModal(pwItem)}
                      className="w-full"
                    >
                      {submitted ? "Inspect submission" : "Awaiting submission"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {pws.length > 0 && (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[#0F172A]">Student progression</h3>
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        </section>
      )}

      <Modal
        open={modalOpen && Boolean(studentPw) && Boolean(selectedPw)}
        onClose={closeModal}
        bodyId="modal"
        size="xl"
        title={studentPw && selectedPw ? `${student.lastName}-${selectedPw.title}` : "Submission review"}
        subtitle={`${student.firstName} ${student.lastName} • ${studentPw?.date || ""} ${studentPw?.time || ""} • Prototype educational measurement`}
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2.5">
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            <Button onClick={downloadPdfDocument} loading={exporting}>
              <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" aria-hidden="true" />
              Télécharger en PDF
            </Button>
          </div>
        }
      >
        {studentPw && (
          <SubmissionReview student={student} pw={selectedPw} submission={studentPw} />
        )}
      </Modal>
    </div>
  );
};

StudentDetails.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default StudentDetails;
