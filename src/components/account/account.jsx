import React from "react";
import TogglePage from "../shared/TogglePage.jsx";
import Header from "../shared/Header.jsx";

function AccountPage({ onBack, page, setPage }) {
  const sidebarOpen = false; //no sidebar on account page, but need to pass this prop down to header and toggle button to hide them on mobile
  return (
    <div className="bg-gray-100 h-screen">
      <Header sidebarOpen={sidebarOpen} />
      <div className="flex">
        <div className="bg-white shadow-md p-6 rounded-lg m-5 w-1/3 h-100">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Account Settings</h2>
          <p className="text-gray-600">Manage your account preferences and settings here.</p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg m-5 w-2/3 h-100">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Account Information</h2>
          <p className="text-gray-600">View and update your account details here.</p>
        </div>
      </div>
      <TogglePage page={page} setPage={setPage} sidebarOpen={sidebarOpen} />
    </div>
  );
}

export default AccountPage;