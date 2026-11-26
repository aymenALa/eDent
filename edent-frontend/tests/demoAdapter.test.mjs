import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedJsonPath = path.resolve(__dirname, "../public/demo-seed.json");
const seedData = JSON.parse(fs.readFileSync(seedJsonPath, "utf8"));

// Minimal in-memory IndexedDB + window shim for Node regression testing
function createMemoryIndexedDB() {
  const stores = new Map();
  const db = {
    objectStoreNames: { contains: (name) => stores.has(name) },
    createObjectStore: (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
    },
    transaction: (storeNames) => {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames];
      const tx = {
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore: (name) => {
          if (!stores.has(name)) stores.set(name, new Map());
          const map = stores.get(name);
          return {
            clear: () => map.clear(),
            put: (val) => {
              const key = val.id !== undefined ? val.id : val.key;
              map.set(key, structuredClone(val));
              const req = { result: val, onsuccess: null, onerror: null };
              queueMicrotask(() => req.onsuccess?.());
              return req;
            },
            delete: (key) => {
              map.delete(key);
            },
            get: (key) => {
              const req = { result: structuredClone(map.get(key)), onsuccess: null, onerror: null };
              queueMicrotask(() => req.onsuccess?.());
              return req;
            },
            getAll: () => {
              const req = { result: Array.from(map.values()).map((v) => structuredClone(v)), onsuccess: null, onerror: null };
              queueMicrotask(() => req.onsuccess?.());
              return req;
            },
          };
        },
      };
      // Ensure names exist and fire oncomplete asynchronously
      names.forEach((n) => {
        if (!stores.has(n)) stores.set(n, new Map());
      });
      queueMicrotask(() => tx.oncomplete?.());
      return tx;
    },
  };

  return {
    open: () => {
      const req = { result: db, onupgradeneeded: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        req.onupgradeneeded?.({ target: { result: db } });
        req.onsuccess?.();
      });
      return req;
    },
  };
}

globalThis.window = {
  indexedDB: createMemoryIndexedDB(),
  fetch: async (url) => {
    if (url === "/demo-seed.json") {
      return { ok: true, json: async () => seedData };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  },
};

const { handleDemoRequest, getDemoAccountForRole } = await import("../src/demo/demoAdapter.js");
const { resetDemoStorage } = await import("../src/demo/demoStore.js");

test("seed dataset contains expected counts and omits secrets", async () => {
  const usersRes = await handleDemoRequest("GET", "/api/users/all");
  assert.equal(usersRes.status, 200);
  assert.equal(usersRes.data.length, 55);
  for (const u of usersRes.data) {
    assert.equal(u.password, undefined);
    assert.equal(u.codeActivation, undefined);
  }
});

test("tooth deletion blocks referenced teeth with 409 and deletes unused teeth", async () => {
  await resetDemoStorage();

  // Referenced tooth (id=1) must return 409 naming referencing PW
  const refRes = await handleDemoRequest("DELETE", "/api/teeth/delete/1");
  assert.equal(refRes.status, 409);
  assert.match(refRes.data.message, /Cannot delete/i);

  // Create and delete an unused tooth
  const createRes = await handleDemoRequest("POST", "/api/teeth/add", { name: "Test Supernumerary #99" });
  assert.equal(createRes.status, 200);
  const allTeeth = await handleDemoRequest("GET", "/api/teeth/all");
  const created = allTeeth.data.find((t) => t.name === "Test Supernumerary #99");
  assert.ok(created);

  const delRes = await handleDemoRequest("DELETE", `/api/teeth/delete/${created.id}`);
  assert.equal(delRes.status, 200);
  const afterTeeth = await handleDemoRequest("GET", "/api/teeth/all");
  assert.equal(afterTeeth.data.some((t) => t.id === created.id), false);
});

test("student submissions expose StudentPWPK id.pw_id and id.student_id for StudentDetails", async () => {
  await resetDemoStorage();
  const stud = await getDemoAccountForRole("student");
  const userRes = await handleDemoRequest("GET", `/api/users/${stud.id}`);
  assert.equal(userRes.status, 200);
  assert.ok(userRes.data.studentPWS.length > 0);
  const first = userRes.data.studentPWS[0];
  assert.equal(typeof first.id.pw_id, "number");
  assert.equal(first.id.student_id, stud.id);
  assert.ok(first.imageFront);
  assert.ok(first.imageSide);
});

test("PW assignment returns hydrated group, prevents duplicates, propagates to student, and supports submission + unassignment", async () => {
  await resetDemoStorage();
  const prof = await getDemoAccountForRole("professor");
  const stud = await getDemoAccountForRole("student");

  // 1. Professor creates a new PW
  const addPw = await handleDemoRequest("POST", "/api/pws/add", {
    title: "Regression Test Molar PW",
    objectif: "Verify group assignment propagation",
    tooth: { id: 1 },
  });
  assert.equal(addPw.status, 200);
  const allPws = await handleDemoRequest("GET", "/api/pws/all");
  const newPw = allPws.data.find((p) => p.title === "Regression Test Molar PW");
  assert.ok(newPw);

  // 2. Assign PW to student's group (id=1)
  const assignRes = await handleDemoRequest("POST", `/api/groups/pw/1/${newPw.id}`);
  assert.equal(assignRes.status, 200);
  assert.equal(assignRes.data.id, 1);
  assert.ok(Array.isArray(assignRes.data.pws));
  assert.ok(assignRes.data.pws.some((p) => p.id === newPw.id));

  // 3. Duplicate assignment returns 409
  const dupAssign = await handleDemoRequest("POST", `/api/groups/pw/1/${newPw.id}`);
  assert.equal(dupAssign.status, 409);

  // 4. Student sees new pending PW
  const studRes = await handleDemoRequest("GET", `/api/users/${stud.id}`);
  const testPwRes = await handleDemoRequest("GET", `/api/users/testpw/${stud.id}`);
  const idx = studRes.data.group.pws.findIndex((p) => p.id === newPw.id);
  assert.ok(idx >= 0);
  assert.equal(testPwRes.data[idx], false);

  // 5. Student submits analysis
  const subRes = await handleDemoRequest("POST", `/api/studentpws/add/${stud.id}/${newPw.id}`, {
    imageFront: "dGVzdA==",
    imageSide: "dGVzdA==",
    af1: 90, af2: 90, bf1: 85, bf2: 95, cf1: 88, cf2: 92,
    as1: 91, as2: 89, bs1: 84, bs2: 96, cs1: 87, cs2: 93,
    noteFront: 7.5, noteSide: 8.0,
    date: "2026-11-26", time: "18:30",
  });
  assert.equal(subRes.status, 200);
  assert.equal(subRes.data.id.pw_id, newPw.id);

  // 6. Duplicate submission returns 409
  const dupSub = await handleDemoRequest("POST", `/api/studentpws/add/${stud.id}/${newPw.id}`, {});
  assert.equal(dupSub.status, 409);

  // 7. Professor sees submission under students list
  const profStudents = await handleDemoRequest("GET", `/api/users/students/${prof.id}`);
  const updatedStud = profStudents.data.find((s) => s.id === stud.id);
  assert.ok(updatedStud.studentPWS.some((s) => s.id.pw_id === newPw.id));

  // 8. Unassign returns hydrated group without the PW
  const unassignRes = await handleDemoRequest("DELETE", `/api/groups/pw/1/${newPw.id}`);
  assert.equal(unassignRes.status, 200);
  assert.equal(unassignRes.data.pws.some((p) => p.id === newPw.id), false);
});

test("professor profile update persists in IndexedDB and reflects in GET /api/users/:id", async () => {
  await resetDemoStorage();
  const prof = await getDemoAccountForRole("professor");
  const putRes = await handleDemoRequest("PUT", `/api/users/update/professor/${prof.id}`, {
    firstName: "Karim-Updated",
    lastName: prof.lastName,
    userName: prof.userName,
    email: prof.email,
    grade: "Professor",
  });
  assert.equal(putRes.status, 200);
  const getRes = await handleDemoRequest("GET", `/api/users/${prof.id}`);
  assert.equal(getRes.data.firstName, "Karim-Updated");
});
