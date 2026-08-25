/** Emularity 引擎的存档导出工具.
 *
 * Emularity 用 AsyncMirror(IndexedDB) 镜像游戏的所有文件读写.
 * 直接导出完整的 IndexedDB 数据库.
 */

const DB_NAMES = ['emularity', 'js-dos']

interface IbdResult {
  name: string
  stores: { name: string; items: [IDBValidKey, unknown][] }[]
}

/** 列出当前 origin 下所有相关 emularity/js-dos IndexedDB */
export async function listSaveDatabases(): Promise<string[]> {
  if (!indexedDB.databases) return []
  const list = await indexedDB.databases()
  return list
    .map((d) => d.name)
    .filter((n): n is string => !!n && DB_NAMES.some((prefix) => n.startsWith(prefix)))
}

/** 从 IndexedDB 读取整个数据库内容, 序列化为可下载 JSON */
export async function exportAllSaves(): Promise<string> {
  const out: Record<string, IbdResult> = {}
  for (const dbName of await listSaveDatabases()) {
    const db = await openDB(dbName)
    const result: IbdResult = { name: dbName, stores: [] }
    for (const storeName of Array.from(db.objectStoreNames)) {
      const items = await readAll(db, storeName)
      result.stores.push({ name: storeName, items: items as [IDBValidKey, unknown][] })
    }
    db.close()
    out[dbName] = result
  }
  return JSON.stringify(out, (_, v) => {
    if (v instanceof Uint8Array || v instanceof ArrayBuffer) {
      const ab = v instanceof Uint8Array ? v.buffer : v
      return { __binary: true, base64: arrayBufferToBase64(ab as ArrayBuffer) }
    }
    return v
  }, 2)
}

/** 触发浏览器下载 */
export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function openDB(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function readAll(db: IDBDatabase, storeName: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const items: unknown[] = []
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        items.push([cursor.key, cursor.value])
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve(items)
    tx.onerror = () => reject(tx.error)
  })
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}
