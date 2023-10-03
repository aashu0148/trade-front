import React from "react";
import { LogOut } from "react-feather";
import { useNavigate } from "react-router-dom";

import { handleLogout } from "utils/util";

function Navbar({ isAuthenticated = false, isAdmin = false }) {
  const navigate = useNavigate();

  const handleNavigate = (event, path) => {
    const isCtrl = event.ctrlKey;

    if (isCtrl) return window.open(path, "_blank");

    navigate(path);
  };

  return (
    <div className="top-bar">
      <div className={"links"}>
        <p className={`link`} onClick={(e) => handleNavigate(e, "/")}>
          Home
        </p>
        <p className={`link`} onClick={(e) => handleNavigate(e, "/configure")}>
          Configure
        </p>

        {isAdmin ? (
          <>
            <p className={`link`} onClick={(e) => handleNavigate(e, "/stocks")}>
              Stocks
            </p>
            <p className={`link`} onClick={(e) => handleNavigate(e, "/test")}>
              Test
            </p>
          </>
        ) : (
          ""
        )}
      </div>
      {isAuthenticated ? (
        <p className="logout" onClick={handleLogout}>
          <LogOut /> Logout
        </p>
      ) : (
        ""
      )}
    </div>
  );
}

export default Navbar;
