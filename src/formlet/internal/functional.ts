// tslint:disable: ban-types
import {
  Fn,
  Curry,
  AllPaths,
  Path,
  Path_,
  FollowPath,
  UnionToIntersection,
  FollowPath_,
  ObjectLeaves,
  RetType,
  Params,
} from './types'
import { Endomorphism } from 'fp-ts/lib/function'
import { Option, isSome, isNone, none, some } from 'fp-ts/lib/Option'
import { Indices } from './tuple'
import { Refinement, or, andT } from './predCombinators'
import { isPrimitive, hasC } from './predicates'
import { Subtract, Add } from './typelevel-utils'

export const tuple = <As extends any[]>(...els: As) => els
export const fst = <Ts extends [any, ...any[]]>([v]: Ts) => v as Ts[1]
export const snd = <Ts extends [any, any, ...any[]]>([, v]: Ts) => v as Ts[0]
export const property = <T, K extends keyof T>(k: K) => (o: T) => o[k]

// Combinators
/** the I combinator, identity */
export const I = <A>(a: A) => a
/** the K combinator, const */
export const K = <A>(a: A) => () => a
// types won't work if we use I instead unless we use a
// type assertion at the call site because typescript
// does not have a proper unification algorithm
// instead we special-case the type here
/** the A combinator, apply (a special case of I) */
export const A: <A, B>(f: Fn<[A], B>) => Fn<[A], B> = I
/** the T combinator, thrush */
export const T = <A>(a: A) => <B>(fn: Fn<[A], B>) => fn(a)
/** the W combinator */
export const W = <A, B>(f: Curry<[A, A], B>) => (x: A) => f(x)(x)
/** the C combinator, flip */
export const C = <A, B, C>(f: Curry<[A, B], C>) => (b: B) => (a: A) => f(a)(b)
/** the B combinator, function composition */
export const B = <B, C>(f: Fn<[B], C>) => <A>(g: Fn<[A], B>) => (x: A) =>
  f(g(x))
export const S = <A, B, C>(f: Curry<[A, B], C>) => (g: Fn<[A], B>) => (x: A) =>
  f(x)(g(x))
export const P = <B, C>(f: Curry<[B, B], C>) => <A>(g: Fn<[A], B>) => (
  x: A,
) => (y: A) => f(g(x))(g(y))

export const applyMany = <Args extends any[], Fs extends Fn<Args, any>[]>(
  ...fns: Fs
) => (
  ...args: Args
): {
  [k in keyof Fs]: Fs[k] extends (...args: any) => any
    ? ReturnType<Fs[k]>
    : never
} => fns.map(f => f(...args)) as any

export { I as id, A as apply }

export { K as constant }

export type ComposeFn2 = <As extends any[], B, C>(
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, C>
export type ComposeFn3 = <As extends any[], B, C, D>(
  cd: Fn<[C], D>,
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, D>
export type ComposeFn4 = <As extends any[], B, C, D, E>(
  de: Fn<[D], E>,
  cd: Fn<[C], D>,
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, E>
export type ComposeFn5 = <As extends any[], B, C, D, E, F>(
  ef: Fn<[E], F>,
  de: Fn<[D], E>,
  cd: Fn<[C], D>,
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, F>
export type ComposeFn6 = <As extends any[], B, C, D, E, F, G>(
  fg: Fn<[F], G>,
  ef: Fn<[E], F>,
  de: Fn<[D], E>,
  cd: Fn<[C], D>,
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, G>
export type ComposeFn7 = <As extends any[], B, C, D, E, F, G, H>(
  gh: Fn<[G], H>,
  fg: Fn<[F], G>,
  ef: Fn<[E], F>,
  de: Fn<[D], E>,
  cd: Fn<[C], D>,
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, H>
export type ComposeFn8 = <As extends any[], B, C, D, E, F, G, H, I>(
  hi: Fn<[H], I>,
  gh: Fn<[G], H>,
  fg: Fn<[F], G>,
  ef: Fn<[E], F>,
  de: Fn<[D], E>,
  cd: Fn<[C], D>,
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, I>
export type ComposeFn9 = <As extends any[], B, C, D, E, F, G, H, I, J>(
  ij: Fn<[I], J>,
  hi: Fn<[H], I>,
  gh: Fn<[G], H>,
  fg: Fn<[F], G>,
  ef: Fn<[E], F>,
  de: Fn<[D], E>,
  cd: Fn<[C], D>,
  bc: Fn<[B], C>,
  ab: Fn<As, B>,
) => Fn<As, J>
export type ComposeFn = ComposeFn2 &
  ComposeFn3 &
  ComposeFn4 &
  ComposeFn5 &
  ComposeFn6 &
  ComposeFn7 &
  ComposeFn8 &
  ComposeFn9

export const compose: ComposeFn = (
  ...fns: [Function, Function, ...Function[]]
) => {
  const len = fns.length - 1
  return function (this: any) {
    // eslint-disable-next-line prefer-rest-params
    let y: any = arguments
    for (let i = len; i > -1; i--) {
      y = [fns[i].apply(this, y)]
    }
    return y[0]
  }
}

export type PipeFn1 = <As extends any[], B>(ab: Fn<As, B>) => Fn<As, B>
export type PipeFn2 = <As extends any[], B, C>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
) => Fn<As, C>
export type PipeFn3 = <As extends any[], B, C, D>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
) => Fn<As, D>
export type PipeFn4 = <As extends any[], B, C, D, E>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
) => Fn<As, E>
export type PipeFn5 = <As extends any[], B, C, D, E, F>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
) => Fn<As, F>
export type PipeFn6 = <As extends any[], B, C, D, E, F, G>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
) => Fn<As, G>
export type PipeFn7 = <As extends any[], B, C, D, E, F, G, H>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
  gh: Fn<[G], H>,
) => Fn<As, H>
export type PipeFn8 = <As extends any[], B, C, D, E, F, G, H, I>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
  gh: Fn<[G], H>,
  hi: Fn<[H], I>,
) => Fn<As, I>
export type PipeFn9 = <As extends any[], B, C, D, E, F, G, H, I, J>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
  gh: Fn<[G], H>,
  hi: Fn<[H], I>,
  ij: Fn<[I], J>,
) => Fn<As, J>
export type PipeFnUntyped = <As extends unknown[]>(
  ...fns: [(...args: As) => unknown, ...Array<(arg: unknown) => unknown>]
) => (...args: As) => unknown
export type PipeFn = PipeFn1 &
  PipeFn2 &
  PipeFn3 &
  PipeFn4 &
  PipeFn5 &
  PipeFn6 &
  PipeFn7 &
  PipeFn8 &
  PipeFn9 &
  PipeFnUntyped

export const pipe: PipeFn = (...fns: [Function, ...Function[]]) => {
  const len = fns.length - 1
  return function (this: any) {
    // eslint-disable-next-line prefer-rest-params
    let y: any = arguments
    for (let i = 0; i <= len; i++) {
      y = [fns[i].apply(this, y)]
    }
    return y[0]
  }
}

/** both multivariate-parameterized */
export type FlipC_MpMp = <R>(
  fn: <As extends any[]>(...as: As) => <Bs extends any[]>(...bs: Bs) => R,
) => <Bs extends any[]>(...bs: Bs) => <As extends any[]>(...as: As) => R

/** first multivariate-parameterized, second same */
export type FlipC_MpS = <R>(
  fn: <As extends any[]>(...as: As) => (...bs: As) => R,
) => <As extends any[]>(...bs: As) => (...as: As) => R

/** first multivariate-parameterized, second concrete */
export type FlipC_MpC = <Fixed extends any[], R>(
  fn: <As extends any[]>(...as: As) => (...bs: Fixed) => R,
) => (...bs: Fixed) => <As extends any[]>(...as: As) => R

/** first concrete, second multivariate-parameterized */
export type FlipC_CMp = <Fixed extends any[], R>(
  fn: (...as: Fixed) => <Bs extends any[]>(...bs: Bs) => R,
) => <Bs extends any[]>(...bs: Bs) => (...as: Fixed) => R

/** both concrete */
export type FlipC_CC = <Fixed1 extends any[], Fixed2 extends any[], R>(
  fn: (...as: Fixed1) => (...bs: Fixed2) => R,
) => (...bs: Fixed2) => (...as: Fixed1) => R

/** both parameterized */
export type FlipC_PP = <R>(
  fn: <A>(a: A) => <B>(b: B) => R,
) => <B>(b: B) => <A>(a: A) => R

/** first parameterized, second same */
export type FlipC_PS = <R>(
  fn: <A>(a: A) => (b: A) => R,
) => <A>(b: A) => (a: A) => R

/** first parameterized, second concrete */
export type FlipC_PC = <Fixed, R>(
  fn: <A>(a: A) => (b: Fixed) => R,
) => (b: Fixed) => <A>(a: A) => R

/** first concrete, second parameterized */
export type FlipC_CP = <Fixed, R>(
  fn: (a: Fixed) => <B>(b: B) => R,
) => <B>(b: B) => (a: Fixed) => R

export type FlipCMultivariate = FlipC_MpMp &
  FlipC_MpS &
  FlipC_MpC &
  FlipC_CMp &
  FlipC_CC
export type FlipCUnary = FlipC_PP & FlipC_PS & FlipC_PC & FlipC_CP & FlipC_CC
/**
 * Type of a function that flips functions in the form `A -> B -> R` to `B -> A -> R`
 *
 * Handles most parameterized unary functions,
 * and parameterized multivariate functions,
 * however some information is lost for multivariate functions (returned function takes ...any[]),
 * and higher kinded types do not work at all
 *
 * E.g this function will not handle these cases:
 * 1. A function taking an array of A (higher kinded type):
 *  ```ts
 *    type Fn = <A>(x: A[]) => (y: number) => boolean
 *  ```
 * 2. A function taking a parameterized function (higher kinded type)
 *  ```ts
 *    type Fn = (x: string[]) => <B>(fn: (x: string) => B) => B
 *  ```
 * 3. A multivariate type that does not extend any[] (we need variadic kinds for this to work)
 * ```ts
 *    type Fn = <As extends [string, ...string[]]>(...as: As) => (b: number) => boolean
 * ```
 */
export type FlipC = (FlipC_MpMp & FlipC_PP) &
  (FlipC_MpS & FlipC_PS) &
  (FlipC_MpC & FlipC_PC) &
  (FlipC_CMp & FlipC_CP) &
  FlipC_CC

/**
 * A function that converts functions from the form `A -> B -> R` to `B -> A -> R`
 *
 * Handles most parameterized unary functions,
 * and parameterized multivariate functions,
 * however some information is lost for multivariate functions (returned function takes ...any[]),
 * and higher kinded types do not work at all
 *
 * E.g this function will not handle these cases:
 * 1. A function taking an array of A (higher kinded type):
 *  ```ts
 *    type Fn = <A>(x: A[]) => (y: number) => boolean
 *  ```
 * 2. A function taking a parameterized function (higher kinded type)
 *  ```ts
 *    type Fn = (x: string[]) => <B>(fn: (x: string) => B) => B
 *  ```
 * 3. A multivariate type that does not extend any[] (we need variadic kinds for this to work)
 * ```ts
 *    type Fn = <As extends [string, ...string[]]>(...as: As) => (b: number) => boolean
 * ```
 */
export const flipC: FlipC = <F1 extends any[], F2 extends any[], R>(
  fn: (...as: F1) => (...bs: F2) => R,
) => (...bs: F2) => (...as: F1) => fn(...as)(...bs)

// // Tests for the flipC function. Verify
// // that the inferred return type matches the comment
// /** both concrete */
// declare function fn1(a: number): (b: string) => boolean
// /** first parameterized, second concrete */
// declare function fn2<A>(a: A): (b: string) => boolean
// /** first concrete, second parameterized */
// declare function fn3(a: number): <B>(b: B) => boolean
// /** first parameterized, second same */
// declare function fn4<A>(a: A): (b: A) => boolean
// /** both parameterized */
// declare function fn5<A>(a: A): <B>(b: B) => boolean
// flipC(fn1) // Returns: string -> number -> boolean
// flipC(fn2) // Returns: string -> A -> boolean
// flipC(fn3) // Returns: B -> number -> boolean
// flipC(fn4) // Returns: A -> A -> boolean
// flipC(fn5) // Returns: B -> A -> boolean

// /** both concrete */
// declare function fn6(...a: number[]): (...b: string[]) => boolean
// /** first multivariate-parameterized, second concrete */
// declare function fn7<As extends any[]>(...a: As): (...b: string[]) => boolean
// /** first concrete, second multivariate-parameterized */
// declare function fn8(...a: string[]): <Bs extends any[]>(...b: Bs) => boolean
// /** first concrete, second same */
// declare function fn9<As extends any[]>(...a: As): (...b: As) => boolean
// /** both multivariate-parameterized */
// declare function fn10<As extends any[]>(
//   ...as: As
// ): <Bs extends any[]>(...bs: Bs) => boolean
// flipC(fn6) // Returns: ...string[] -> ...number[] -> boolean
// flipC(fn7) // Returns: ...string[] -> ...As -> boolean
// flipC(fn8) // Returns: ...Bs -> ...string[] -> boolean
// flipC(fn9) // Returns: ...As -> ...As -> boolean
// flipC(fn10) // Returns: ...Bs -> ...As -> boolean

export function flip<R>(fn: <A, B>(a: A, b: B) => R): <A, B>(b: B, a: A) => R
export function flip<R>(fn: <A>(a: A, b: A) => R): <A>(b: A, a: A) => R
export function flip<Fixed, R>(
  fn: <A>(a: A, b: Fixed) => R,
): <A>(b: Fixed, a: A) => R
export function flip<Fixed, R>(
  fn: <B>(a: Fixed, b: B) => R,
): <B>(b: B, a: Fixed) => R
export function flip<Fixed1, Fixed2, R>(
  fn: Fn<[Fixed1, Fixed2], R>,
): Fn<[Fixed2, Fixed1], R>
export function flip<A, B, C>(fn: Fn<[A, B], C>): (b: B, a: A) => C {
  return (b, a) => fn(a, b)
}
/*
  Tests for the flip function
declare function fn1<A>(a: A, b: A): boolean
declare function fn2<A>(a: A, b: number): boolean
declare function fn3<A>(a: number, b: A): boolean
declare function fn4<A, B>(a: A, b: B): boolean
declare function fn5(a: string, b: number): boolean
flip(fn1)
flip(fn2)
flip(fn3)
flip(fn4)
flip(fn5)
*/

export type PipeA1<As extends any[]> = <B>(ab: Fn<As, B>) => B
export type PipeA2<As extends any[]> = <B, C>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
) => C
export type PipeA3<As extends any[]> = <B, C, D>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
) => D
export type PipeA4<As extends any[]> = <B, C, D, E>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
) => E
export type PipeA5<As extends any[]> = <B, C, D, E, F>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
) => F
export type PipeA6<As extends any[]> = <B, C, D, E, F, G>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
) => G
export type PipeA7<As extends any[]> = <B, C, D, E, F, G, H>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
  gh: Fn<[G], H>,
) => H
export type PipeA8<As extends any[]> = <B, C, D, E, F, G, H, I>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
  gh: Fn<[G], H>,
  hi: Fn<[H], I>,
) => I
export type PipeA9<As extends any[]> = <B, C, D, E, F, G, H, I, J>(
  ab: Fn<As, B>,
  bc: Fn<[B], C>,
  cd: Fn<[C], D>,
  de: Fn<[D], E>,
  ef: Fn<[E], F>,
  fg: Fn<[F], G>,
  gh: Fn<[G], H>,
  hi: Fn<[H], I>,
  ij: Fn<[I], J>,
) => J
export type PipeAUntyped<As extends unknown[]> = (
  ...fns: [(...args: As) => unknown, ...Array<(arg: unknown) => unknown>]
) => any

export type PipeApplied<As extends any[]> = PipeA1<As> &
  PipeA2<As> &
  PipeA3<As> &
  PipeA4<As> &
  PipeA5<As> &
  PipeA6<As> &
  PipeA7<As> &
  PipeA8<As> &
  PipeA9<As> &
  PipeAUntyped<As>

export const pipeline: <As extends any[]>(
  ...args: As
) => PipeApplied<As> = flipC(pipe) as PipeApplied<any>

export const curry = <As extends any[], R>(fn: Fn<As, R>): Curry<As, R> => {
  // the wrapper single argument functions ensure
  // that we only accept a single argument at a time
  // a strict curry instead of the multivariate one that is typical
  // to javascript
  function curried(this: any, ...t: any[]): any {
    return t.length >= fn.length
      ? (fn as Function).call(this, ...t)
      : (arg: any) => curried.bind(this, ...t)(arg)
  }

  return (arg: any) => curried(arg)
}

/**
 * Given a bijection between types A <-> B, maps a function f : A[] -> A,
 * to a function g : B[] -> B
 * @param to map from A -> B
 * @param from map from B -> A
 */
export const mapCategory = <A, B>(to: Fn<[A], B>, from: Fn<[B], A>) => <
  Args extends A[]
>(
  fn: Fn<Args, A>,
): Fn<{ [k in keyof Args]: B }, B> => (...bs) =>
  to(fn(...(bs.map(from) as Args)))

/** Maps over endomorphisms */
export const endoImap: <A, B>(
  to: Fn<[A], B>,
  from: Fn<[B], A>,
) => (fn: Endomorphism<A>) => Endomorphism<B> = mapCategory

export const toVariadic = <Xs extends readonly any[], R>(fn: (xs: Xs) => R) => (
  ...xs: Xs
) => fn(xs)
export const fromVariadic = <Xs extends readonly any[], R>(
  fn: (...args: Xs) => R,
) => (args: Xs) => fn(...args)

interface PathFn<T> {
  <
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4]
  >(
    p: [K1, K2, K3, K4, K5],
  ): (v: Path_<T, [K1, K2, K3, K4, K5]>) => T[K1][K2][K3][K4][K5]
  <
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3]
  >(
    p: [K1, K2, K3, K4],
  ): (v: Path_<T, [K1, K2, K3, K4]>) => T[K1][K2][K3][K4]
  <K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2]>(
    p: [K1, K2, K3],
  ): (v: Path_<T, [K1, K2, K3]>) => T[K1][K2][K3]
  <K1 extends keyof T, K2 extends keyof T[K1]>(p: [K1, K2]): (
    v: Path_<T, [K1, K2]>,
  ) => T[K1][K2]
  <K1 extends keyof T>(p: [K1]): (v: Path_<T, [K1]>) => T[K1]
  <P extends AllPaths<T>>(p: P): (v: Path<T, P>) => FollowPath<T, P>
}

export const mkPaths = <T = never>() => <Ps extends Array<AllPaths<T>>>(
  ...ps: Ps
) => (
  v: UnionToIntersection<
    { [k in keyof Ps]: Ps[k] extends any[] ? Path_<T, Ps[k]> : never }[Indices<
      Ps
    >]
  >,
): { [k in keyof Ps]: Ps[k] extends any[] ? FollowPath_<T, Ps[k]> : never } =>
  ps.map(
    (p: (keyof any)[]) => p.reduce((acc: any, key) => acc[key], v) as any,
  ) as any

export const mkPath = <T = never>(): PathFn<T> =>
  (<P extends AllPaths<T>>(p: P) => (v: Path<T, P>): FollowPath<T, P> =>
    (p as (keyof any)[]).reduce((acc: any, key) => acc[key], v) as any) as any

type RemoveOptionalLeaves<T, Leaves = ObjectLeaves | any[]> = {
  [k in keyof T]: [T[k]] extends [Option<infer A>]
    ? A
    : T[k] extends ObjectLeaves
    ? T[k]
    : RemoveOptionalLeaves<T[k], Leaves>
}

interface LeafDict<Leaves = ObjectLeaves | any[]> {
  [k: string]: LeafDict<Leaves> | Leaves
}

const isOption = andT(
  hasC('_tag', 'string'),
  (x: { _tag: string }): x is Option<any> =>
    isSome(x as any) || isNone(x as any),
)

export const sequenceOptDict = <
  O extends LeafDict<L>,
  L = ObjectLeaves | any[]
>(
  o: O,
  isLeaf: Refinement<unknown, L> = or(
    isPrimitive,
    Array.isArray.bind(Array),
  ) as any,
): Option<RemoveOptionalLeaves<O, L>> => {
  const newObj: RemoveOptionalLeaves<O, L> = {} as any

  for (const key in o) {
    if (Object.prototype.hasOwnProperty.call(o, key)) {
      const v = o[key]
      if (isOption(v)) {
        if (isNone(v)) return none
        newObj[key] = v.value
      } else if (isLeaf(v)) {
        newObj[key] = v as any
      } else {
        const r = sequenceOptDict(v as any, isLeaf)
        if (isNone(r)) return none
        newObj[key] = r.value as any
      }
    }
  }

  return some(newObj)
}

/**
 * basically pipe + W combinator, composes two functions, the second returning another function and calls
 * both with the parameter that satisfies both
 */
export const callSequence = <A, B, C, D>(
  fn1: (arg: A) => B,
  fn2: (arg: B) => (arg: C) => D,
) => W<A & C, D>(pipe(fn1, fn2))

export const decr = <N extends number>(n: N): Subtract<N, 1> => n - 1
export const incr = <N extends number>(n: N): Add<N, 1> => n + 1

type AnyFn = (data: any) => any
export const arr_collect = <
  Fns extends AnyFn[],
  DataTuple extends any[] = { [k in keyof Fns]: Params<Fns[k]>[0] }
>(
  ...fns: Fns
) => (data: UnionToIntersection<DataTuple[Indices<DataTuple>]>) =>
  (fns.map(f => f(data) as unknown) as unknown) as {
    [k in keyof Fns]: RetType<Fns[k]>
  }
