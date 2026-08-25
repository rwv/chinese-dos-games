import type { GameInfo } from '../types'

interface DosSettings {
  xms: boolean
  ems: boolean
}

function readDosSettings(args?: string[]): DosSettings {
  const settings = { xms: true, ems: true }
  if (!args) return settings

  for (let i = 0; i < args.length; i += 2) {
    if (args[i] !== '-c' || !args[i + 1]) continue
    const match = args[i + 1].match(/^config -set (?:dosbox|dos) (xms|ems)=(true|false)$/i)
    if (match) {
      settings[match[1].toLowerCase() as keyof DosSettings] = match[2].toLowerCase() === 'true'
    }
  }
  return settings
}

function extraCommands(args?: string[]): string[] {
  if (!args) return []

  const commands: string[] = []
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] !== '-c' || !args[i + 1]) continue
    if (!/^config -set (?:dosbox|dos) (xms|ems)=/i.test(args[i + 1])) {
      commands.push(args[i + 1])
    }
  }
  return commands
}

export function buildDosboxConf(game: GameInfo): string {
  const dos = readDosSettings(game.dosboxArgs)
  const autoexec = ['echo off']

  if (game.bootImage) {
    autoexec.push(`imgmount c "./${game.bootImage}"`)
    autoexec.push('boot -l c')
  } else {
    if (game.floppy) {
      autoexec.push(`mount ${game.floppy} . -t floppy`)
      autoexec.push(`${game.floppy}:`)
    } else {
      autoexec.push('mount c .')
      autoexec.push('c:')
    }

    const cdImages = game.cdImages && game.cdImages.length > 0
      ? game.cdImages
      : (game.cdImage ?? game.img ? [game.cdImage ?? game.img!] : null)
    if (cdImages) {
      autoexec.push(`imgmount d ${cdImages.map((p) => `"./${p}"`).join(' ')} -t iso`)
    } else if (game.cdrom) {
      autoexec.push(`mount d "./${game.cdromPath ?? ''}" -t cdrom`)
    }

    autoexec.push(...extraCommands(game.dosboxArgs))
    autoexec.push(game.executable)
  }

  return `[sdl]
autolock=false
fullscreen=false

[dosbox]
machine=${game.machine ?? 'svga_s3'}
memsize=${game.memsize ?? 16}

[cpu]
core=auto
cputype=auto
cycles=auto
cycleup=10
cycledown=20

[mixer]
nosound=false
rate=44100
blocksize=1024
prebuffer=20

[midi]
mpu401=intelligent
mididevice=default

[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
sbmixer=true
oplmode=auto

[gus]
gus=false

[speaker]
pcspeaker=true
tandy=auto
disney=true

[joystick]
joysticktype=auto
timed=true
autofire=false

[dos]
xms=${dos.xms}
ems=${dos.ems}
umb=true
keyboardlayout=auto

[ipx]
ipx=false

[autoexec]
${autoexec.join('\n')}
`
}
