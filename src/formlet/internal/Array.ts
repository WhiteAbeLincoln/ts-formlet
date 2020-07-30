import { snoc, empty, of } from 'fp-ts/lib/Array'
import { Option, fold as foldO } from 'fp-ts/lib/Option'
import { Semiring } from 'fp-ts/lib/Semiring'
import { fold } from 'fp-ts/lib/Monoid'
import { Ring } from 'fp-ts/lib/Ring'
import { Field } from 'fp-ts/lib/Field'

/** appends an element to the end of an array, creating a new array */
export const append = <T>(x: T) => (xs: T[]) => snoc(xs, x)

export const fromOption = foldO(() => empty, of) as <T>(x: Option<T>) => T[]

export const sum = <T>(M: Semiring<T>) => fold({ empty: M.zero, concat: M.add })
export const product = <T>(M: Semiring<T>) =>
  fold({ empty: M.one, concat: M.mul })
export const difference = <T>(M: Ring<T>) => (xs: T[]) =>
  xs.length === 1 ? M.sub(M.zero, xs[0]) : xs.reduce(M.sub)
export const succDiv = <T>(M: Field<T>) => (xs: T[]) =>
  xs.length === 1 ? M.div(M.one, xs[0]) : xs.reduce(M.div)
