import { Suspense, lazy, useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faChartBar,
  faClipboardCheck,
  faGear,
  faHouse,
  faPaperclip,
  faPeopleGroup,
  faTooth,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../layouts/AppShell";
import { LoadingState } from "../ui/States";
import { API_BASE, getAuthUser } from "../../utils/api";

const Dashboard = lazy(() => import("./Dashboard"));
const Submissions = lazy(() => import("./Submissions"));
const Student = lazy(() => import("./Student"));
const Group = lazy(() => import("./Group"));
const Tooth = lazy(() => import("./Tooth"));
const PW = lazy(() => import("./PW"));
const Profil = lazy(() => import("./Profil"));
const Statistiques = lazy(() => import("./Statistiques"));

const NAV_CONFIG = [
  { key: "dashboard", label: "Dashboard", icon: faHouse, to: "/professor/dashboard" },
  { key: "submissions", label: "Submissions", icon: faClipboardCheck, to: "/professor/submissions" },
  { key: "student", label: "Students", icon: faUser, to: "/professor/student" },
  { key: "group", label: "Groups", icon: faPeopleGroup, to: "/professor/group" },
  { key: "teeth", label: "Teeth", icon: faTooth, to: "/professor/teeth" },
  { key: "pw", label: "Practical work", icon: faPaperclip, to: "/professor/pw" },
  { key: "stats", label: "Statistics", icon: faChartBar, to: "/professor/stats" },
  { key: "profil", label: "Profile", icon: faGear, to: "/professor/profil" },
];

const VIEWS = {
  dashboard: Dashboard,
  submissions: Submissions,
  student: Student,
  group: Group,
  teeth: Tooth,
  pw: PW,
  stats: Statistiques,
  profil: Profil,
};

const ProfHome = () => {
  const { componentName } = useParams();
  const userlogin = getAuthUser();
  const [prof, setProf] = useState(userlogin);

  useEffect(() => {
    if (!userlogin?.id) return;
    let active = true;
    axios
      .get(`${API_BASE}/users/${userlogin.id}`)
      .then((res) => {
        if (active && res.data) setProf(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userlogin?.id]);

  const ActiveView = VIEWS[componentName];
  if (!ActiveView) {
    return <Navigate replace to="/professor/dashboard" />;
  }

  const currentNav = NAV_CONFIG.find((n) => n.key === componentName);
  const navItems = NAV_CONFIG.map((item) => ({
    ...item,
    active: item.key === componentName,
  }));

  return (
    <AppShell
      roleLabel="Professor"
      pageTitle={currentNav?.label || "Professor"}
      navItems={navItems}
      user={prof}
    >
      <Suspense fallback={<LoadingState label="Loading workspace..." />}>
        <ActiveView />
      </Suspense>
      <ToastContainer position="bottom-right" autoClose={3000} theme="light" />
    </AppShell>
  );
};

export default ProfHome;
