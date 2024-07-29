import React, { useState } from "react";
import "./Userinfo.css";
import { useUserStore } from "../../../lib/userStore";
import { auth } from "../../../lib/firebase"; // Make sure to import auth

const Userinfo = () => {
  const { currentUser } = useUserStore();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleMoreClick = () => {
    setShowLogout(!showLogout);
  };

  return (
    <div className="Userinfo">
      {showLogout && (
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      )}
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="" onClick={handleMoreClick} />
        
      </div>
    </div>
  );
};

export default Userinfo;
