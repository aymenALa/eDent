import {
  deleteRecord,
  ensureDemoSeeded,
  getAllRecords,
  getNextId,
  getRecord,
  putRecord,
} from "./demoStore.js";

async function loadSnapshot() {
  await ensureDemoSeeded();
  const [users, groups, teeth, pws, groupPws, studentpws] = await Promise.all([
    getAllRecords("users"),
    getAllRecords("groups"),
    getAllRecords("teeth"),
    getAllRecords("pws"),
    getAllRecords("groupPws"),
    getAllRecords("studentpws"),
  ]);

  const usersMap = new Map(users.map((u) => [Number(u.id), u]));
  const groupsMap = new Map(groups.map((g) => [Number(g.id), g]));
  const teethMap = new Map(teeth.map((t) => [Number(t.id), t]));
  const pwsMap = new Map(pws.map((p) => [Number(p.id), p]));

  return { users, groups, teeth, pws, groupPws, studentpws, usersMap, groupsMap, teethMap, pwsMap };
}

function hydratePW(pw, snap) {
  if (!pw) return null;
  return {
    id: pw.id,
    title: pw.title,
    objectif: pw.objectif,
    docs: pw.docs || null,
    tooth: snap.teethMap.get(Number(pw.toothId)) || null,
  };
}

function hydrateGroup(group, snap, includeStudents = true) {
  if (!group) return null;
  const prof = snap.usersMap.get(Number(group.professorId));
  const assignedPws = snap.groupPws
    .filter((gp) => Number(gp.groupeId) === Number(group.id))
    .map((gp) => hydratePW(snap.pwsMap.get(Number(gp.pwId)), snap))
    .filter(Boolean);

  const groupStudents = includeStudents
    ? snap.users
        .filter((u) => u.role === "student" && Number(u.groupId) === Number(group.id))
        .map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          userName: s.userName,
          email: s.email,
          number: s.number,
          activate: s.activate,
          photo: s.photo,
        }))
    : undefined;

  return {
    id: group.id,
    code: group.code,
    year: group.year,
    professor: prof ? { id: prof.id, firstName: prof.firstName, lastName: prof.lastName } : null,
    pws: assignedPws,
    ...(includeStudents ? { student: groupStudents } : {}),
  };
}

function hydrateStudentPW(spw, snap) {
  const pw = snap.pwsMap.get(Number(spw.pwId));
  const student = snap.usersMap.get(Number(spw.studentId));
  return {
    id: { student_id: spw.studentId, pw_id: spw.pwId },
    student: student
      ? {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          userName: student.userName,
        }
      : null,
    pw: hydratePW(pw, snap),
    imageFront: spw.imageFront,
    imageSide: spw.imageSide,
    af1: spw.af1,
    af2: spw.af2,
    bf1: spw.bf1,
    bf2: spw.bf2,
    cf1: spw.cf1,
    cf2: spw.cf2,
    as1: spw.as1,
    as2: spw.as2,
    bs1: spw.bs1,
    bs2: spw.bs2,
    cs1: spw.cs1,
    cs2: spw.cs2,
    noteFront: spw.noteFront,
    noteSide: spw.noteSide,
    date: spw.date,
    time: spw.time,
  };
}

function hydrateUser(user, snap) {
  if (!user) return null;
  if (user.role === "student") {
    const group = user.groupId ? hydrateGroup(snap.groupsMap.get(Number(user.groupId)), snap, false) : null;
    const studentPWS = snap.studentpws
      .filter((spw) => Number(spw.studentId) === Number(user.id))
      .map((spw) => hydrateStudentPW(spw, snap));

    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      photo: user.photo,
      activate: user.activate,
      number: user.number,
      role: "student",
      group,
      studentPWS,
    };
  }
  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    firstName: user.firstName,
    lastName: user.lastName,
    photo: user.photo,
    activate: user.activate,
    ...(user.role === "professor" ? { grade: user.grade } : {}),
    role: user.role,
  };
}

function normalizePath(url) {
  const idx = url.indexOf("/api/");
  const path = idx >= 0 ? url.slice(idx) : url;
  return path.split("?")[0];
}

function parseBody(data) {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

export async function handleDemoRequest(method, url, rawBody) {
  const m = (method || "GET").toUpperCase();
  const path = normalizePath(url);
  const body = parseBody(rawBody);

  if (m === "GET" && path === "/api/health") {
    return { status: 200, data: { status: "UP", demoReadOnly: false, demoMode: true } };
  }

  const snap = await loadSnapshot();

  // USERS
  if (m === "GET" && path === "/api/users/all") {
    return { status: 200, data: snap.users.map((u) => hydrateUser(u, snap)) };
  }

  if (m === "GET" && path === "/api/users/allProfessor") {
    return {
      status: 200,
      data: snap.users.filter((u) => u.role === "professor").map((u) => hydrateUser(u, snap)),
    };
  }

  if (m === "GET" && path === "/api/users/allStudent") {
    return {
      status: 200,
      data: snap.users.filter((u) => u.role === "student").map((u) => hydrateUser(u, snap)),
    };
  }

  if (m === "GET" && path.startsWith("/api/users/students/group/")) {
    const groupId = Number(path.split("/").pop());
    const students = snap.users
      .filter((u) => u.role === "student" && Number(u.groupId) === groupId)
      .map((u) => hydrateUser(u, snap));
    return { status: 200, data: students };
  }

  if (m === "GET" && path.startsWith("/api/users/students/")) {
    const profId = Number(path.split("/").pop());
    const profGroupIds = new Set(
      snap.groups.filter((g) => Number(g.professorId) === profId).map((g) => Number(g.id))
    );
    const students = snap.users
      .filter((u) => u.role === "student" && profGroupIds.has(Number(u.groupId)))
      .map((u) => hydrateUser(u, snap));
    return { status: 200, data: students };
  }

  if (m === "GET" && path.startsWith("/api/users/testpw/")) {
    const studentId = Number(path.split("/").pop());
    const student = snap.usersMap.get(studentId);
    if (!student) return { status: 404, data: { message: "Student not found" } };
    const assignedPwIds = snap.groupPws
      .filter((gp) => Number(gp.groupeId) === Number(student.groupId))
      .map((gp) => Number(gp.pwId));
    const submittedIds = new Set(
      snap.studentpws
        .filter((spw) => Number(spw.studentId) === studentId)
        .map((spw) => Number(spw.pwId))
    );
    return { status: 200, data: assignedPwIds.map((pwId) => submittedIds.has(pwId)) };
  }

  if (m === "GET" && /^\/api\/users\/\d+$/.test(path)) {
    const id = Number(path.split("/").pop());
    const user = snap.usersMap.get(id);
    if (!user) return { status: 404, data: { message: "User not found" } };
    return { status: 200, data: hydrateUser(user, snap) };
  }

  if (m === "POST" && path.startsWith("/api/users/activate/")) {
    const id = Number(path.split("/").pop());
    const user = await getRecord("users", id);
    if (!user) return { status: 404, data: { message: "Professor does not exist" } };
    const updated = { ...user, activate: !user.activate };
    await putRecord("users", updated);
    return {
      status: 200,
      data: {
        message: updated.activate
          ? "Professor activated successfully"
          : "Professor deactivated successfully",
      },
    };
  }

  if (m === "DELETE" && path.startsWith("/api/users/delete/professor/")) {
    const profId = Number(path.split("/").pop());
    const hasGroups = snap.groups.some((g) => Number(g.professorId) === profId);
    if (hasGroups) {
      return {
        status: 409,
        data: { message: "Delete or reassign the professor's groups before deleting this account." },
      };
    }
    await deleteRecord("users", profId);
    return { status: 200, data: { message: "Professor deleted successfully" } };
  }

  if (m === "POST" && path === "/api/users/register/student") {
    const newId = await getNextId("users");
    const newStudent = {
      id: newId,
      email: body.email || "",
      userName: body.userName || "",
      firstName: body.firstName || "",
      lastName: body.lastName || "",
      number: body.number || "",
      photo: body.photo || null,
      activate: true,
      role: "student",
      groupId: body.group?.id ? Number(body.group.id) : null,
    };
    await putRecord("users", newStudent);
    return { status: 200, data: { message: "Student created successfully" } };
  }

  if (m === "PUT" && /^\/api\/users\/update\/\d+$/.test(path)) {
    const id = Number(path.split("/").pop());
    const existing = await getRecord("users", id);
    if (!existing) return { status: 404, data: { message: "Student does not exist" } };
    const updated = {
      ...existing,
      email: body.email ?? existing.email,
      userName: body.userName ?? existing.userName,
      firstName: body.firstName ?? existing.firstName,
      lastName: body.lastName ?? existing.lastName,
      number: body.number ?? existing.number,
      photo: body.photo ?? existing.photo,
      groupId: body.group?.id ? Number(body.group.id) : existing.groupId,
    };
    await putRecord("users", updated);
    return { status: 200, data: { message: "Student updated successfully" } };
  }

  if (m === "PUT" && path.startsWith("/api/users/update/student/")) {
    const id = Number(path.split("/").pop());
    const existing = await getRecord("users", id);
    if (!existing) return { status: 404, data: { message: "Student does not exist" } };
    const updated = {
      ...existing,
      firstName: body.firstName ?? existing.firstName,
      lastName: body.lastName ?? existing.lastName,
      userName: body.userName ?? existing.userName,
      email: body.email ?? existing.email,
      number: body.number ?? existing.number,
    };
    await putRecord("users", updated);
    return { status: 200, data: { message: "Profile updated successfully" } };
  }

  if (m === "PUT" && path.startsWith("/api/users/update/professor/")) {
    const id = Number(path.split("/").pop());
    const existing = await getRecord("users", id);
    if (!existing) return { status: 404, data: { message: "Professor does not exist" } };
    const updated = {
      ...existing,
      firstName: body.firstName ?? existing.firstName,
      lastName: body.lastName ?? existing.lastName,
      userName: body.userName ?? existing.userName,
      email: body.email ?? existing.email,
      grade: body.grade ?? existing.grade,
      photo: body.photo ?? existing.photo,
    };
    await putRecord("users", updated);
    return { status: 200, data: { message: "Professor updated successfully" } };
  }

  if (m === "DELETE" && path.startsWith("/api/users/delete/student/")) {
    const studentId = Number(path.split("/").pop());
    const spws = snap.studentpws.filter((s) => Number(s.studentId) === studentId);
    await Promise.all(spws.map((s) => deleteRecord("studentpws", `${s.studentId}_${s.pwId}`)));
    await deleteRecord("users", studentId);
    return { status: 200, data: { message: "Student deleted successfully" } };
  }

  // GROUPS
  if (m === "GET" && path.startsWith("/api/groups/professor/")) {
    const profId = Number(path.split("/").pop());
    const profGroups = snap.groups
      .filter((g) => Number(g.professorId) === profId)
      .map((g) => hydrateGroup(g, snap, true));
    return { status: 200, data: profGroups };
  }

  if (m === "POST" && path.startsWith("/api/groups/add/")) {
    const profId = Number(path.split("/").pop());
    const newId = await getNextId("groups");
    await putRecord("groups", {
      id: newId,
      code: body.code || "",
      year: body.year || "",
      professorId: profId,
    });
    return { status: 200, data: { message: "group created successfully" } };
  }

  if (m === "PUT" && path.startsWith("/api/groups/update/")) {
    const id = Number(path.split("/").pop());
    const existing = await getRecord("groups", id);
    if (!existing) return { status: 404, data: { message: "group does not exist" } };
    await putRecord("groups", {
      ...existing,
      code: body.code ?? existing.code,
      year: body.year ?? existing.year,
    });
    return { status: 200, data: { message: "group updated successfully" } };
  }

  if (m === "DELETE" && path.startsWith("/api/groups/delete/")) {
    const id = Number(path.split("/").pop());
    const hasStudents = snap.users.some((u) => u.role === "student" && Number(u.groupId) === id);
    if (hasStudents) {
      return {
        status: 409,
        data: { message: "Delete or move the students in this group before deleting it" },
      };
    }
    const gps = snap.groupPws.filter((gp) => Number(gp.groupeId) === id);
    await Promise.all(gps.map((gp) => deleteRecord("groupPws", gp.key)));
    await deleteRecord("groups", id);
    return { status: 200, data: { message: "group deleted successfully" } };
  }

  if (m === "POST" && path.startsWith("/api/groups/pw/")) {
    const parts = path.split("/");
    const pwId = Number(parts.pop());
    const groupeId = Number(parts.pop());
    const group = snap.groupsMap.get(groupeId);
    const pw = snap.pwsMap.get(pwId);
    if (!group || !pw) {
      return { status: 404, data: { message: "Group or practical work not found." } };
    }
    const key = `${groupeId}_${pwId}`;
    if (snap.groupPws.some((gp) => gp.key === key)) {
      return {
        status: 409,
        data: { message: "This practical work is already assigned to this group." },
      };
    }
    await putRecord("groupPws", { key, groupeId, pwId });
    const nextSnap = await loadSnapshot();
    return { status: 200, data: hydrateGroup(nextSnap.groupsMap.get(groupeId), nextSnap, true) };
  }

  if (m === "DELETE" && path.startsWith("/api/groups/pw/")) {
    const parts = path.split("/");
    const pwId = Number(parts.pop());
    const groupeId = Number(parts.pop());
    const group = snap.groupsMap.get(groupeId);
    if (!group) {
      return { status: 404, data: { message: "Group not found." } };
    }
    await deleteRecord("groupPws", `${groupeId}_${pwId}`);
    const nextSnap = await loadSnapshot();
    return { status: 200, data: hydrateGroup(nextSnap.groupsMap.get(groupeId), nextSnap, true) };
  }

  // PWS
  if (m === "GET" && path === "/api/pws/all") {
    return { status: 200, data: snap.pws.map((pw) => hydratePW(pw, snap)) };
  }

  if (m === "POST" && path === "/api/pws/add") {
    const newId = await getNextId("pws");
    await putRecord("pws", {
      id: newId,
      title: body.title || "",
      objectif: body.objectif || "",
      docs: body.docs || null,
      toothId: body.tooth?.id ? Number(body.tooth.id) : null,
    });
    return { status: 200, data: { message: "pw created successfully" } };
  }

  if (m === "PUT" && path.startsWith("/api/pws/update/")) {
    const id = Number(path.split("/").pop());
    const existing = await getRecord("pws", id);
    if (!existing) return { status: 404, data: { message: "pw does not exist" } };
    await putRecord("pws", {
      ...existing,
      title: body.title ?? existing.title,
      objectif: body.objectif ?? existing.objectif,
      docs: body.docs ?? existing.docs,
      toothId: body.tooth?.id ? Number(body.tooth.id) : existing.toothId,
    });
    return { status: 200, data: { message: "pw updated successfully" } };
  }

  if (m === "DELETE" && path.startsWith("/api/pws/delete/")) {
    const id = Number(path.split("/").pop());
    const gps = snap.groupPws.filter((gp) => Number(gp.pwId) === id);
    const spws = snap.studentpws.filter((s) => Number(s.pwId) === id);
    await Promise.all([
      ...gps.map((gp) => deleteRecord("groupPws", gp.key)),
      ...spws.map((s) => deleteRecord("studentpws", s.key)),
    ]);
    await deleteRecord("pws", id);
    return { status: 200, data: { message: "pw deleted successfully" } };
  }

  // TEETH
  if (m === "GET" && path === "/api/teeth/all") {
    return { status: 200, data: snap.teeth };
  }

  if (m === "POST" && path === "/api/teeth/add") {
    const newId = await getNextId("teeth");
    await putRecord("teeth", { id: newId, name: body.name || "" });
    return { status: 200, data: { message: "tooth created successfully" } };
  }

  if (m === "PUT" && path.startsWith("/api/teeth/update/")) {
    const id = Number(path.split("/").pop());
    const existing = await getRecord("teeth", id);
    if (!existing) return { status: 404, data: { message: "tooth does not exist" } };
    await putRecord("teeth", { ...existing, name: body.name ?? existing.name });
    return { status: 200, data: { message: "tooth updated successfully" } };
  }

  if (m === "DELETE" && path.startsWith("/api/teeth/delete/")) {
    const id = Number(path.split("/").pop());
    const tooth = snap.teethMap.get(id);
    if (!tooth) {
      return { status: 404, data: { message: "Tooth does not exist." } };
    }
    const referencing = snap.pws.filter((pw) => Number(pw.toothId) === id);
    if (referencing.length > 0) {
      const titles = referencing.map((p) => p.title).join(", ");
      return {
        status: 409,
        data: {
          message: `Cannot delete "${tooth.name}" because it is referenced by practical work: ${titles}.`,
        },
      };
    }
    await deleteRecord("teeth", id);
    return { status: 200, data: { message: "tooth deleted successfully" } };
  }

  if (m === "GET" && path === "/api/studentpws/all") {
    return { status: 200, data: snap.studentpws.map((spw) => hydrateStudentPW(spw, snap)) };
  }

  // STUDENT PWS
  if (m === "POST" && path.startsWith("/api/studentpws/add/")) {
    const parts = path.split("/");
    const pwId = Number(parts.pop());
    const studentId = Number(parts.pop());
    const key = `${studentId}_${pwId}`;
    const existing = await getRecord("studentpws", key);
    if (existing) {
      return { status: 409, data: { message: "This practical work was already submitted" } };
    }
    const record = {
      key,
      studentId,
      pwId,
      imageFront: body.imageFront || null,
      imageSide: body.imageSide || null,
      af1: body.af1,
      af2: body.af2,
      bf1: body.bf1,
      bf2: body.bf2,
      cf1: body.cf1,
      cf2: body.cf2,
      as1: body.as1,
      as2: body.as2,
      bs1: body.bs1,
      bs2: body.bs2,
      cs1: body.cs1,
      cs2: body.cs2,
      noteFront: body.noteFront,
      noteSide: body.noteSide,
      date: body.date,
      time: body.time,
    };
    await putRecord("studentpws", record);
    return { status: 200, data: hydrateStudentPW(record, snap) };
  }

  return { status: 404, data: { message: `Demo route not found: ${m} ${path}` } };
}

export async function demoFetch(url, options = {}) {
  const result = await handleDemoRequest(options.method || "GET", url, options.body);
  return {
    ok: result.status >= 200 && result.status < 300,
    status: result.status,
    json: async () => result.data,
  };
}

export async function demoAxiosAdapter(config) {
  const result = await handleDemoRequest(config.method || "GET", config.url || "", config.data);
  if (result.status >= 400) {
    const err = new Error(result.data?.message || `Request failed with status ${result.status}`);
    err.config = config;
    err.response = {
      data: result.data,
      status: result.status,
      statusText: String(result.status),
      headers: {},
      config,
    };
    throw err;
  }
  return {
    data: result.data,
    status: result.status,
    statusText: "OK",
    headers: {},
    config,
  };
}

const DEMO_ROLE_EMAILS = {
  admin: "admin.synth@test.local",
  professor: "prof.synth@test.local",
  student: "student.synth@test.local",
};

export async function getDemoAccountForRole(role) {
  await ensureDemoSeeded();
  const users = await getAllRecords("users");
  const targetEmail = DEMO_ROLE_EMAILS[role];
  const match =
    users.find((u) => u.email === targetEmail) || users.find((u) => u.role === role);
  if (!match) {
    throw new Error(`Demo account for role "${role}" is not available.`);
  }
  return {
    id: match.id,
    email: match.email,
    role: match.role,
    firstName: match.firstName,
    lastName: match.lastName,
    userName: match.userName,
    demo: true,
  };
}
