import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import Homepage from "./pages/Homepage/Homepage";
import GetStarted from "./pages/GetStarted/GetStarted";
import Header from "./components/Header/Header";

function App() {
  const location = useLocation();

  useEffect(() => {
   
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
      </Routes>
    </div>
  );
}

export default App;
