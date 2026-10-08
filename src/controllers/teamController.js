import { createTeam, deleteTeam, getAllTeams, updateTeam } from '../services/teamService'

export async function saveTeam({ teamId, name, userId }) {
  const normalizedName = name?.trim()
  if (!normalizedName) {
    return { success: false, error: 'Team name is required.' }
  }

  try {
    const teams = await getAllTeams()
    const duplicate = teams.find(
      (team) => team.id !== teamId && team.name.toLowerCase() === normalizedName.toLowerCase(),
    )
    if (duplicate) {
      return { success: false, error: 'A team with this name already exists.' }
    }

    if (teamId) {
      await updateTeam(teamId, normalizedName)
    } else {
      await createTeam(normalizedName, userId)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error?.code === 'permission-denied'
        ? 'Firebase denied this change. Deploy firestore.rules and verify your account has the admin role.'
        : `Unable to save team. Please try again${error?.code ? ` (${error.code})` : ''}.`,
    }
  }
}

export async function removeTeam(team) {
  if (!team?.id) {
    return { success: false, error: 'Team not found.' }
  }

  try {
    await deleteTeam(team.id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error?.code === 'permission-denied'
        ? 'Firebase denied this change. Deploy firestore.rules and verify your account has the admin role.'
        : `Unable to remove team. Please try again${error?.code ? ` (${error.code})` : ''}.`,
    }
  }
}
