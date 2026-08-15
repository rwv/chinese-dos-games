import { Link } from 'react-router-dom'
import type { GameInfo } from '../types'

interface Props {
  game: GameInfo
}

export default function GameCard({ game }: Props) {
  if (!game.coverFilename) return null

  return (
    <Link
      to={`/games/${encodeURIComponent(game.identifier)}`}
      className="block break-inside-avoid mb-4 rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <img
        src={`/files/img/${encodeURIComponent(game.identifier)}/${game.coverFilename}`}
        alt={game.name['zh-Hans']}
        loading="lazy"
        className="w-full"
      />
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 truncate">{game.name['zh-Hans']}</h3>
      </div>
    </Link>
  )
}
