import { Refinement, or } from './predCombinators'
import { UnionToIntersection } from './types'

export type TypeName =
  | 'undefined'
  | 'object'
  | 'boolean'
  | 'number'
  | 'string'
  | 'symbol'
  | 'function'
  | 'bigint'

export type TypeFromName<
  T extends TypeName
> = T extends 'undefined' ? undefined     // prettier-ignore
  : T extends 'object'    ? object | null // prettier-ignore
  : T extends 'boolean'   ? boolean       // prettier-ignore
  : T extends 'number'    ? number        // prettier-ignore
  : T extends 'string'    ? string        // prettier-ignore
  : T extends 'symbol'    ? symbol        // prettier-ignore
  // tslint:disable-next-line: ban-types
  : T extends 'function'  ? Function      // prettier-ignore
  : T extends 'bigint'    ? bigint        // prettier-ignore
  : never // prettier-ignore

export const typeOf = <Ts extends [TypeName, ...TypeName[]]>(...types: Ts) => (
  v: any,
): v is TypeFromName<Ts[number]> => types.includes(typeof v)

type InstanceOfFn<Ts extends any[]> = ((
  x: unknown,
  conj: true,
) => x is UnionToIntersection<Ts[number]>) &
  ((x: any, conj?: boolean) => x is Ts[number])

/**
 * Function version of an `instanceof` check
 * @param constructors constructor functions to test against
 * @param x the value to test
 * @param conj should x be an instance of every constructor, or just some
 */
export const instanceOf = <Ts extends any[]>(
  ...constructors: { [t in keyof Ts]: new (...args: any) => Ts[t] }
): // eslint-disable-next-line @typescript-eslint/no-inferrable-types
InstanceOfFn<Ts> => (x: any, conj: boolean = false): x is Ts[number] =>
  conj
    ? constructors.every(c => x instanceof c)
    : constructors.some(c => x instanceof c)

type Ensure<O, K extends PropertyKey, KT = unknown> = O & Record<K, KT>

export function has<T, K extends PropertyKey>(o: T, k: K): o is Ensure<T, K>
export function has<T, K extends PropertyKey, TN extends TypeName>(
  o: T,
  k: K,
  type: TN,
): o is Ensure<T, K, TypeFromName<TN>>
export function has<T, K extends PropertyKey>(
  o: T,
  k: K,
  type?: TypeName,
): o is Ensure<T, K> {
  return (
    typeof o === 'object' &&
    o != null &&
    k in o &&
    (type ? typeof o[(k as unknown) as keyof T] === type : true)
  )
}

export function hasC<K extends PropertyKey>(
  k: K,
): <T>(o: T) => o is Ensure<T, K>
export function hasC<K extends PropertyKey, TN extends TypeName>(
  k: K,
  type: TN,
): <T>(o: T) => o is Ensure<T, K, TypeFromName<TN>>
export function hasC<T, K extends PropertyKey>(
  k: K,
  type?: TypeName,
): <T>(o: T) => o is Ensure<T, K> {
  return <T>(o: T): o is Ensure<T, K> => has(o, k, type as any)
}

type FalsyValues = null | undefined | false | 0 | ''

export const isTruthy = <T>(v: T): v is Exclude<T, FalsyValues> => !!v

export const isFalsy = <T>(v: T): v is Extract<T, FalsyValues> => !isTruthy(v)

export const isNull = (x: any): x is null => x === null

export type Primitive = TypeFromName<
  'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'undefined'
>
export const isPrimitive = typeOf(
  'string',
  'number',
  'boolean',
  'bigint',
  'symbol',
  'undefined',
)

export const isUndefined = typeOf('undefined')
export const isMaybeValue = or(typeOf('undefined'), isNull)

export const optional = <A, B extends A>(pred: Refinement<A, B>) =>
  or(isUndefined, pred)
export const nullable = <A, B extends A>(pred: Refinement<A, B>) =>
  or(isNull, pred)
export const maybeable = <A, B extends A>(pred: Refinement<A, B>) =>
  or(isMaybeValue, pred)

export const literal = <T extends string | number | boolean>(expected: T) => (
  x: any,
): x is T => x === expected
