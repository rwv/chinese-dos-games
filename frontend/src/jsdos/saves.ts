const DB_NAME = 'chinese-dos-games'
const STORE_NAME = 'js-dos-saves'
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadSave(identifier: string): Promise<Uint8Array | null> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(identifier)
    let value: unknown
    request.onsuccess = () => { value = request.result }
    tx.oncomplete = () => {
      database.close()
      if (value instanceof ArrayBuffer) resolve(new Uint8Array(value))
      else if (value instanceof Uint8Array) resolve(value)
      else resolve(null)
    }
    tx.onerror = () => reject(tx.error)
  })
}

export async function storeSave(identifier: string, changes: Uint8Array): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(changes.slice().buffer, identifier)
    tx.oncomplete = () => {
      database.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}
