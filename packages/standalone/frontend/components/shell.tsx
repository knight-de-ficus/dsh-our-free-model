import { Activity, Boxes, Cable, ChevronRight, Handshake, LayoutDashboard, LogOut, Moon, Network, Settings2, Sun } from 'lucide-react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from './ui'
import type { Host, Page, Summary } from '../types'

const navigation = [
  { label: '工作空间', items: [
    { id: 'overview', name: '概览', icon: LayoutDashboard },
    { id: 'models', name: '模型清单', icon: Boxes },
    { id: 'usage', name: '用量统计', icon: Activity },
  ] },
  { label: '渠道与连接', items: [
    { id: 'channels', name: '免费账号渠道', icon: Network },
    { id: 'eac', name: 'EAC 协付渠道', icon: Handshake },
    { id: 'connection', name: 'API 接入', icon: Cable },
  ] },
  { label: '管理', items: [{ id: 'settings', name: '服务设置', icon: Settings2 }] },
] as const

type Origin = { x: number; y: number }

function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  const apply = (next: 'light' | 'dark') => {
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('ofm-theme', next) } catch { /* 存储不可用时仅本次会话生效 */ }
    setTheme(next)
  }
  const toggle = (origin?: Origin) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    // 没有 View Transition、或用户要求减少动效时直接切换，不做扩散。
    if (!origin || typeof document.startViewTransition !== 'function'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(next); return }
    const root = document.documentElement
    // 半径取按钮中心到视口最远角的距离，保证圆盘一定盖满整屏。
    const radius = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y))
    root.style.setProperty('--theme-reveal-x', `${origin.x}px`)
    root.style.setProperty('--theme-reveal-y', `${origin.y}px`)
    root.style.setProperty('--theme-reveal-r', `${radius}px`)
    // 扩散期间关掉 300ms 的底色过渡，否则"新主题"快照会抓到过渡中间色。
    root.classList.add('theme-transitioning')
    const transition = document.startViewTransition(() => { flushSync(() => apply(next)) })
    const finish = () => {
      root.classList.remove('theme-transitioning')
      root.style.removeProperty('--theme-reveal-x')
      root.style.removeProperty('--theme-reveal-y')
      root.style.removeProperty('--theme-reveal-r')
    }
    transition.finished.then(finish, finish)
  }
  return { theme, toggle }
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'
  return <Button variant="ghost" className="theme-toggle" aria-label={label} title={theme === 'dark' ? '浅色' : '深色'}
    onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }) }}>
    <span className="theme-toggle-track" data-theme={theme}>
      <span className="theme-toggle-icon theme-toggle-sun" aria-hidden="true"><Sun size={16} /></span>
      <span className="theme-toggle-icon theme-toggle-moon" aria-hidden="true"><Moon size={16} /></span>
    </span>
  </Button>
}

export const pageNames: Record<Page, string> = {
  overview: '概览', models: '模型清单', usage: '用量统计', channels: '免费账号渠道',
  eac: 'EAC 协付渠道', settings: '服务设置', connection: 'API 接入',
}

export function Sidebar({ page, summary, host }: { page: Page; summary?: Summary; host: Host }) {
  return <div className="ag-topnav">
    <a className="console-brand" href="/" aria-label="AG 首页"><span className="ag-monogram" aria-hidden="true">AG</span><span>AG<small>本地模型工作台</small></span></a>
    <nav className="ag-nav" aria-label="管理导航">{navigation.map(group => group.items.map(item =>
      <button key={item.id} className={`ag-nav-item ${page === item.id ? 'selected' : ''}`}
        aria-current={page === item.id ? 'page' : undefined} onClick={() => host.navigate(item.id)}>
        <item.icon size={18} strokeWidth={1.7} /><span>{item.name}</span>
        {item.id === 'models' && <span className="count-badge">{summary?.catalog.length ?? '—'}</span>}
      </button>))}</nav>
    <div className="ag-actions"><ThemeToggle /><Button variant="ghost" aria-label="退出管理" title="退出管理" onClick={() => { void host.logout().catch(host.error) }}><LogOut size={16} /></Button></div>
  </div>
}
export function Topbar({ page, summary }: { page: Page; summary?: Summary }) {
  return <><div className="console-breadcrumb"><span>工作空间</span><ChevronRight size={14} /><strong key={page} className="console-breadcrumb-current">{pageNames[page]}</strong></div>
    <div className="console-topbar-status"><span className="status-dot" /><span>{summary?.settings.enabled === false ? '推理已暂停' : '本地服务'}</span><span className="topbar-divider" /><span>LOCAL</span></div></>
}
