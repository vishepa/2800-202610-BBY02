import React from "react";
import TogglePage from "../shared/TogglePage.jsx";
import Header from "../shared/Header.jsx";

function AccountPage({ onBack, page, setPage }) {
  const sidebarOpen = false;
  return (
    <div className="bg-gray-100 h-screen flex flex-col">
      <Header sidebarOpen={sidebarOpen} />
      <div className="flex flex-1 overflow-hidden p-5 gap-5 min-h-0">
        <div className="bg-white shadow-md p-10 rounded-lg w-1/3 overflow-auto">
          <h2 className="p-5 bg-green-300 text-4xl text-gray-700 mb-4 rounded-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Profile</h2>
          <div className="flex items-center gap-4">
            <img src="../../public/user.png" alt="Profile Image" className="ml-5 w-15 h-15 rounded-full" />
            <h2 className="text-2xl">my name: jeff</h2>
          </div>
        </div>
        <div className="bg-white shadow-md p-10 rounded-lg w-2/3 overflow-auto">
          <h2 className="p-5 bg-green-300 text-4xl font-bold text-gray-700 mb-4 rounded-xl" style={{ fontFamily: 'Playfair Display, serif' }}>Saved Simulations</h2>
          <div className="grid grid-cols-5 gap-5">
            <div className=" w-50 h-50 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Snapshot 1, name 1 ,desc 1</div>
            <div className=" w-50 h-50 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Snapshot 1, name 1 ,desc 1</div>
            <div className=" w-50 h-50 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Snapshot 1, name 1 ,desc 1</div>
            <div className=" w-50 h-50 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Snapshot 1, name 1 ,desc 1</div>
            <div className=" w-50 h-50 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Snapshot 1, name 1 ,desc 1</div>
          </div>
        </div>
      </div>
      <TogglePage page={page} setPage={setPage} sidebarOpen={sidebarOpen} />
    </div>
  );
}

export default AccountPage;