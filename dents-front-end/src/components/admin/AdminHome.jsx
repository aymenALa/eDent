import { faUserTie } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppShell from "../../layouts/AppShell";
import Professors from "./Professors";
import { getAuthUser } from "../../utils/api";

const AdminHome = () => {
  const userlogin = getAuthUser();
  const navItems = [
    {
      key: "professors",
      label: "Professors",
      icon: faUserTie,
      to: "/admin",
      active: true,
    },
  ];

  return (
    <AppShell
      roleLabel="Administrator"
      pageTitle="Professor Management"
      navItems={navItems}
      user={userlogin}
    >
      <Professors />
      <ToastContainer position="bottom-right" autoClose={3000} theme="light" />
    </AppShell>
  );
};

export default AdminHome;
