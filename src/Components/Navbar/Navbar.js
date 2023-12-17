import React, { useContext, useState } from "react";
import { LogOut, Menu, X } from "react-feather";
import { useNavigate } from "react-router-dom";

import Backdrop from "Components/Backdrop/Backdrop";

import { yotaIcon } from "utils/svgs";
import { AppContext } from "App";

import { handleLogout } from "utils/util";

function Navbar({ isAuthenticated = false, isAdmin = false }) {
  const { mobileView: isMobileView } = useContext(AppContext);
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);

  const handleNavigate = (event, path) => {
    const isCtrl = event.ctrlKey;

    if (isCtrl) return window.open(path, "_blank");

    navigate(path);
  };

  const links = (
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
          <p className={`link`} onClick={(e) => handleNavigate(e, "/live")}>
            Live Stock
          </p>
          <p
            className={`link`}
            onClick={(e) => handleNavigate(e, "/live-market")}
          >
            Live Market
          </p>
        </>
      ) : (
        ""
      )}
    </div>
  );

  return (
    <div className="top-bar">
      {showMenu ? (
        <Backdrop
          onClose={() => setShowMenu(false)}
          className={"backdrop"}
          startFromLeft
        >
          {links}
        </Backdrop>
      ) : (
        ""
      )}

      <div className="left-bar">
        {isMobileView ? (
          <div className="burger" onClick={() => setShowMenu((prev) => !prev)}>
            {showMenu ? <X /> : <Menu />}
          </div>
        ) : (
          ""
        )}

        <div className={"logo"} onClick={(e) => handleNavigate(e, "/")}>
          {yotaIcon}
          <p>YOTA</p>
        </div>
      </div>

      {!isMobileView ? links : ""}

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
