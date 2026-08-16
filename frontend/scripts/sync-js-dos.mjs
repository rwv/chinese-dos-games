import { cp, mkdir } from 'node:fs/promises'

const source = new URL('../node_modules/js-dos/dist/', import.meta.url)
const target = new URL('../public/js-dos/', import.meta.url)
const emulatorFiles = [
  'emulators.js',
  'wdosbox.js',
  'wdosbox.wasm',
  'wlibzip.js',
  'wlibzip.wasm',
]

await mkdir(new URL('emulators/', target), { recursive: true })
await cp(new URL('js-dos.js', source), new URL('js-dos.js', target))
await cp(new URL('js-dos.css', source), new URL('js-dos.css', target))
for (const filename of emulatorFiles) {
  await cp(new URL(`emulators/${filename}`, source), new URL(`emulators/${filename}`, target))
}
