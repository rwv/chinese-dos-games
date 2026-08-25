import { useState, type FormEvent, type ReactNode } from 'react'

interface QA {
  q: string
  a: ReactNode
}

const FAQ_ITEMS: QA[] = [
  {
    q: '如何开始游戏？',
    a: (
      <>
        在 <a href="/games" className="text-blue-600 hover:underline">游戏列表</a> 选个游戏点封面即可开始。
        首次加载会下载 ZIP 包（可能几十 MB）；之后浏览器会缓存到 IndexedDB，刷新秒开。
      </>
    ),
  },
  {
    q: '游戏存档保存在哪里？',
    a: (
      <>
        Emularity 引擎把存档写到浏览器 <code className="rounded bg-gray-100 px-1 font-mono text-xs">IndexedDB</code> 里
        （<code className="rounded bg-gray-100 px-1 font-mono text-xs">emularity</code> 库），
        路径 <code className="rounded bg-gray-100 px-1 font-mono text-xs">emulator/[游戏名]/</code>。
        切换到 js-dos 引擎则存在 <code className="rounded bg-gray-100 px-1 font-mono text-xs">js-dos/[游戏名]/</code>。
        两个引擎的存档互不通用。如需迁移，请用 DevTools → Application → IndexedDB 导出 JSON。
      </>
    ),
  },
  {
    q: '支持 Windows 系统吗？',
    a: (
      <>
        仅 x86 (32-bit) 浏览器支持，因为 DOS 游戏是 16/32 位实模式或保护模式程序，
        需要 WebAssembly 模拟器 + SharedArrayBuffer（要 COOP/COEP 安全头，Chrome/Firefox/Edge 新版都满足）。
        Mac Apple Silicon Safari 16+ / Chrome / Firefox 也支持；移动端浏览器支持有限。
      </>
    ),
  },
  {
    q: '游戏运行卡顿怎么办？',
    a: (
      <>
        按 <kbd className="rounded bg-gray-100 px-1 font-mono text-xs">Ctrl+F11</kbd> 减速，
        <kbd className="rounded bg-gray-100 px-1 font-mono text-xs">Ctrl+F12</kbd> 加速。
        部分游戏内置 dosboxArgs 已固定 cycles 值。
        浏览器后台标签会降低线程优先级，切到前台即可。
      </>
    ),
  },
  {
    q: '游戏没声音？',
    a: (
      <>
        浏览器需要用户先点击页面才能播放音频（autoplay policy）。
        点击游戏区域后声音就会出来。部分游戏的 MIDI 通过 dosbox <code className="rounded bg-gray-100 px-1 font-mono text-xs">mididevice=default</code> 输出。
      </>
    ),
  },
  {
    q: '游戏需要 CD 怎么办？',
    a: (
      <>
        大多数 CD 版游戏 zip 内已嵌入 CD 镜像（<code className="rounded bg-gray-100 px-1 font-mono text-xs">.iso</code>），
        网页端会自动挂载。多盘游戏（侠客英雄传3 / 炎龙骑士团外传 等）已同时挂多张，
        用 <kbd className="rounded bg-gray-100 px-1 font-mono text-xs">Ctrl+F4</kbd> 换盘。
        若提示"Insert CD" / "Please insert right CD"，
        通常是游戏自带 CD 硬校验超出 dosbox 模拟能力，请参考具体游戏页面的"备注"。
      </>
    ),
  },
  {
    q: '游戏问密码 / 防拷怎么办？',
    a: (
      <>
        部分游戏（铁路A计划、悲恋湖、小惠的性知识 等）启动时问手册上的密码。
        请参考原版纸质手册（电子版可在“我的电脑管理文件”相关游戏贴吧搜索）。
        若游戏页有"作弊"区块显示密码，直接使用即可。
      </>
    ),
  },
  {
    q: '可以下载游戏本地玩吗？',
    a: (
      <>
        可以。点 <a href="/games" className="text-blue-600 hover:underline">游戏列表</a> 找到游戏，
        ZIP 包在 <code className="rounded bg-gray-100 px-1 font-mono text-xs">/files/bin/[游戏名].zip</code>。
        用 <a href="https://www.dosbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DOSBox</a> 加载即可。
      </>
    ),
  },
  {
    q: '为什么有 js-dos 和 emularity 两个引擎？',
    a: (
      <>
        Emularity（em-dosbox）兼容性好但存档用 IndexedDB 单一目录。
        js-dos 8.4.1 启动更快、IndexedDB 分区可按游戏管理，部分游戏存档更稳定。
        一般推荐 js-dos，遇到问题再切 emularity。
      </>
    ),
  },
  {
    q: '游戏 ZIP 下载或解压失败？',
    a: (
      <>
        GitHub Releases 分卷下载时若 <code className="rounded bg-gray-100 px-1 font-mono text-xs">download_data.py</code> 报
        "解压错误"，一般是 CDN 跨区网络问题，参考 <a href="https://github.com/rwv/chinese-dos-games" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">README</a> 设置代理。
        已知 4 个上游截断的 ZIP（永远的雷曼 / 征服：AD1086 / 指环王 / 指挥官基恩1）无法修复，需等上游更新。
      </>
    ),
  },
  {
    q: '游戏启动后白屏 / 崩溃？',
    a: (
      <>
        部分游戏需要先按任意键跳过 UniVBE 模式分析（轩辕圣战录等）。
        凯兰蒂亚传奇2 需要先跑 SETUP.EXE 生成 HOF.CFG 配置。
        完全卡死请尝试切换到另一种引擎。
      </>
    ),
  },
]

export default function FAQ() {
  const [filter, setFilter] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
  }

  const lower = filter.trim().toLowerCase()
  const filtered = lower
    ? FAQ_ITEMS.filter((item) => item.q.toLowerCase().includes(lower))
    : FAQ_ITEMS

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-900">常见问题</h2>
      <p className="mt-2 text-sm text-gray-600">
        找不到答案？去 <a href="https://github.com/rwv/chinese-dos-games/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Issues</a> 提问。
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="搜索问题…"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </form>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">没有匹配的问题。</p>
      ) : (
        <dl className="mt-6 space-y-4">
          {filtered.map((item, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4">
              <dt className="font-semibold text-gray-800">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-gray-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
