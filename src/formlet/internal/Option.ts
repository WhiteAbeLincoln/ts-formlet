import { some, none } from 'fp-ts/lib/Option'

/**
 * Creates an option out of an array,
 * using the first element of the array as the Some value
 */
export const fromArray = <T>(xs: T[]) => (xs.length === 0 ? none : some(xs[0]))
