import { useEffect, useState } from 'react'
import { useAuth } from '../shared/authentication/AuthContext.jsx'
import TogglePage from "../shared/TogglePage.jsx"
import { fetchSimulations, deleteSimulation } from '../../lib/simulations.js'
import accountIcon from "../../../public/user.png";


function AccountPage({ page, setPage, loadSimulation }) {
  const { user, signOut } = useAuth() ?? {};

  // sims === null means "still loading".
  const [sims, setSims] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSimulations()
      .then(data => { if (!cancelled) setSims(data); })
      .catch(err => {
        if (cancelled) return;
        setError(err.message || "Could not load saved simulations.");
        setSims([]);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSignOut = async () => {
    await signOut()
    setPage('login')
  }

  const handleDelete = async (id) => {
    const previous = sims;
    // Optimistic removal — restore the list if the delete fails.
    setSims(sims.filter(s => s.id !== id));
    try {
      await deleteSimulation(id);
    } catch (err) {
      setError(err.message || "Could not delete simulation.");
      setSims(previous);
    }
  };

  return (
    <div className="bg-gray-100 h-full flex flex-col">
      <div className="flex flex-col md:flex-row flex-1 p-5 gap-5">

        {/* Profile */}
        <div className="bg-white shadow-md p-10 rounded-lg w-full md:w-1/3 flex flex-col">
          <h2 className="p-5 bg-green-300 text-4xl text-gray-700 mb-4 rounded-xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif' }}>Profile</h2>
          <div className="flex flex-col gap-4 bg-gray-100 p-5 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <img src={accountIcon} alt="Profile" className="ml-5 w-15 h-15 rounded-full" />
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

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {sims === null ? (
            <p className="text-gray-500">Loading saved simulations…</p>
          ) : sims.length === 0 ? (
            <p className="text-gray-500">
              No saved simulations yet. Build a scenario in the simulation panel and hit “Save Simulation”.
            </p>
          ) : (
            <div className="flex flex-wrap gap-5">
              {sims.map(sim => (
                <div
                  key={sim.id}
                  onClick={() => loadSimulation?.(sim)}
                  title="Load this simulation onto the map"
                  className="relative w-full h-48 md:w-40 md:h-40 shrink-0 bg-gray-100 rounded-lg flex flex-col p-3 shadow-lg hover:shadow-xl hover:bg-green-200 transition-shadow cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(sim.id); }}
                    title="Delete simulation"
                    className="absolute top-1 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded text-lg leading-none transition-colors"
                  >
                    ×
                  </button>
                  <h3 className="font-semibold text-gray-700 truncate pr-5">{sim.name}</h3>
                  <p className="flex-1 mt-1 text-xs text-gray-500 overflow-hidden">
                    {sim.description || 'No description'}
                  </p>
                  <div className="mt-auto text-xs text-gray-400">
                    {(sim.placed_assets?.length ?? 0)} asset{(sim.placed_assets?.length ?? 0) === 1 ? '' : 's'}
                    {' · '}
                    {new Date(sim.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <TogglePage page={page} setPage={setPage} sidebarOpen={false} />
    </div>
  )
}

export default AccountPage
