import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import logo from "./logo.png"

import Homepage from "./pages/Homepage/Homepage";
import GetStarted from "./pages/GetStarted/GetStarted";
import Header from "./components/Header/Header";
import User from "./pages/User/User";
import Rooms from "./pages/Rooms/Rooms";
import Create from "./pages/Create/Create";
import Edit from "./pages/Edit/Edit";
import Footer from "./components/Footer/Footer";


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

  // Скрываем Header на странице /edit/:id
  const showHeader = !location.pathname.startsWith("/edit/");

  return (
    <div className="App">
      {showHeader && <Header />}
      {/* <ToHome/> */}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route
          path="/user"
          element={
            user?.id ? (
              <Navigate to={`/user/${user.id}`} replace />
            ) : (
              <Navigate to="/get-started" replace />
            )
          }
        />
        <Route path="/user/:id" element={<User />} />
        <Route path="/user/:id/rooms" element={<Rooms />} />
        <Route path="/create" element={<Create />} />
        <Route path="/edit/:id" element={<Edit />} />
      </Routes>

    </div>
  );
}

export default App;
