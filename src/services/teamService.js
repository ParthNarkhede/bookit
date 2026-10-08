import {
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const TEAMS_COLLECTION = 'teams'
export const TEAM_SEED_DOCUMENT_ID = '3HdpARk0HK4SMYvCIIdq'

function mapTeamDocs(snapshot) {
  return snapshot.docs
    .map((teamDoc) => {
      const data = teamDoc.data()
      return {
        id: teamDoc.id,
        teamId: data.team_id || data.teamid || teamDoc.id,
        name: (data.team || data.name || '').trim(),
      }
    })
    .filter((team) => team.name)
    .sort((left, right) => left.name.localeCompare(right.name))
}

export async function getAllTeams() {
  if (!db) {
    return []
  }

  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION))
  return mapTeamDocs(snapshot)
}

export function subscribeToTeams(onChange, onError) {
  if (!db) {
    onChange([])
    return () => {}
  }

  return onSnapshot(
    collection(db, TEAMS_COLLECTION),
    (snapshot) => onChange(mapTeamDocs(snapshot)),
    (error) => {
      onChange([])
      onError?.(error)
    },
  )
}

export async function createTeam(name, userId) {
  if (!db) {
    throw new Error('Database is not available.')
  }

  const seedRef = doc(db, TEAMS_COLLECTION, TEAM_SEED_DOCUMENT_ID)
  const seedSnapshot = await getDoc(seedRef)
  const seedName = seedSnapshot.exists() ? seedSnapshot.data().team?.trim() : ''
  const teamRef = !seedName ? seedRef : doc(collection(db, TEAMS_COLLECTION))
  const now = Date.now()
  const team = {
    team: name,
    team_id: teamRef.id,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(teamRef, team)
  return { id: teamRef.id, teamId: teamRef.id, name, ...team }
}

export async function updateTeam(teamId, name) {
  if (!db || !teamId) {
    throw new Error('Team not found.')
  }

  await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
    team: name,
    team_id: teamId,
    name: deleteField(),
    teamid: deleteField(),
    updatedAt: Date.now(),
  })
}

export async function deleteTeam(teamId) {
  if (!db || !teamId) {
    throw new Error('Team not found.')
  }

  await deleteDoc(doc(db, TEAMS_COLLECTION, teamId))
}
