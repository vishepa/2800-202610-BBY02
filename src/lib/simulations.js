import supabase from '../components/shared/authentication/supabaseClient.js'

// Data layer for user-saved simulations. Talks directly to the Supabase
// `simulations` table — Row Level Security (see scripts/simulationsTable.sql)
// scopes every query to the logged-in user, so no user_id filter is needed
// on reads/deletes.

const SELECT_COLUMNS = 'id, name, description, placed_assets, created_at'

/**
 * Fetch the current user's saved simulations, newest first.
 * @returns {Promise<Array>} simulation rows (empty array if not logged in)
 */
export async function fetchSimulations() {
  const { data, error } = await supabase
    .from('simulations')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Persist a new simulation for the logged-in user.
 * @param {{name:string, description?:string, placedAssets:Array}} sim
 * @returns {Promise<object>} the saved row
 */
export async function saveSimulation({ name, description, placedAssets }) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('You must be logged in to save a simulation.')

  const { data, error } = await supabase
    .from('simulations')
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      placed_assets: placedAssets ?? [],
    })
    .select(SELECT_COLUMNS)
    .single()

  if (error) throw error
  return data
}

/**
 * Delete one of the user's saved simulations by id.
 * @param {string} id simulation row id
 */
export async function deleteSimulation(id) {
  const { error } = await supabase
    .from('simulations')
    .delete()
    .eq('id', id)

  if (error) throw error
}
