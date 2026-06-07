import { env } from './env/server'

export const shouldLog = env.LOG_VERBOSE === true

export function logDev(...args: unknown[]) {
  if (shouldLog) {
    console.log(...args)
  }
}
