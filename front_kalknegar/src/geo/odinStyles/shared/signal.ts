import Signal from '@syncpoint/signal'

export const destructure = (keys: string[]) => (signal: any) => {
  return keys.map(key => signal.map((value: any) => value[key]))
}

