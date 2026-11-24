import AccessLogin from "./pages/AccessLogin";
import { Routes, Route } from "react-router-dom";
import Forgot from "./pages/Forgot";
import Homepage from "./pages/Homepage";
import ProfileUser from "./pages/ProfileUser";
import ChangePassword from "./pages/ChangePassword";
import { useState } from "react";
import Auth2FA from "./pages/Auth2FA";
import { ToastContainer } from 'react-toastify';
import { Slide } from 'react-toastify';


function App() {
  const [colorTheme, setColorTheme] = useState("light");

  function handleColorTheme(theme) {
    setColorTheme(theme)
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<AccessLogin handleColorTheme={handleColorTheme} />} />
        <Route path="/login" element={<AccessLogin handleColorTheme={handleColorTheme} />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/homepage" element={<Homepage handleColorTheme={handleColorTheme} />} />
        <Route path="/profile/:username" element={<ProfileUser />} />
        <Route path="/changePassword" element={<ChangePassword />} />
        <Route path="/auth2FA" element={<Auth2FA />} />
      </Routes>
      <ToastContainer
        transition={Slide}
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={colorTheme}
        closeButton={false}
      />
    </>
  );
}

export default App;