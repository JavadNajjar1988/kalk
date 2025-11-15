import * as R from 'ramda'
import Signal from '@syncpoint/signal'

/**
 * select :: Signal S => [a -> Boolean] -> S a -> [S a]
 *
 * Split one input signal into multiply output signals based on predicates.
 * Each input value is either forwarded to one output signal or dropped if
 * no condition matches.
 */
export const select = R.curry((predicates: any[], signal: any) => {
  const outputs = predicates.map(() => Signal.of())
  signal.on((value: any) => {
    const match = (condition: any) => condition(value)
    outputs[predicates.findIndex(match)]?.(value)
  })
  return outputs
})

export const flat = (signal: any) => {
  const output = Signal.of()
  signal.on((v: any) => (Array.isArray(v) ? v : [v]).forEach(output))
  return output
}

/**
 * split :: Signal S => [a -> b] -> S a -> [S b]
 *
 * Split one input signal into multiple output signals based on mapping
 * functions. Input values are mapped and forwarded to the function's
 * respective output signal.
 */
export const split = R.curry((fns: any[], signal: any) => {
  const outputs = fns.map(() => Signal.of())
  signal.on((value: any) => fns.forEach((fn, i) => outputs[i](fn(value))))
  return outputs
})

/**
 * destructure :: Signal S => [String] -> S { k: v } -> [S Any]
 *
 * Split input object signal into ordered list of value signals
 * based on entry keys.
 */
export const destructure = R.curry((keys: string[], signal: any) => {
  const outputs = keys.map(() => Signal.of())
  signal.on((object: any) => keys.forEach((key, i) => outputs[i](object[key])))
  return outputs
})

export const once = (fn: any, signal: any) => {
  const dispose = signal.on((value: any) => {
    setImmediate(() => dispose())
    fn(value)
  })
}

export const circuitBreaker = (input: any) => {
  let last = 0
  let count = 0

  return input.map((x: any) => {
    if ((Date.now() - last) < 10) count++
    last = Date.now()

    if (count > 10) {
      console.warn('frequency too high', x)
      return undefined
    } else return x
  })
}

