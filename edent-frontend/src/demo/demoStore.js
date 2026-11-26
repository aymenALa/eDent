const DB_NAME = "edent_portfolio_demo";
const DB_VERSION = 1;
const STORES = ["users", "groups", "teeth", "pws", "groupPws", "studentpws", "meta"];

let dbPromise = null;
let seedPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("groups")) {
        db.createObjectStore("groups", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("teeth")) {
        db.createObjectStore("teeth", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pws")) {
        db.createObjectStore("pws", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("groupPws")) {
        db.createObjectStore("groupPws", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("studentpws")) {
        db.createObjectStore("studentpws", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB could not be opened."));
  });
  return dbPromise;
}

function wrapTxError(err) {
  if (err?.name === "QuotaExceededError") {
    return new Error("Browser storage quota exceeded. Reset demo data or use smaller images.");
  }
  return err instanceof Error ? err : new Error("Browser demo storage operation failed.");
}

async function getMeta(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readonly");
    const req = tx.objectStore("meta").get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(wrapTxError(req.error));
  });
}

async function seedDatabase(db) {
  const response = await window.fetch("/demo-seed.json");
  if (!response.ok) {
    throw new Error("Could not load synthetic demo dataset.");
  }
  const seed = await response.json();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(wrapTxError(tx.error));
    tx.onabort = () => reject(wrapTxError(tx.error));

    STORES.forEach((name) => tx.objectStore(name).clear());

    const usersStore = tx.objectStore("users");
    (seed.users || []).forEach((u) => usersStore.put(u));

    const groupsStore = tx.objectStore("groups");
    (seed.groups || []).forEach((g) => groupsStore.put(g));

    const teethStore = tx.objectStore("teeth");
    (seed.teeth || []).forEach((t) => teethStore.put(t));

    const pwsStore = tx.objectStore("pws");
    (seed.pws || []).forEach((pw) => pwsStore.put(pw));

    const gpStore = tx.objectStore("groupPws");
    (seed.groupPws || []).forEach((gp) =>
      gpStore.put({ key: `${gp.groupeId}_${gp.pwId}`, groupeId: gp.groupeId, pwId: gp.pwId })
    );

    const spwStore = tx.objectStore("studentpws");
    (seed.studentpws || []).forEach((spw) =>
      spwStore.put({ ...spw, key: `${spw.studentId}_${spw.pwId}` })
    );

    tx.objectStore("meta").put({ key: "seeded", value: true });
    tx.objectStore("meta").put({ key: "seededAt", value: new Date().toISOString() });
  });
}

export async function ensureDemoSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const db = await openDb();
    const seeded = await getMeta(db, "seeded");
    if (!seeded) {
      await seedDatabase(db);
    }
    return db;
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

export async function resetDemoStorage() {
  const db = await openDb();
  seedPromise = null;
  await seedDatabase(db);
  seedPromise = Promise.resolve(db);
}

export async function getAllRecords(storeName) {
  const db = await ensureDemoSeeded();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(wrapTxError(req.error));
  });
}

export async function getRecord(storeName, key) {
  const db = await ensureDemoSeeded();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(wrapTxError(req.error));
  });
}

export async function putRecord(storeName, value) {
  const db = await ensureDemoSeeded();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve(value);
    tx.onerror = () => reject(wrapTxError(tx.error));
    tx.onabort = () => reject(wrapTxError(tx.error));
  });
}

export async function deleteRecord(storeName, key) {
  const db = await ensureDemoSeeded();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(wrapTxError(tx.error));
    tx.onabort = () => reject(wrapTxError(tx.error));
  });
}

export async function getNextId(storeName) {
  const records = await getAllRecords(storeName);
  const maxId = records.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return maxId + 1;
}
