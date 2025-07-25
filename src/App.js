import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import Homepage from "./pages/Homepage/Homepage";
import GetStarted from "./pages/GetStarted/GetStarted";
import Header from "./components/Header/Header";
import User from "./pages/User/User";

function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData !== null) {
      setUser(JSON.parse(userData));
    }

    NProgress.start();
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location]);

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route
          path="/user"
          element={
            user?.username ? (
              <Navigate to={`/user/${user.username}`} replace />
            ) : (
              <Navigate to="/get-started" replace />
            )
          }
        />
        <Route path="/user/:username" element={<User/>} />
      </Routes>
    </div>
  );
}

export default App;
