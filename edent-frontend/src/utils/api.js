import axios from "axios";
import { useEffect, useState } from "react";
import { demoAxiosAdapter, demoFetch, getDemoAccountForRole } from "../demo/demoAdapter";
import { resetDemoStorage } from "../demo/demoStore";

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

export const API_PORT = import.meta.env.VITE_PORT_SPRING || 5050;
export const API_BASE = IS_DEMO_MODE
  ? "/api"
  : rawBaseUrl
  ? (rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`)
  : `http://localhost:${API_PORT}/api`;

export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("userlogin");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthUser = (user) => {
  localStorage.setItem("userlogin", JSON.stringify(user));
};

export const clearAuthUser = () => {
  localStorage.removeItem("userlogin");
};

export const authHeaders = () => {
  if (IS_DEMO_MODE) return {};
  const user = getAuthUser();
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

export const apiFetch = (url, options = {}) => {
  if (IS_DEMO_MODE) {
    return demoFetch(url, options);
  }
  return window.fetch(url, options);
};

export const enterDemoWorkspace = async (role) => {
  const account = await getDemoAccountForRole(role);
  setAuthUser(account);
  const destination = role === "professor" ? "/professor/dashboard" : `/${role}`;
  window.location = destination;
};

export const resetDemoWorkspaceData = async () => {
  await resetDemoStorage();
};

let demoModePromise = null;

export const fetchDemoMode = () => {
  if (IS_DEMO_MODE) {
    return Promise.resolve(false);
  }
  if (!demoModePromise) {
    demoModePromise = window
      .fetch(`${API_BASE}/health`)
      .then((res) => (res.ok ? res.json() : { demoReadOnly: false }))
      .then((data) => Boolean(data?.demoReadOnly))
      .catch(() => false);
  }
  return demoModePromise;
};

export const useDemoMode = () => {
  const [demoReadOnly, setDemoReadOnly] = useState(false);

  useEffect(() => {
    let active = true;
    fetchDemoMode().then((flag) => {
      if (active) setDemoReadOnly(flag);
    });
    return () => {
      active = false;
    };
  }, []);

  return demoReadOnly;
};

if (IS_DEMO_MODE) {
  axios.defaults.adapter = demoAxiosAdapter;
} else {
  axios.interceptors.request.use((config) => {
    const user = getAuthUser();
    if (user?.token && config?.url?.startsWith(API_BASE)) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  });
}
