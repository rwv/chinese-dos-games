import type { DosFn } from './types'

const STYLE_URL = '/js-dos/js-dos.css'
const SCRIPT_URL = '/js-dos/js-dos.js'

let runtimePromise: Promise<DosFn> | null = null

function loadStyle(): void {
  if (document.querySelector(`link[href="${STYLE_URL}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = STYLE_URL
  document.head.appendChild(link)
}

export function loadJsDos(): Promise<DosFn> {
  if (window.Dos) return Promise.resolve(window.Dos)
  if (runtimePromise) return runtimePromise

  loadStyle()
  runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.onload = () => {
      if (window.Dos) {
        resolve(window.Dos)
      } else {
        reject(new Error('js-dos runtime loaded without Dos API'))
      }
    }
    script.onerror = () => {
      script.remove()
      runtimePromise = null
      reject(new Error(`Failed to load ${SCRIPT_URL}`))
    }
    document.head.appendChild(script)
  })

  return runtimePromise
}
