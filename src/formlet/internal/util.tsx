import React, { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes, forwardRef } from 'react'
import { Refinement } from './predCombinators'
import { If, Matches, Or, MakePartial, ObjectEntries } from './types'
import { has, isTruthy } from './predicates'

/** freestanding Object.entries */
export const entries: <T>(o: T) => ObjectEntries<T> = Object.entries.bind(
  Object,
)
export const keys: <T>(o: T) => Array<keyof T> = Object.keys.bind(Object)

export const mapObject1 = <T, B>(
  obj: T,
  fn: (v: T[keyof T], k: keyof T) => B,
): { [k in keyof T]: B } =>
  keys(obj).reduce(
    (o, key) => ((o[key] = fn(obj[key], key)), o),
    {} as {
      [k in keyof T]: B
    },
  )

export const isPlainObject = (o: unknown): o is { [key in keyof any]: any } => {
  if (o == null || typeof o !== 'object') return false
  const proto = Object.getPrototypeOf(o)
  return proto === Object.prototype || proto === null
}

/**
 * Result of a heterogenous mapping of `T` with function `In -> Out`
 */
export type Mapped<T, In, Out> = If<
  Matches<T, In>,
  Out,
  If<
    Or<Matches<T, any[]>, Matches<T, object>>,
    { [k in keyof T]: Mapped<T[k], In, Out> },
    T
  >
>

export const heteroMap = <TA,>(pred: Refinement<any, TA> | (() => boolean)) => <
  TB,
>(
  fn: (ta: TA) => TB,
) => {
  return function _inner<A>(value: A): Mapped<A, TA, TB> {
    if (pred(value)) return fn(value) as any
    if (Array.isArray(value)) return value.map(_inner) as any
    if (isPlainObject(value)) return mapObject1(value, _inner) as any
    return value
  }
}

export const deepMerge = <
  T extends Record<PropertyKey, any> | null | undefined,
  U extends Record<PropertyKey, any> | null | undefined
>(
  obj1: T,
  obj2: U,
): If<Matches<T, null | undefined>, {}, T> &
  If<Matches<U, null | undefined>, {}, U> =>
  entries(obj2 ?? ({} as U)).reduce(
    (acc, [k, v]) => {
      if (has(acc, k) && isPlainObject(acc[k]) && isPlainObject(v)) {
        // if both objects have the same key and they are both objects, merge subobjs
        acc[k] = deepMerge(acc[k], v) as any
      } else {
        // if both objects have the same key and they are of different types,
        // the second takes priority
        // if the first object doesn't have the same key, just add a new key and value
        acc[k] = v as any
      }
      return acc
    },
    { ...obj1 } as T & U,
  ) as any

export const clsx = (
  ...classes: Array<string | null | undefined | false>
): string => classes.filter(isTruthy).join(' ')

export function partial<
  E extends keyof JSX.IntrinsicElements,
  K extends keyof JSX.IntrinsicElements[E]
>(
  Comp: E,
  pprops: Pick<JSX.IntrinsicElements[E], K>,
): ForwardRefExoticComponent<
  PropsWithoutRef<MakePartial<JSX.IntrinsicElements[E], K>> &
    Pick<JSX.IntrinsicElements[E], 'ref'>
>
export function partial<P, K extends keyof P>(
  Comp: React.ComponentType<P>,
  pprops: Pick<P, K>,
): ForwardRefExoticComponent<
  PropsWithoutRef<MakePartial<P, K>> & RefAttributes<unknown>
>
export function partial<P, K extends keyof P>(
  Comp: React.ComponentType<P>,
  pprops: Pick<P, K>,
) {
  const className = has(pprops, 'className', 'string')
    ? pprops.className
    : undefined

  return forwardRef((props: MakePartial<P, K>, ref) => {
    const allProps = deepMerge(pprops, props) as P
    if (className && has(allProps, 'className', 'string')) {
      allProps.className = clsx(className, allProps.className)
    }
    return <Comp ref={ref} {...allProps} />
  })
}
