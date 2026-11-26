import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faPen } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../ui/PageHeader";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import StatusBadge from "../ui/StatusBadge";
import { ErrorState, LoadingState } from "../ui/States";
import { API_BASE, getAuthUser } from "../../utils/api";

const Profil = () => {
  const userlogin = getAuthUser() || {};
  const [user, setUser] = useState({
    id: "",
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    grade: "",
    photo: null,
  });
  const [snapshot, setSnapshot] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getProfessor = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/users/${userlogin.id}`);
      const d = res.data || {};
      const normalized = {
        ...d,
        firstName: d.firstName || "",
        lastName: d.lastName || "",
        userName: d.userName || "",
        email: d.email || "",
        grade: d.grade || "",
        photo: d.photo || null,
      };
      setUser(normalized);
      setSnapshot(normalized);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load professor profile.");
    } finally {
      setLoading(false);
    }
  }, [userlogin.id]);

  useEffect(() => {
    if (userlogin.id) getProfessor();
  }, [getProfessor, userlogin.id]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result || "";
      const base64WithoutPrefix = String(base64String).split(",")[1] || null;
      setUser((prev) => ({ ...prev, photo: base64WithoutPrefix }));
      setEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const cancelEdit = () => {
    if (snapshot) setUser(snapshot);
    setEditing(false);
  };

  const updateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/users/update/professor/${user.id}`, user);
      toast.success("Profile updated successfully.");
      setEditing(false);
      await getProfessor();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Professor profile"
        description="Manage your faculty account details and profile photo."
      />

      {loading ? (
        <LoadingState label="Loading profile..." />
      ) : error ? (
        <ErrorState message={error} onRetry={getProfessor} />
      ) : (
        <section className="max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar
                  photo={user.photo}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="xl"
                />
                <label
                  htmlFor="prof-photo-input"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F766E] shadow-sm hover:bg-slate-50"
                  title="Change profile photo"
                >
                  <FontAwesomeIcon icon={faCamera} className="h-3.5 w-3.5" aria-hidden="true" />
                  <input
                    id="prof-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    {user.firstName} {user.lastName}
                  </h2>
                  <StatusBadge tone="teal">Professor</StatusBadge>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{user.email}</p>
                <p className="text-xs text-slate-500">@{user.userName}</p>
              </div>
            </div>

            {!editing && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <FontAwesomeIcon icon={faPen} className="h-3 w-3" aria-hidden="true" />
                Edit profile
              </Button>
            )}
          </div>

          <form onSubmit={updateUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="prof-firstName" label="First name" required>
                <input
                  id="prof-firstName"
                  name="firstName"
                  value={user.firstName}
                  disabled={!editing}
                  onChange={(e) => setUser((u) => ({ ...u, firstName: e.target.value }))}
                  required
                  className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E] disabled:bg-slate-50 disabled:text-slate-600"
                />
              </FormField>
              <FormField id="prof-lastName" label="Last name" required>
                <input
                  id="prof-lastName"
                  name="lastName"
                  value={user.lastName}
                  disabled={!editing}
                  onChange={(e) => setUser((u) => ({ ...u, lastName: e.target.value }))}
                  required
                  className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E] disabled:bg-slate-50 disabled:text-slate-600"
                />
              </FormField>
            </div>

            <FormField id="prof-grade" label="Academic grade">
              <input
                id="prof-grade"
                name="grade"
                value={user.grade}
                disabled={!editing}
                onChange={(e) => setUser((u) => ({ ...u, grade: e.target.value }))}
                className="block w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#0F766E] focus:ring-[#0F766E] disabled:bg-slate-50 disabled:text-slate-600"
              />
            </FormField>

            {editing && (
              <div className="flex justify-end gap-2.5 pt-2">
                <Button variant="secondary" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </div>
            )}
          </form>
        </section>
      )}
    </div>
  );
};

export default Profil;
