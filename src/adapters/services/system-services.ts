import type { Clock } from '@application/ports/services/clock'
import type { IdGenerator } from '@application/ports/services/id-generator'

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

export class CryptoIdGenerator implements IdGenerator {
  uuid(): string {
    return crypto.randomUUID()
  }
}
