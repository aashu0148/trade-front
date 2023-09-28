import React, { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LogOut } from "react-feather";
import { io } from "socket.io-client";

import Banner from "Components/Banner/Banner";
import Spinner from "Components/Spinner/Spinner";
import AuthPage from "Pages/AuthPage/AuthPage";
import TradePage from "Pages/TradePage/TradePage";
import ConfigurationPage from "Pages/ConfigurationPage/ConfigurationPage";
import TestPage from "Pages/TestPage/TestPage";
import Navbar from "Components/Navbar/Navbar";

import { getCurrentUser, sayHiToBackend } from "apis";
import { handleLogout } from "utils/util";

import "styles/global.scss";

let socket;
const backendUrl = process.env.REACT_APP_BACKEND_URL;
function App() {
  const [appLoaded, setAppLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [banner, setBanner] = useState({});

  const greetBackend = async () => {
    await sayHiToBackend();
  };

  const handleUserDetection = async () => {
    const tradeToken = localStorage.getItem("trade-token");
    if (!tradeToken) {
      setAppLoaded(true);
      setIsAuthenticated(false);

      if (!window.location.href.includes("auth"))
        window.location.href = "/auth";
      return;
    }

    let res = await getCurrentUser();
    setAppLoaded(true);
    if (!res) {
      if (!window.location.href.includes("auth"))
        window.location.href = "/auth";
      return;
    }

    setIsAuthenticated(true);
  };

  const handleSocketEvents = () => {
    socket.on("connect", () => {
      setBanner({
        show: true,
        green: true,
        text: "🟢 Connection established successfully!",
      });

      setTimeout(() => {
        setBanner((prev) => ({
          ...prev,
          show: false,
        }));
      }, 3000);

      socket.emit("join", { userId: "dummy" });
      console.log("🔵 Socket connected");
    });

    socket.on("disconnect", () => {
      setBanner({
        show: true,
        green: false,
        red: true,
        blinking: true,
        text: "🟡 Socket disconnected, trying to reconnect",
      });

      console.log("🔴 Socket disconnected");
    });

    socket.on("error", (msg) => {
      console.log("⚠️ Socket Error", msg);
      toast.error(msg);
    });
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    socket = io(backendUrl);
    handleSocketEvents();

    return () => {
      if (socket?.disconnect) socket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    handleUserDetection();

    setInterval(() => {
      greetBackend();
    }, 60 * 1000);
  }, []);

  return (
    <div className="main-app">
      <Toaster
        position="bottom"
        toastOptions={{
          duration: 3000,
        }}
      />
      {banner.show ? <Banner bannerDetails={banner} /> : ""}

      {appLoaded ? (
        <Router>
          <Navbar isAuthenticated={isAuthenticated} />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            {isAuthenticated ? (
              <Route path="/">
                <Route path="/" element={<TradePage socket={socket} />} />
                <Route path="/configure" element={<ConfigurationPage />} />
                <Route path="/test" element={<TestPage />} />
              </Route>
            ) : (
              ""
            )}

            <Route
              path="/*"
              element={
                <div className="spinner-container">
                  <h1>Page not found</h1>
                </div>
              }
            />
          </Routes>
        </Router>
      ) : (
        <div className="spinner-container">
          <Spinner />
        </div>
      )}
    </div>
  );
}

export default App;
