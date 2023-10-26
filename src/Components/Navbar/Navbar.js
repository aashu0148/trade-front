import React from "react";
import { LogOut } from "react-feather";
import { useNavigate } from "react-router-dom";
import { yotaIcon } from "utils/svgs";

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
      <div className={"logo"} onClick={(e) => handleNavigate(e, "/")}>
        {yotaIcon}
        <p>YOTA</p>
      </div>

      <div className={"links"}>
        <p className={`link`} onClick={(e) => handleNavigate(e, "/configure")}>
          Config
        </p>
        <p className={`link`} onClick={(e) => handleNavigate(e, "/calendar")}>
          Calendar
        </p>

        {isAdmin ? (
          <>
            <p className={`link`} onClick={(e) => handleNavigate(e, "/stocks")}>
              Stocks
            </p>
            {/* <p className={`link`} onClick={(e) => handleNavigate(e, "/test")}>
              Test
            </p> */}
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
