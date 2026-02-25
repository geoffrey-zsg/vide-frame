import type { Session } from './types'

const SESSIONS_KEY = 'vibeframe_sessions'
const CURRENT_SESSION_KEY = 'vibeframe_current_session_id'
const MAX_SESSIONS = 50

/** 加载所有会话列表，按 updatedAt 降序排列 */
export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const sessions: Session[] = JSON.parse(raw)
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/** 保存或更新一个会话，超出上限时淘汰最旧的 */
export function saveSession(session: Session): void {
  try {
    const sessions = loadSessions()
    const idx = sessions.findIndex((s) => s.id === session.id)
    if (idx >= 0) {
      sessions[idx] = session
    } else {
      sessions.unshift(session)
    }
    // 淘汰最旧的会话
    const trimmed = sessions
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage 写入失败，静默忽略
  }
}

/** 删除指定会话 */
export function deleteSession(id: string): void {
  try {
    const sessions = loadSessions().filter((s) => s.id !== id)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    // 静默忽略
  }
}

/** 获取当前活跃会话 ID */
export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY)
  } catch {
    return null
  }
}

/** 设置当前活跃会话 ID */
export function setCurrentSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CURRENT_SESSION_KEY, id)
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY)
    }
  } catch {
    // 静默忽略
  }
}

/** 从第一条用户消息截取会话标题 */
export function generateSessionTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim()
  if (trimmed.length <= 30) return trimmed
  return trimmed.slice(0, 30) + '...'
}

/** 计算相对时间描述 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  return `${months} 个月前`
}
