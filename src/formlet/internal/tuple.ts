import { Equal, If, Assert } from './types'
import { Subtract, Add } from './typelevel-utils'

// many of these taken from https://github.com/ksxnodemodules/typescript-tuple

export type Prepend<Tuple extends any[], Added> = ((
  _: Added,
  ..._1: Tuple
) => any) extends (..._: infer Result) => any
  ? Result
  : never

export type Repeat<
  Type,
  Count extends number,
  Holder extends any[] = []
> = Count extends never
  ? never
  : number extends Count
  ? Type[]
  : {
      fit: Holder
      unfit: Repeat<Type, Count, Prepend<Holder, Type>>
      union: Count extends Holder['length'] | infer Rest
        ? Rest extends number
          ? Repeat<Type, Holder['length']> | Repeat<Type, Rest>
          : never
        : never
    }[Holder['length'] extends Count // It is possible for Count to be a union
      ? Count extends Holder['length'] // Make sure that Count is not a union
        ? 'fit'
        : 'union'
      : 'unfit']

export type ArrayKeys = keyof any[]
export type Indices<T> = Exclude<keyof T, ArrayKeys>
export type Idx<Arr, I extends number> = Arr extends any[] ? Arr[I] : never

export type IsEmpty<T, Empty, NonEmpty> = If<Equal<T, []>, Empty, NonEmpty>
export type IsFinite<Tuple extends any[], Finite, Infinite> = {
  empty: Finite
  nonEmpty: ((..._: Tuple) => any) extends (
    _: infer First,
    ..._1: infer Rest
  ) => any
    ? IsFinite<Rest, Finite, Infinite>
    : never
  infinite: Infinite
}[Tuple extends []
  ? 'empty'
  : Tuple extends (infer Element)[]
  ? Element[] extends Tuple
    ? 'infinite'
    : 'nonEmpty'
  : never]

export type Reverse<Tuple extends any[], Prefix extends any[] = []> = {
  empty: Prefix
  nonEmpty: ((..._: Tuple) => any) extends (
    _: infer First,
    ..._1: infer Next
  ) => any
    ? Reverse<Next, Prepend<Prefix, First>>
    : never
  infinite: []
  // infinite: {
  //   ERROR: 'Cannot reverse an infinite tuple'
  //   CODENAME: 'InfiniteTuple'
  // }
}[Tuple extends [any, ...any[]]
  ? IsFinite<Tuple, 'nonEmpty', 'infinite'>
  : 'empty']

/**
 * Add an element to the end of a tuple
 * @example Append<[0, 1, 2], 'new'> → [0, 1, 2, 'new']
 */
export type Append<Tuple extends any[], Addend> = Reverse<
  Prepend<Reverse<Tuple>, Addend>
>

export type Head<T extends any[], Default = never> = T extends [any, ...any[]]
  ? T[0]
  : Default
export type Tail<T extends any[]> = ((...args: T) => any) extends (
  _: any,
  ..._1: infer Rest
) => any
  ? Rest
  : []

export type Concat<Left extends any[], Right extends any[]> = {
  emptyLeft: Right
  singleLeft: Left extends [infer SoleElement]
    ? Prepend<Right, SoleElement>
    : never
  multiLeft: ((..._: Reverse<Left>) => any) extends (
    _: infer LeftLast,
    ..._1: infer ReversedLeftRest
  ) => any
    ? Concat<Reverse<ReversedLeftRest>, Prepend<Right, LeftLast>>
    : never
  infiniteLeft: []
}[Left extends []
  ? 'emptyLeft'
  : Left extends [any]
  ? 'singleLeft'
  : IsFinite<Left, 'multiLeft', 'infiniteLeft'>]

export type ConcatMultiple<TupleSet extends any[][]> = {
  empty: []
  nonEmpty: ((..._: Reverse<TupleSet>) => any) extends (
    _: infer Last,
    ..._1: infer ReversedRest
  ) => any
    ? Last extends any[]
      ? ReversedRest extends any[][]
        ? Concat<ConcatMultiple<Reverse<ReversedRest>>, Last>
        : never
      : never
    : never
  infinite: []
}[TupleSet extends [] ? 'empty' : IsFinite<TupleSet, 'nonEmpty', 'infinite'>]

export type SliceStartQuantity<
  Tuple extends any[],
  Start extends number,
  Quantity extends number,
  Holder extends any[] = [],
  Count extends any[] = []
> = {
  before: SliceStartQuantity<
    Tail<Tuple>,
    Start,
    Quantity,
    Holder,
    Prepend<Count, Count['length']>
  >
  start: ((...args: Tuple) => any) extends (
    _: infer First,
    ..._1: infer Rest
  ) => any
    ? SliceStartQuantity<Rest, Start, Quantity, Prepend<Holder, First>, Count>
    : never
  end: Reverse<Holder>
}[Tuple extends []
  ? 'end'
  : Quantity extends Holder['length']
  ? 'end'
  : Start extends Count['length']
  ? 'start'
  : 'before']

export type Decompose<Idx extends number, Arr extends any[]> = [
  SliceStartQuantity<Arr, 0, Idx>,
  Arr[Idx],
  SliceStartQuantity<Arr, Add<Idx, 1>, Subtract<Arr['length'], Idx>>,
]

export type SetExisting<Arr extends any[], Idx extends keyof Arr, T> = {
  [k in keyof Arr]: k extends Idx ? T : Arr[k]
}

// not exported since we don't need the value, just the type
const emptySigil = Symbol()

/** Used in place of `never`, but provides manual control of when the type collapses (using MapEmptySigilTo) */
export type EmptySigil = typeof emptySigil
export type MapEmptySigil<Cont, T = never> = Cont extends EmptySigil
  ? T
  : {
      [k in keyof Cont]: Cont[k] extends EmptySigil
        ? T
        : Exclude<Cont[k], EmptySigil>
    }

export type PrependN<N extends number, Acc extends any[], T = EmptySigil> = {
  finished: Acc
  'append one': PrependN<Subtract<N, 1>, Prepend<Acc, T>, T>
}[N extends 0 ? 'finished' : number extends N ? 'finished' : 'append one']

export type FilterTuple<Tuple extends any[], Mask> = ConcatMultiple<
  {
    [K in keyof Tuple]: Tuple[K] extends Mask ? [Tuple[K]] : []
  }
>

export type FilterTuple1<Tuple extends any[], Mask> = ConcatMultiple<
  {
    [K in keyof Tuple]: Tuple[K] extends Mask ? [] : [Tuple[K]]
  }
>

export type LastIdx<T extends any[]> = Subtract<T['length'], 1>

type Pop_<T extends [any, ...any[]], R = Reverse<T>> = [
  Head<Assert<R, any[]>>,
  Reverse<Tail<Assert<R, any[]>>>,
]

export type Pop<T extends any[]> = If<
  Equal<T, []>,
  never,
  Pop_<Assert<T, [any, ...any[]]>>
>
