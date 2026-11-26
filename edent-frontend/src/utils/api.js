import axios from "axios";
import { useEffect, useState } from "react";

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

export const API_PORT = import.meta.env.VITE_PORT_SPRING || 5050;
export const API_BASE = rawBaseUrl
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
  const user = getAuthUser();
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

let demoModePromise = null;

export const fetchDemoMode = () => {
  if (!demoModePromise) {
    demoModePromise = fetch(`${API_BASE}/health`)
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
