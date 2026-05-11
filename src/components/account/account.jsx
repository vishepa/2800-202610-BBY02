import React from "react";

function AccountPage({ onBack }) {
  return (
    <div className="bg-gray-100 h-screen">
      <div className="w-full h-25 bg-white shadow-md flex items-center px-6 z-10">
        <button
          className="text-2xl sm:text-4xl bg-green-400 rounded-xl font-bold text-gray-700 shadow-md p-1 sm:p-2 cursor-pointer transition-all duration-300"
          onClick={onBack}
        >
          Onion
        </button>
        <h1 className="absolute -translate-x-1/2 font-bold left-1/2 px-3 h-12 flex items-center p-8 bg-green-400 text-gray-700 rounded-xl whitespace-nowrap text-xl sm:text-3xl lg:text-4xl">
          <span className="hidden md:block">The Interactive Food Security Map</span>
          <span className="block md:hidden">Food Security Map</span>
        </h1>
      </div>
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
    </div>
  );
}

export default AccountPage;