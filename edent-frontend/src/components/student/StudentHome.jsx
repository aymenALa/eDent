import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faCheckCircle,
  faClock,
  faEye,
  faInfoCircle,
  faTooth,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../layouts/AppShell";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import StatusBadge from "../ui/StatusBadge";
import SearchInput from "../ui/SearchInput";
import FilterSelect from "../ui/FilterSelect";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import SubmissionReview from "../SubmissionReview";
import AngleImageAnnotator from "./AngleImageAnnotator";
import { API_BASE, authHeaders, getAuthUser, setAuthUser, useDemoMode } from "../../utils/api";
import { compositeAnnotatedImage } from "../../utils/annotationCanvas";

const emptyAnalysis = () => ({ image: "", angles: [], points: [] });

const imagePayload = (dataUrl) => dataUrl?.split(",")[1] || null;

// Prototype score: each of the three guessed angles is compared with a neutral 90° target.
const scoreAngles = (angles) => {
  if (angles.length !== 3) return 0;
  const averageError = angles.reduce((sum, angle) => sum + Math.abs(90 - angle), 0) / 3;
  return Number(Math.max(0, 10 - averageError / 9).toFixed(2));
};

const StudentHome = () => {
  const userlogin = getAuthUser() || {};
  const studentId = userlogin.id;
  const demoReadOnly = useDemoMode();

  const [student, setStudent] = useState(null);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    number: "",
  });
  const [activeTab, setActiveTab] = useState("assignments");
  const [editingProfile, setEditingProfile] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPw, setSelectedPw] = useState(null);
  const [pendingNavTab, setPendingNavTab] = useState(null);
  const [viewSubmission, setViewSubmission] = useState(null);
  const [front, setFront] = useState(emptyAnalysis());
  const [side, setSide] = useState(emptyAnalysis());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isErrorMsg, setIsErrorMsg] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [studentResponse, completedResponse] = await Promise.all([
        fetch(`${API_BASE}/users/${studentId}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/users/testpw/${studentId}`, { headers: authHeaders() }),
      ]);
      if (!studentResponse.ok || !completedResponse.ok) {
        throw new Error("Could not load the student dashboard.");
      }
      const studentData = await studentResponse.json();
      setStudent(studentData);
      setProfile({
        firstName: studentData.firstName || "",
        lastName: studentData.lastName || "",
        userName: studentData.userName || "",
        email: studentData.email || "",
        number: studentData.number || "",
      });
      setCompleted(await completedResponse.json());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      loadDashboard();
    } else {
      setLoadError("No logged-in student was found.");
      setLoading(false);
    }
  }, [loadDashboard, studentId]);

  const hasUnsavedDraft = Boolean(
    selectedPw && (front.image || side.image || front.points?.length || side.points?.length)
  );

  const requestTabChange = (targetTab) => {
    if (!selectedPw) {
      setActiveTab(targetTab);
      return;
    }
    if (!hasUnsavedDraft) {
      setSelectedPw(null);
      setFront(emptyAnalysis());
      setSide(emptyAnalysis());
      setActiveTab(targetTab);
      return;
    }
    setPendingNavTab(targetTab);
  };

  const confirmLeaveStudio = () => {
    const target = pendingNavTab || "assignments";
    setPendingNavTab(null);
    setSelectedPw(null);
    setFront(emptyAnalysis());
    setSide(emptyAnalysis());
    setActiveTab(target);
  };

  const openAnalysis = (pw) => {
    setActiveTab("assignments");
    setSelectedPw(pw);
    setFront(emptyAnalysis());
    setSide(emptyAnalysis());
    setMessage("");
    setIsErrorMsg(false);
  };

  const updateProfileField = (event) => {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const cancelProfileEdit = () => {
    setProfile({
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      userName: student?.userName || "",
      email: student?.email || "",
      number: student?.number || "",
    });
    setEditingProfile(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setIsErrorMsg(false);
    try {
      const response = await fetch(`${API_BASE}/users/update/student/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(profile),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not update the profile.");
      setStudent((current) => ({ ...current, ...profile }));
      setAuthUser({ ...userlogin, ...profile });
      setEditingProfile(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      setIsErrorMsg(true);
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnalysis = async () => {
    if (front.angles.length !== 3 || side.angles.length !== 3) {
      setIsErrorMsg(true);
      setMessage("Select all nine landmarks on both images before submitting.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setIsErrorMsg(false);
    try {
      const [annotatedFrontUrl, annotatedSideUrl] = await Promise.all([
        compositeAnnotatedImage(front.image, front.points),
        compositeAnnotatedImage(side.image, side.points),
      ]);

      const [af1, bf1, cf1] = front.angles;
      const [as1, bs1, cs1] = side.angles;
      const body = {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toISOString().slice(0, 10),
        imageFront: imagePayload(annotatedFrontUrl),
        imageSide: imagePayload(annotatedSideUrl),
        af1,
        af2: Number((180 - af1).toFixed(2)),
        bf1,
        bf2: Number((180 - bf1).toFixed(2)),
        cf1,
        cf2: Number((180 - cf1).toFixed(2)),
        as1,
        as2: Number((180 - as1).toFixed(2)),
        bs1,
        bs2: Number((180 - bs1).toFixed(2)),
        cs1,
        cs2: Number((180 - cs1).toFixed(2)),
        noteFront: scoreAngles(front.angles),
        noteSide: scoreAngles(side.angles),
      };

      const response = await fetch(`${API_BASE}/studentpws/add/${studentId}/${selectedPw.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Submission failed.");
      setMessage("Analysis submitted successfully.");
      setSelectedPw(null);
      setFront(emptyAnalysis());
      setSide(emptyAnalysis());
      await loadDashboard();
    } catch (error) {
      setIsErrorMsg(true);
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pws = useMemo(() => student?.group?.pws || [], [student]);
  const submissions = useMemo(() => student?.studentPWS || [], [student]);
  const submittedCount = pws.filter((_, index) => Boolean(completed[index])).length;
  const pendingCount = Math.max(0, pws.length - submittedCount);
  const completionPct = pws.length > 0 ? Math.round((submittedCount / pws.length) * 100) : 0;
  const canSubmit = front.angles.length === 3 && side.angles.length === 3;

  const filteredPws = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pws
      .map((pw, index) => ({
        pw,
        isDone: Boolean(completed[index]),
        record: submissions.find((s) => s.id?.pw_id === pw.id) || null,
      }))
      .filter(({ pw, isDone }) => {
        if (statusFilter === "pending" && isDone) return false;
        if (statusFilter === "submitted" && !isDone) return false;
        if (!q) return true;
        return [pw.title, pw.objectif, pw.tooth?.name]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q));
      });
  }, [pws, completed, submissions, search, statusFilter]);

  const navItems = [
    {
      key: "assignments",
      label: "Practical work",
      icon: faBookOpen,
      active: Boolean(selectedPw) || activeTab === "assignments",
      onClick: () => requestTabChange("assignments"),
    },
    {
      key: "profile",
      label: "My profile",
      icon: faUser,
      active: !selectedPw && activeTab === "profile",
      onClick: () => requestTabChange("profile"),
    },
  ];

  return (
    <AppShell
      roleLabel="Student"
      pageTitle={selectedPw ? selectedPw.title : activeTab === "profile" ? "My profile" : "Practical work"}
      navItems={navItems}
      user={student || userlogin}
      onLogout={() => {
        localStorage.clear();
        window.location.href = "/";
      }}
    >
      {message && (
        <div
          role={isErrorMsg ? "alert" : "status"}
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            isErrorMsg
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-teal-200 bg-teal-50 text-[#134E4A]"
          }`}
        >
          {message}
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading student workspace..." />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={loadDashboard} />
      ) : selectedPw ? (
        /* Flagship Tooth Analysis Studio */
        <div className="space-y-5">
          <PageHeader
            title={selectedPw.title}
            description={selectedPw.objectif}
            actions={
              <Button variant="secondary" onClick={() => requestTabChange("assignments")}>
                <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" aria-hidden="true" />
                Back to assignments
              </Button>
            }
          />

          <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-xs text-[#134E4A]">
            <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Educational prototype measurement studio</p>
              <p className="mt-0.5 text-slate-600">
                Upload both Front and Side views and place 9 landmarks per image (Endpoint → Vertex →
                Endpoint for Cervical, Axial, and Incisal / occlusal angles). Landmarks are
                composited onto your submitted images. Prototype scoring is educational only.
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <AngleImageAnnotator label="Front" value={front} onChange={setFront} />
            <AngleImageAnnotator label="Side" value={side} onChange={setSide} />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span>
                Front:{" "}
                <strong className="text-[#0F172A]">
                  {front.angles.length === 3 ? `${scoreAngles(front.angles)}/10` : "Incomplete"}
                </strong>
              </span>
              <span>
                Side:{" "}
                <strong className="text-[#0F172A]">
                  {side.angles.length === 3 ? `${scoreAngles(side.angles)}/10` : "Incomplete"}
                </strong>
              </span>
              {!canSubmit && (
                <span className="text-amber-700">
                  Both Front and Side views require 9 landmarks before submission.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                onClick={() => requestTabChange("assignments")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitAnalysis}
                disabled={!canSubmit || demoReadOnly}
                loading={submitting}
                title={demoReadOnly ? "Saving submissions is disabled in public demo mode" : undefined}
              >
                {demoReadOnly ? "Demo mode (read-only)" : submitting ? "Submitting…" : "Submit analysis"}
              </Button>
            </div>
          </div>
        </div>
      ) : activeTab === "assignments" ? (
        <div className="space-y-6">
          <PageHeader
            title={`Welcome${student?.firstName ? `, ${student.firstName}` : ""}`}
            description={
              student?.group?.code
                ? `Group ${student.group.code} • Manage your assigned practical work and landmark submissions.`
                : "Manage your assigned practical work and landmark submissions."
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Assigned PWs" value={pws.length} icon={faTooth} />
            <StatCard label="Submitted" value={submittedCount} icon={faCheckCircle} />
            <StatCard label="Pending" value={pendingCount} icon={faClock} />
          </div>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#0F172A]">
                  Submission completion progress
                </h2>
                <p className="text-xs text-slate-500">
                  {pws.length > 0
                    ? `${submittedCount} of ${pws.length} assigned practical works submitted`
                    : "No practical work assigned yet"}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#0F766E]">{completionPct}%</span>
            </div>
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={completionPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#0F766E] transition-all duration-200"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">Assigned practical work</h2>
              <p className="text-xs text-slate-500">
                Showing {filteredPws.length} of {pws.length} assignments
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <SearchInput
                id="stud-pw-search"
                label="Search assignments"
                value={search}
                onChange={setSearch}
                placeholder="Search title or tooth..."
                className="sm:w-64"
              />
              <FilterSelect
                id="stud-pw-status"
                label="Filter by submission status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sm:w-44"
                options={[
                  { value: "all", label: "All assignments" },
                  { value: "pending", label: "Pending only" },
                  { value: "submitted", label: "Submitted only" },
                ]}
              />
            </div>
          </div>

          {!filteredPws.length ? (
            <EmptyState
              title="No matching assignments"
              description={
                pws.length
                  ? "Try clearing your search or status filter."
                  : "No practical work is currently assigned to your group."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPws.map(({ pw, isDone, record }) => (
                <article
                  key={pw.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-[#0F172A]">{pw.title}</h3>
                      <StatusBadge tone={isDone ? "success" : "warning"}>
                        {isDone ? "Submitted" : "Pending"}
                      </StatusBadge>
                    </div>
                    <p className="mt-2.5 text-sm text-slate-600">{pw.objectif}</p>
                    {pw.tooth?.name && (
                      <p className="mt-2 text-xs font-medium text-[#0F766E]">
                        Tooth: {pw.tooth.name}
                      </p>
                    )}
                  </div>
                  <div className="mt-5">
                    {isDone && record ? (
                      <Button
                        variant="secondary"
                        onClick={() => setViewSubmission({ pw, record })}
                        className="w-full"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" aria-hidden="true" />
                        View submission
                      </Button>
                    ) : isDone ? (
                      <Button variant="secondary" disabled className="w-full">
                        Submitted
                      </Button>
                    ) : (
                      <Button onClick={() => openAnalysis(pw)} className="w-full">
                        Start analysis
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <PageHeader
            title="My profile"
            description="Review and update your personal student information. Group assignment is managed by your professor."
          />

          <section className="max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
              <div className="flex items-center gap-4">
                <Avatar
                  photo={student?.photo}
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  size="lg"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[#0F172A]">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <StatusBadge tone="teal">Student</StatusBadge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Group: {student?.group?.code || "Unassigned"}
                  </p>
                </div>
              </div>
              {!editingProfile && (
                <Button variant="secondary" size="sm" onClick={() => setEditingProfile(true)}>
                  Edit information
                </Button>
              )}
            </div>

            <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
              {[
                ["firstName", "First name", "text"],
                ["lastName", "Last name", "text"],
                ["userName", "Username", "text"],
                ["email", "Email", "email"],
                ["number", "Phone number", "tel"],
              ].map(([name, fieldLabel, type]) => (
                <FormField
                  key={name}
                  id={`stud-profile-${name}`}
                  label={fieldLabel}
                  required={name !== "number"}
                  className={name === "number" ? "sm:col-span-2" : ""}
                >
                  <input
                    id={`stud-profile-${name}`}
                    name={name}
                    type={type}
                    value={profile[name]}
                    onChange={updateProfileField}
                    disabled={!editingProfile}
                    required={name !== "number"}
                    className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#0F766E] focus:ring-[#0F766E] disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </FormField>
              ))}
              {editingProfile && (
                <div className="flex justify-end gap-2.5 pt-2 sm:col-span-2">
                  <Button variant="secondary" onClick={cancelProfileEdit} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={demoReadOnly}
                    title={demoReadOnly ? "Profile updates are disabled in public demo mode" : undefined}
                  >
                    {submitting ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              )}
            </form>
          </section>
        </div>
      )}

      {/* Read-only submission modal */}
      <Modal
        open={Boolean(viewSubmission)}
        onClose={() => setViewSubmission(null)}
        size="xl"
        title={viewSubmission ? viewSubmission.pw.title : "Submitted analysis"}
        subtitle="Read-only submission review"
        footer={
          <Button variant="secondary" onClick={() => setViewSubmission(null)}>
            Close
          </Button>
        }
      >
        {viewSubmission && (
          <SubmissionReview
            student={student}
            pw={viewSubmission.pw}
            submission={viewSubmission.record}
          />
        )}
      </Modal>

      {/* Unsaved draft confirmation */}
      <ConfirmDialog
        open={Boolean(pendingNavTab)}
        onClose={() => setPendingNavTab(null)}
        onConfirm={confirmLeaveStudio}
        title="Discard unfinished analysis?"
        message="You have uploaded images or placed landmarks in the Tooth Analysis Studio. Leaving now will discard your unsaved draft."
        confirmLabel="Discard and leave"
        cancelLabel="Stay in studio"
      />
    </AppShell>
  );
};

export default StudentHome;
