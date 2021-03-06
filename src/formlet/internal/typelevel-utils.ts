import { Equal } from './types'

// from AnyhowStep: https://github.com/Microsoft/TypeScript/issues/26382
export type Subtract<T extends number, U extends number> = {
  [index: number]: number
  0: T
  1: {
    [index: number]: number
    0: number
    1: 0
    2: 1
    3: 2
    4: 3
    5: 4
    6: 5
    7: 6
    8: 7
    9: 8
    10: 9
    11: 10
    12: 11
    13: 12
    14: 13
    15: 14
    16: 15
    17: 16
    18: 17
    19: 18
    20: 19
    21: 20
    22: 21
    23: 22
    24: 23
    25: 24
  }[T]
  2: Subtract<Subtract<T, 1>, 1>
  3: Subtract<Subtract<T, 2>, 1>
  4: Subtract<Subtract<T, 3>, 1>
  5: Subtract<Subtract<T, 4>, 1>
  6: Subtract<Subtract<T, 5>, 1>
  7: Subtract<Subtract<T, 6>, 1>
  8: Subtract<Subtract<T, 7>, 1>
  9: Subtract<Subtract<T, 8>, 1>
  10: Subtract<Subtract<T, 9>, 1>
  11: Subtract<Subtract<T, 10>, 1>
  12: Subtract<Subtract<T, 11>, 1>
  13: Subtract<Subtract<T, 12>, 1>
  14: Subtract<Subtract<T, 13>, 1>
  15: Subtract<Subtract<T, 14>, 1>
  16: Subtract<Subtract<T, 15>, 1>
  17: Subtract<Subtract<T, 16>, 1>
  18: Subtract<Subtract<T, 17>, 1>
  19: Subtract<Subtract<T, 18>, 1>
  20: Subtract<Subtract<T, 19>, 1>
  21: Subtract<Subtract<T, 20>, 1>
  22: Subtract<Subtract<T, 21>, 1>
  23: Subtract<Subtract<T, 22>, 1>
  24: Subtract<Subtract<T, 23>, 1>
  25: Subtract<Subtract<T, 24>, 1>
}[U]

export type Add<T extends number, U extends number> = {
  [index: number]: number
  0: T
  1: {
    [index: number]: number
    0: 1
    1: 2
    2: 3
    3: 4
    4: 5
    5: 6
    6: 7
    7: 8
    8: 9
    9: 10
    10: 11
    11: 12
    12: 13
    13: 14
    14: 15
    15: 16
    16: 17
    17: 18
    18: 19
    19: 20
    20: 21
    21: 22
    22: 23
    23: 24
    24: number
  }[T]
  2: Add<Add<T, 1>, 1>
  3: Add<Add<T, 2>, 1>
  4: Add<Add<T, 3>, 1>
  5: Add<Add<T, 4>, 1>
  6: Add<Add<T, 5>, 1>
  7: Add<Add<T, 6>, 1>
  8: Add<Add<T, 7>, 1>
  9: Add<Add<T, 8>, 1>
  10: Add<Add<T, 9>, 1>
  11: Add<Add<T, 10>, 1>
  12: Add<Add<T, 11>, 1>
  13: Add<Add<T, 12>, 1>
  14: Add<Add<T, 13>, 1>
  15: Add<Add<T, 14>, 1>
  16: Add<Add<T, 15>, 1>
  17: Add<Add<T, 16>, 1>
  18: Add<Add<T, 17>, 1>
  19: Add<Add<T, 18>, 1>
  20: Add<Add<T, 19>, 1>
  21: Add<Add<T, 20>, 1>
  22: Add<Add<T, 21>, 1>
  23: Add<Add<T, 22>, 1>
  24: Add<Add<T, 23>, 1>
}[U]

export type GtEq<
  X extends number,
  Y extends number,
  True = '1',
  False = '0'
> = number extends X
  ? True | False
  : number extends Y
  ? True | False
  : number extends Subtract<X, Y> // Subtracted too much
  ? False
  : True

export type Gt<
  X extends number,
  Y extends number,
  True = '1',
  False = '0'
> = Equal<X, Y> extends '1' ? False : GtEq<X, Y, True, False>
