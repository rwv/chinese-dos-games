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

/** 导出指定游戏的存档为可下载文件 (.zip) */
export async function exportSave(identifier: string): Promise<void> {
  const changes = await loadSave(identifier)
  if (!changes || changes.length === 0) {
    throw new Error('该游戏还没有存档')
  }
  const blob = new Blob([new Uint8Array(changes)], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${identifier}.save.zip`
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 从用户选择的文件恢复存档 */
export async function importSave(identifier: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer()
  await storeSave(identifier, new Uint8Array(buffer))
}
