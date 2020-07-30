import * as V from './validation'
import { pipe as pipefn } from './internal/functional'
import { pipe } from 'fp-ts/lib/pipeable'
import { NonEmptyString } from 'newtype-ts/es6/NonEmptyString'
import { Newtype, Concat, iso } from 'newtype-ts/es6'
import { Form1 } from './internal/form'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface USD extends Newtype<{ readonly USD: unique symbol }, number> {}
export const isoUSD = iso<USD>()

/** converts a form yielding a number to a yielding USD */
export function inUSD<UI, V, T extends number, C>(
  form: Form1<UI, V, T, C>,
): Form1<UI, V, USD, C>
export function inUSD<UI, V, T extends Newtype<any, number>, C>(
  form: Form1<UI, V, T, C>,
): Form1<UI, V, Concat<USD, T>, C>
export function inUSD<UI, V, T extends number | Newtype<any, number>, C>(
  form: Form1<UI, V, T, C>,
): Form1<UI, V, USD | T, C> {
  return form
}

/**
 * validates that a string is nonempty and adds a label
 * @param l the label
 */
export const nonEmptyL = (l: string) => pipe(V.nonEmpty, V.addLabel(l))

// AWS complains on empty string inputs, which is idiotic
// the empty string is a perfectly reasonable value in a database
// and should have separate meaning from null
/**
 * ensures a string is not the empty string, providing
 * null as the alternative
 * @param l the label
 */
export const nonEmptyStr = pipefn(
  nonEmptyL,
  V.optionalDefault(null as null | NonEmptyString),
)

/**
 * Verifies that an optional field is given
 * @param l the label
 */
export const nonOptionalL = <T,>(l: string) =>
  pipe(V.nonOptional<T>(), V.addLabel(l))
