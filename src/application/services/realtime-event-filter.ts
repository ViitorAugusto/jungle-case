import type { RealtimeEvent } from '@domain/entities/realtime-event'

const MAX_REMEMBERED_EVENTS = 500

/**
 * Descarta eventos já vistos (mesmo `eventId`) e eventos com versão igual ou
 * menor que a última aplicada ao mesmo recurso. Uma instância por sessão.
 */
export class RealtimeEventFilter {
  private readonly seen = new Set<string>()
  private readonly versions = new Map<string, number>()

  accept(event: RealtimeEvent): boolean {
    if (this.seen.has(event.eventId)) return false
    this.remember(event.eventId)

    const key = `${event.resource.type}:${event.resource.id}`
    const applied = this.versions.get(key)
    if (applied !== undefined && event.version <= applied) return false
    this.versions.set(key, event.version)
    return true
  }

  private remember(eventId: string): void {
    this.seen.add(eventId)
    if (this.seen.size <= MAX_REMEMBERED_EVENTS) return
    const oldest = this.seen.values().next().value
    if (oldest !== undefined) this.seen.delete(oldest)
  }
}
