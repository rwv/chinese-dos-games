import { Link, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="text-2xl">🎮</Link>
        <div className="flex gap-4">
          <Link to="/" className="text-gray-700 hover:text-gray-900">首页</Link>
          <Link to="/games" className="text-gray-700 hover:text-gray-900">游戏列表</Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900">关于</Link>
        </div>
        <form onSubmit={handleSearch} className="ml-auto flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="游戏名称"
            className="rounded border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
            搜索
          </button>
        </form>
      </div>
    </nav>
  )
}
