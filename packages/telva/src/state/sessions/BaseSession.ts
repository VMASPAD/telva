import type { TLPerformanceMode } from 'telva-core'
import type { TelvaApp } from '~state/TelvaApp'
import type { SessionType, TelvaCommand, TelvaPatch } from '~types'

export abstract class BaseSession {
  abstract type: SessionType
  abstract performanceMode: TLPerformanceMode | undefined
  constructor(public app: TelvaApp) {}
  abstract start: () => TelvaPatch | undefined
  abstract update: () => TelvaPatch | undefined
  abstract complete: () => TelvaPatch | TelvaCommand | undefined
  abstract cancel: () => TelvaPatch | undefined
}
