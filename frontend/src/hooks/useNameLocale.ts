import { useEffect, useState } from 'react'

export type NameLocale = 'zh-Hans' | 'en'

const STORAGE_KEY = 'chinese-dos-games.nameLocale'

function read(): NameLocale {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'zh-Hans') return v
  } catch {
    // SSR / disabled localStorage
  }
  return 'zh-Hans'
}

function write(v: NameLocale) {
  try {
    localStorage.setItem(STORAGE_KEY, v)
  } catch {
    // ignore
  }
}

/** 返回当前语言偏好 (zh-Hans 或 en), 初次读 localStorage 后缓存 */
export function useNameLocale(): [NameLocale, (v: NameLocale) => void] {
  const [locale, setLocale] = useState<NameLocale>(read)

  // 跨标签页同步
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && (e.newValue === 'en' || e.newValue === 'zh-Hans')) {
        setLocale(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return [locale, (v) => {
    write(v)
    setLocale(v)
  }]
}
