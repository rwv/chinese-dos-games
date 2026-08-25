export interface GameName {
  'zh-Hans': string
  'zh-Hant'?: string
  en?: string
}

export interface GameInfo {
  identifier: string
  name: GameName
  releaseYear?: number
  executable: string
  keymaps?: Record<string, string>
  cheats?: Record<string, string>
  links?: Record<string, string>
  coverFilename?: string
  sha256: string
  filesize?: number
  cdrom?: boolean
  cdromPath?: string
  floppy?: 'a' | 'b'
  cdImage?: string
  cdImages?: string[]
  bootImage?: string
  dosboxArgs?: string[]
  type?: string
  img?: string
}

export interface GamesResponse {
  count: number
  games: GameInfo[]
}
