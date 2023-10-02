import React from "react";
import { LogOut } from "react-feather";
import { useNavigate } from "react-router-dom";

import { handleLogout } from "utils/util";

function Navbar({ isAuthenticated = false, isAdmin = false }) {
  const navigate = useNavigate();

  return (
    <div className="top-bar">
      <div className={"links"}>
        <p className={`link`} onClick={() => navigate("/")}>
          Home
        </p>
        <p className={`link`} onClick={() => navigate("/configure")}>
          Configure
        </p>

        {isAdmin ? (
          <>
            <p className={`link`} onClick={() => navigate("/stocks")}>
              Stocks
            </p>
            <p className={`link`} onClick={() => navigate("/test")}>
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
