import { Pop, Idx, Prepend, Reverse, Tail } from './tuple'
import { Add, Gt } from './typelevel-utils'
import { Option } from 'fp-ts/lib/Option'

export type SB = '1' | '0'
export type If<P extends SB, T, F> = P extends '1' ? T : F
export type Not<B extends SB> = B extends '1' ? '0' : '1'
export type And<A extends SB, B extends SB> = A extends '1'
  ? B extends '1'
    ? '1'
    : '0'
  : '0'
export type Or<A extends SB, B extends SB> = A extends '1'
  ? '1'
  : B extends '1'
  ? '1'
  : '0'
export type Matches<V, T> = [V] extends [T] ? '1' : '0'
export type Equal<A, B> = And<Matches<A, B>, Matches<B, A>>
export type IsNullable<T> = Not<Equal<Exclude<T, null | undefined>, T>>
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type MakePartial<P, K extends keyof P> = Omit<P, K> & { [k in K]?: P[k] }
export type The<T, V extends T> = V
export type Assert<T, V> = T extends V ? T : never
export type RetType<F> = F extends (...args: any) => infer R ? R : never
export type Params<F> = F extends (...args: infer P) => any ? P : never
export type VerifyMatch<V extends T, T> = T

/**
 * The keys of an object `O` whose value types exactly equal equal the given type `T`
 *
 * @example
 * ```ts
 * KeysOfType<{ x: string, y: number | string }, string | number> -> 'y'
 * ```
 */
export type KeysOfType<O, T> = {
  [k in keyof O]-?: If<Equal<O[k], T>, k, never>
}[keyof O]

/**
 * The keys of an object `O` whose value types match ('>=') the given type `T`
 *
 * @example
 * ```ts
 * KeysOfType2<{ x: string, y: number, z: string | number | boolean }, string | number> -> 'z'
 * KeysOfType2<{ x: string, y: number, z: boolean }, string | number> -> never
 * ```
 */
export type KeysOfType2<O, T> = {
  [k in keyof O]-?: If<Matches<T, O[k]>, k, never>
}[keyof O]

/**
 * The keys of an object `O` whose value types match ('<=') the given type `T`
 *
 * @example
 * ```ts
 * KeysOfType1<{ x: string, y: number, z: string | number | boolean }, string | number> -> 'x' | 'y'
 * KeysOfType1<{ x: string, y: number, z: boolean }, string | number> -> 'x' | 'y'
 * ```
 */
export type KeysOfType1<O, T> = {
  [k in keyof O]-?: If<Matches<O[k], T>, k, never>
}[keyof O]

export type OptionalKeys<T> = KeysOfType2<T, undefined>
export type NullKeys<T> = KeysOfType2<T, null>
export type MaybeKeys<T> = OptionalKeys<T> | NullKeys<T>

export type DeepRequired<T> = NonNullable<
  T extends any[]
    ? DeepRequiredArray<T[number]>
    : T extends object
    ? DeepRequiredObject<T>
    : T
>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DeepRequiredArray<T> extends Array<DeepRequired<T>> {}
type DeepRequiredObject<T> = { [P in keyof T]-?: DeepRequired<T[P]> }

export type DeepMaybe<T> = If<
  Or<Matches<T, any[]>, Matches<T, object>>,
  { [k in keyof T]?: DeepMaybe<T[k]> } | null | undefined,
  T | null | undefined
>

/** The type of a multivariate function */
export type Fn<As extends any[], R> = (...args: As) => R
/** The type of a curried function */
export type Curry<As extends any[], R> = {
  empty: R
  pop: Popped<As, R>
}[As extends [] ? 'empty' : 'pop']
type Popped<Args extends any[], Ret, V = Pop<Args>> = Curry<
  Idx<V, 1>,
  (a: Idx<V, 0>) => Ret
>

/** Discriminates a tagged union given tag key and value */
export type DiscriminateUnion<
  Union,
  TagKey extends keyof Union,
  TagValue extends Union[TagKey]
> = Union extends Record<TagKey, TagValue> ? Union : never

export type PromiseValue<T> = [T] extends [Promise<infer V>] ? V : never
export type ArrayValue<T extends readonly any[]> = T[number]
export type HKTValues<T> = T extends {
  _S: infer S
  _R: infer R
  _E: infer E
  _A: infer A
}
  ? [A, E, R, S]
  : T extends { _R: infer R; _E: infer E; _A: infer A }
  ? [A, E, R]
  : T extends { _E: infer E; _A: infer A }
  ? [A, E]
  : T extends { _A: infer A }
  ? [A]
  : []
export type OptionValue<T> = [T] extends [Option<infer V>] ? V : never
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

export type ObjectEntries<T, A = Required<T>> = Array<
  { [k in keyof A]-?: [k, A[k]] }[keyof A]
>

export type OmitNever<O> = Pick<
  O,
  { [k in keyof O]: O[k] extends never ? never : k }[keyof O]
>

export type RequireKeys<O, K extends keyof O> = O &
  { [k in K]-?: NonNullable<O[k]> }

export type ReplaceTypeOnce<T, Match, R> = T extends Match ? R : T
export type ReplaceType<T, Match, RT> = T extends object
  ? {
      [k in keyof T]: ReplaceType<T[k], Match, RT>
    }
  : ReplaceTypeOnce<T, Match, RT>

export type ReplaceNull<T, RT = never> = ReplaceType<T, null, RT>

export type ReplaceKeyPair<T, K, Match, RT, k = never> = T extends object
  ? {
      [k in keyof T]: ReplaceKeyPair<T[k], K, Match, RT, k>
    }
  : k extends K
  ? ReplaceTypeOnce<T, Match, RT>
  : T

/**
 * Interface declaring types that should be treated
 * as leaves (not indexable) in a key-value dictionary object
 *
 * Merge the interface declaration to add more types
 */
export interface LeafTypes {
  number: number
  string: string
  boolean: boolean
  null: null
  undefined: undefined
  bigint: bigint
  symbol: symbol
}
export type ObjectLeaves = LeafTypes[keyof LeafTypes]

export type NonLeafKeys<O> = {
  [k in keyof O]-?: If<Matches<O[k], ObjectLeaves>, never, k>
}[keyof O]

/**
 * All paths of an key-value dictionary object
 *
 * To treat some value types as leaves instead of
 * nested objects, add to the `LeafTypes` interface,
 * or pass the `Leaves` type parameter
 */
export type AllPaths<
  T,
  Term extends number = 10,
  K extends keyof T = keyof T,
  Path extends (keyof any)[] = [],
  Count extends number = 0,
  Leaves = ObjectLeaves
> = {
  [k in K]: T[k] extends Leaves
    ? Reverse<Prepend<Path, k>>
    : Equal<Term, Count> extends '1'
    ? Reverse<Prepend<Path, k>>
    :
        | Reverse<Prepend<Path, k>>
        | AllPaths<
            T[k],
            Term,
            keyof T[k],
            Prepend<Path, k>,
            Add<Count, 1>,
            Leaves
          >
}[K]

export type Path_<T, P extends (keyof any)[]> = UnionToIntersection<
  P extends [keyof T]
    ? { [k in P[0]]: T[k] }
    : P extends [keyof T, ...any[]]
    ? { [k in P[0]]: Path_<T[k], Tail<P>> }
    : never
>

/**
 * converts a tuple of unions to a union of tuples
 *
 * Can be considered the cartesian product of the unions in the tuple
 *
 * Example:
 * ```typescript
 * DeUnionTuple<['a' | 'b', 'd' | 'e', 'f']> -> ['a','d','f'] | ['a','e','f'] | ['b','d','f'] | ['b','e','f']
 * ```
 */
export type DeUnionTuple<T extends any[]> = T extends [any]
  ? { [k in T[0]]: [k] }[T[0]]
  : T extends [any, ...any[]]
  ? { [k in T[0]]: DeUnionHelper<DeUnionTuple<Tail<T>>, k> }[T[0]]
  : []

type DeUnionHelper<Tp, K> = Tp extends any[] ? Prepend<Tp, K> : never

/**
 * Like Pick, constructs an object from paths
 */
export type Path<T, K extends AllPaths<T>> = Path_<T, K>
export type FollowPath_<T, P extends (keyof any)[]> = P extends [keyof T]
  ? { [k in P[0]]: T[k] }[P[0]]
  : P extends [keyof T, ...any[]]
  ? { [k in P[0]]: FollowPath_<T[k], Tail<P>> }[P[0]]
  : never
export type FollowPath<T, K extends AllPaths<T>> = FollowPath_<T, K>

export type Range<L extends number, H extends number> = {
  end: never
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  incr: L | Range<Add<L, 1>, H>
}[Gt<L, H> extends '1' ? 'end' : 'incr']
