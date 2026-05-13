import React from "react"; 
export default function Header() {
    return (
            <div className="w-full h-25 bg-white shadow-md flex items-center px-6 z-10">
                <h1 className="text-5xl text-gray-700 rounded-xl p-4" style={{ fontFamily: 'Monoton, cursive' }}>Onion</h1>
                <h1 className="hidden sm:flex ml-2 text-3xl font-bold text-gray-700 text-center items-center">The Map</h1>
            </div>
    );
}   