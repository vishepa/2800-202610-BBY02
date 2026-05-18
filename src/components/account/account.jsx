import { useAuth } from '../shared/authentication/AuthContext.jsx'
import TogglePage from "../shared/TogglePage.jsx"

function AccountPage({ onBack, page, setPage }) {
  const { user, signOut } = useAuth() ?? {}; 

  const handleSignOut = async () => {
    await signOut()
    setPage('login')
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row flex-1 p-5 gap-5">

        {/* Profile */}
        <div className="bg-white shadow-md p-10 rounded-lg w-full md:w-1/3 flex flex-col">
          <h2 className="p-5 bg-green-300 text-4xl text-gray-700 mb-4 rounded-xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif' }}>Profile</h2>
          <div className="flex flex-col gap-4 bg-gray-100 p-5 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <img src="../../public/user.png" alt="Profile" className="ml-5 w-15 h-15 rounded-full" />
              <h2 className="text-2xl">You</h2>
            </div>
            <div>
              <p className="mt-4 text-gray-600">Email: {user?.email}</p>
              <p className="mt-2 text-gray-600">
                Member since: {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-4 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/*saved sims*/}
        <div className="bg-white shadow-md p-10 rounded-lg w-full md:w-2/3 md:overflow-auto">
          <h2 className="p-5 bg-green-300 text-4xl font-bold text-gray-700 mb-4 rounded-xl" style={{ fontFamily: 'Playfair Display, serif' }}>Saved Simulations</h2>
          <div className="flex flex-wrap gap-5">
            <div className="w-full h-48 md:w-40 md:h-40 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200 text-sm text-center p-2">Snapshot 1, name 1, desc 1</div>
            <div className="w-full h-48 md:w-40 md:h-40 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200 text-sm text-center p-2">Snapshot 1, name 1, desc 1</div>
            <div className="w-full h-48 md:w-40 md:h-40 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200 text-sm text-center p-2">Snapshot 1, name 1, desc 1</div>
            <div className="w-full h-48 md:w-40 md:h-40 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200 text-sm text-center p-2">Snapshot 1, name 1, desc 1</div>
            <div className="w-full h-48 md:w-40 md:h-40 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-lg hover:shadow-xl transition-shadow hover:bg-green-200 text-sm text-center p-2">Snapshot 1, name 1, desc 1</div>
          </div>
        </div>

      </div>
      <TogglePage page={page} setPage={setPage} sidebarOpen={false} />
    </div>
  )
}

export default AccountPage