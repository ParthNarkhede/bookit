import {
  addEligibleUser,
  addEligibleUsersBulk,
  listEligibleUsers,
  removeEligibleUser,
} from '../services/eligibleUserService'

export async function fetchEligibleUsers() {
  try {
    const users = await listEligibleUsers()
    return { success: true, users }
  } catch {
    return { success: false, error: 'Unable to load eligible users.', users: [] }
  }
}

export async function createEligibleUser(email, adminEmail) {
  const trimmed = email?.trim()
  if (!trimmed) {
    return { success: false, error: 'Email is required.' }
  }

  try {
    await addEligibleUser(trimmed, adminEmail)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message || 'Unable to add user.' }
  }
}

export async function importEligibleUsersFromFile(file, adminEmail) {
  if (!file) {
    return { success: false, error: 'Please choose a file.' }
  }

  try {
    const emails = await parseEmailsFromFile(file)
    if (!emails.length) {
      return { success: false, error: 'No valid emails found in the file.' }
    }

    const result = await addEligibleUsersBulk(emails, adminEmail)
    return {
      success: true,
      message: `Added ${result.added} email(s)${result.failed ? `, ${result.failed} failed` : ''}.`,
    }
  } catch {
    return { success: false, error: 'Unable to parse the uploaded file.' }
  }
}

async function parseEmailsFromFile(file) {
  const name = file.name.toLowerCase()

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    return extractEmailsFromRows(rows)
  }

  const text = await file.text()
  const rows = text.split(/\r?\n/).map((line) => line.split(/[,;\t]/))
  return extractEmailsFromRows(rows)
}

function extractEmailsFromRows(rows) {
  const emails = []
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  rows.forEach((row) => {
    const cells = Array.isArray(row) ? row : [row]
    cells.forEach((cell) => {
      const value = String(cell || '').trim().toLowerCase()
      if (pattern.test(value)) {
        emails.push(value)
      }
    })
  })

  return emails
}

export async function deleteEligibleUser(email) {
  try {
    await removeEligibleUser(email)
    return { success: true }
  } catch {
    return { success: false, error: 'Unable to remove user.' }
  }
}
