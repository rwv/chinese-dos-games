import type { GameInfo } from './types'

interface GamesResponse {
  count: number
  games: GameInfo[]
}

export async function fetchGames(): Promise<GamesResponse> {
  const res = await fetch('/api/games')
  if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`)
  return res.json()
}

export async function fetchGame(identifier: string): Promise<GameInfo> {
  const res = await fetch(`/api/games/${encodeURIComponent(identifier)}`)
  if (!res.ok) throw new Error(`Failed to fetch game: ${res.status}`)
  return res.json()
}

export async function searchGames(query: string): Promise<GamesResponse> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Failed to search games: ${res.status}`)
  return res.json()
}
