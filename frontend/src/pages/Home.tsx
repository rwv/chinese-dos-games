import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchGames } from '../api'
import type { GameInfo } from '../types'
import GameCard from '../components/GameCard'

const NUMBER_TO_SHOW = 41

export default function Home() {
  const [games, setGames] = useState<GameInfo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGames()
      .then((data) => {
        const withCovers = data.games.filter((g) => g.coverFilename)
        setGames(withCovers.slice(0, NUMBER_TO_SHOW))
        setTotalCount(data.count)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">加载中…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-6">
        {games.map((game) => (
          <GameCard key={game.identifier} game={game} />
        ))}
        <div className="break-inside-avoid mb-4 rounded-lg border border-gray-200 p-6 text-center">
          <h3 className="font-medium text-gray-800">更多游戏</h3>
          <p className="mt-1 text-sm text-gray-500">目前共有 {totalCount} 款游戏</p>
          <Link to="/games" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            游戏列表 →
          </Link>
        </div>
      </div>
    </div>
  )
}
