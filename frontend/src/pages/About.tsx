export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-900">中文 DOS 游戏 🎮</h2>

      <h3 className="mt-6 text-lg font-semibold text-gray-800">项目地址</h3>
      <p className="mt-1">
        <a
          href="https://github.com/rwv/chinese-dos-games"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          https://github.com/rwv/chinese-dos-games
        </a>
      </p>

      <h3 className="mt-6 text-lg font-semibold text-gray-800">感谢</h3>
      <ul className="mt-1 list-disc pl-6 text-gray-700">
        <li>
          <a href="https://github.com/dreamlayers/em-dosbox" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            dreamlayers/em-dosbox: An Emscripten port of DOSBox
          </a>
        </li>
        <li>
          <a href="https://github.com/db48x/emularity" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            db48x/emularity: easily embed emulators
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg font-semibold text-gray-800">许可</h3>
      <p className="mt-1">
        <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          The GNU General Public License v3.0
        </a>
      </p>
    </div>
  )
}
