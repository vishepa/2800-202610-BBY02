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
          <h2 className="text-5xl text-gray-700 mb-4" style={{ fontFamily: 'Monoton, cursive' }}>Profile</h2>
          <p className="text-gray-600">Manage your profile information and preferences here.</p>
          <p>Name: John Doe</p>
          <p>Email: john.doe@example.com</p>
          <p>Password: ********</p>
        </div>
        <div className="bg-white shadow-md p-10 rounded-lg w-2/3 overflow-auto">
          <h2 className="text-5xl text-gray-700 mb-4" style={{ fontFamily: 'Monoton, cursive' }}>Saved Simulations</h2>
          <div className="grid grid-cols-5 gap-10">
            <div className=" w-70 h-70 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Saved1</div>
            <div className=" w-70 h-70 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Saved2</div>
            <div className=" w-70 h-70 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Saved3</div>
            <div className=" w-70 h-70 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Saved4</div>
            <div className=" w-70 h-70 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Saved5</div>   
            <div className=" w-70 h-70 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200">Saved6</div> 
          </div>
        </div>
      </div>
      <TogglePage page={page} setPage={setPage} sidebarOpen={sidebarOpen} />
    </div>
  );
}

export default AccountPage;