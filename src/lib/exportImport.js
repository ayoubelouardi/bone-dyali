import { readAllWorkspaceData, importWorkspaceData } from './db.js'

export async function exportAllData(workspaceId) {
  const data = await readAllWorkspaceData(workspaceId)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bone-dyali-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importAllData(file, workspaceId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.books || !Array.isArray(data.books)) {
          reject(new Error('Invalid backup: missing books array'))
          return
        }
        await importWorkspaceData(workspaceId, data)
        resolve()
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
