import { describe, expect, test } from 'bun:test'
import { buildDosboxConf } from '../src/jsdos/config'
import type { GameInfo } from '../src/types'

function game(overrides: Partial<GameInfo> = {}): GameInfo {
  return {
    identifier: '测试游戏',
    name: { 'zh-Hans': '测试游戏' },
    executable: 'GAME.EXE',
    sha256: 'test',
    ...overrides,
  }
}

describe('buildDosboxConf', () => {
  test('mounts a normal game on C', () => {
    const config = buildDosboxConf(game())

    expect(config).toContain('mount c .\nc:\nGAME.EXE')
  })

  test('preserves the configured floppy drive letter', () => {
    const config = buildDosboxConf(game({ floppy: 'b' }))

    expect(config).toContain('mount b . -t floppy\nb:\nGAME.EXE')
    expect(config).not.toContain('mount c .')
  })

  test('mounts an embedded ISO on D', () => {
    const config = buildDosboxConf(game({ cdImage: 'GAME.iso' }))

    expect(config).toContain('imgmount d "./GAME.iso" -t iso')
  })

  test('mounts a ZIP as both hard disk and CD-ROM', () => {
    const config = buildDosboxConf(game({ cdrom: true }))

    expect(config).toContain('mount c .')
    expect(config).toContain('mount d "./" -t cdrom')
  })

  test('mounts a CD-ROM subdirectory', () => {
    const config = buildDosboxConf(game({ cdrom: true, cdromPath: 'CDROM' }))

    expect(config).toContain('mount d "./CDROM" -t cdrom')
  })

  test('runs per-game commands after mounting drives', () => {
    const config = buildDosboxConf(game({
      dosboxArgs: ['-c', 'echo patched>C:\\GAME.CFG'],
    }))

    expect(config).toContain('mount c .\nc:\necho patched>C:\\GAME.CFG\nGAME.EXE')
  })

  test('applies per-game DOS memory settings', () => {
    const config = buildDosboxConf(game({
      dosboxArgs: [
        '-c', 'config -set dos xms=false',
        '-c', 'config -set dos ems=false',
      ],
    }))

    expect(config).toContain('[dos]\nxms=false\nems=false')
  })
})
