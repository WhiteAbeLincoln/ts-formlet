import { Curry } from './internal/types'
import * as O from 'fp-ts/lib/Option'
import { Option } from 'fp-ts/lib/Option'
import * as E from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/es6/PathReporter'
import { Either } from 'fp-ts/lib/Either'
import {
  NonEmptyString,
  prismNonEmptyString,
} from 'newtype-ts/es6/NonEmptyString'
import { pipeline, pipe } from './internal/functional'
import { Eq } from 'fp-ts/lib/Eq'
import { Form1 } from './internal/form'
import { heteroMap } from './internal/util'
import { prismNonNegative } from 'newtype-ts/es6/NonNegative'
import { prismNonNegativeInteger } from 'newtype-ts/es6/NonNegativeInteger'
import { prismInteger } from 'newtype-ts/es6/Integer'
import { NumberFromString } from 'io-ts-types/es6/NumberFromString'
import { has } from './internal/predicates'
import { Semigroupoid2 } from 'fp-ts/lib/Semigroupoid'
import { Newtype, prism } from 'newtype-ts/es6'
import { Prism } from 'monocle-ts'
import { Functor2, Functor1 } from 'fp-ts/lib/Functor'
import { Alt1 } from 'fp-ts/lib/Alt'

// Validators
export const URI = 'Validator'
export type URI = typeof URI

export const ValidatedURI = 'Validated'
export type ValidatedURI = typeof ValidatedURI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    [URI]: Validator<E, A>
  }
  interface URItoKind<A> {
    [ValidatedURI]: Validated<A>
  }
}

export type Validator<I, A> = (input: I) => Either<string, A>
export type Validated<A> = {
  value: A
  modified: boolean
}

const pipeValidators = <A, B, C>(
  ab: Validator<A, B>,
  bc: Validator<B, C>,
): Validator<A, C> => pipe(ab, E.chain(bc))
export { pipeValidators as pipe }
export const compose = <E, A, B>(
  ab: Validator<A, B>,
  la: Validator<E, A>,
): Validator<E, B> => pipeValidators(la, ab)

export const map = <A, B>(fn: (a: A) => B) => <I>(
  v: Validator<I, A>,
): Validator<I, B> => pipe(v, E.map(fn))

export const validator: Semigroupoid2<URI> & Functor2<URI> = {
  URI,
  compose,
  map: (fa, f) => map(f)(fa),
}

/**
 * A validator that verifies that an optional field is given
 * @param name Field name
 */
export const nonOptional = <A>(): Validator<Option<A>, A> =>
  O.fold(() => E.left('is required'), E.right)

export const fromPrism = <A, B>(
  p: Prism<A, B>,
  errorText: string,
): Validator<A, B> =>
  pipe(
    p.getOption.bind(p),
    O.fold(() => E.left(errorText), E.right),
  )

// We are more restrictive since AWS's phone validation doesn't
// match their documentation, and I can't read the source to find
// out what it really accepts. The form (+# )###-###-#### is given
// in their examples and seems to work, so we restrict to only that
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Phone
  extends Newtype<{ readonly Phone: unique symbol }, string> {}
const phoneRegex = /^(\+\d+ )?\d{3,3}-\d{3,3}-\d{4,4}$/
const isPhone = (s: string) => phoneRegex.test(s)
export const prismPhone = prism<Phone>(isPhone)
export const validPhone = fromPrism(
  prismPhone,
  'must be a dash separated 10 digit phone number with optional country code in the form +# ###-###-####',
)

// we don't care about full rfc822 email validation, since AWS will do that for us
// we want a permissive check that is still close, checking for the @ sign with blocks of
// non-whitespace characters on either side

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Email
  extends Newtype<{ readonly Email: unique symbol }, string> {}
const emailRegex = /\S+@\S+/
const isEmail = (s: string) => emailRegex.test(s)
export const prismEmail = prism<Email>(isEmail)
export const validEmail = fromPrism(prismEmail, 'must be a valid email address')

// again, aws will validate on submit whether a string is a valid date
// if our validator was too permissive. this just helps the user before submit

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DateString
  extends Newtype<{ readonly Date: unique symbol }, string> {}
// checks that a string is a date parsable by Date.parse, without a time part
const isDateString = (s: string) => {
  if (Number.isNaN(Date.parse(s))) return false
  const date = new Date(s)
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}
export const prismDateString = prism<DateString>(isDateString)
export const validDate = pipeline(
  fromPrism(
    prismDateString,
    'must be a valid date in the form MM/DD/YYYY or YYYY-MM-DD',
  ),
)(
  // Recent browsers support input type = "date",
  // but existence of older versions means that we cant rely on the value
  // always being in format YYYY-MM-DD
  // AWS expects YYYY-MM-DD, so we map to convert.
  map(v => {
    // US browsers should all support MM/DD/YYYY in the date constructor
    const date = new Date(prismDateString.reverseGet(v))
    // since isDateString guarantees that hours minutes and seconds are all 0
    // we can be sure that replacing the time section T...Z will not lose informaiton
    return (date.toISOString().replace(/T.*Z$/, '') as unknown) as DateString
  }),
)

/**
 * A validator which verfies that a string isn't empty
 * @param name Field name
 */
export const nonEmpty = fromPrism(prismNonEmptyString, 'is required')

/** validates that a nonempty string can be parsed as a number */
export const validNumber1: Validator<NonEmptyString, number> = pipe(
  NumberFromString.decode.bind(NumberFromString) as (
    v: NonEmptyString,
  ) => Either<t.Errors, number>,
  E.mapLeft(e => PathReporter.report(E.left(e)).join(', ')),
)

/** validates that a string can be parsed as a number */
export const validNumber = pipeValidators(nonEmpty, validNumber1)

/** validates that a string can be parsed as an integer */
export const validInt = pipeValidators(
  validNumber,
  fromPrism(prismInteger, 'must be an integer'),
)

export const numNonNegative = fromPrism(prismNonNegative, 'must be positive')

/** validates that a string can be parsed as a non-negative number */
export const strNonNegative = pipeValidators(validNumber, numNonNegative)

export const naturalNumber = pipeValidators(
  validNumber,
  fromPrism(prismNonNegativeInteger, 'must be a non-negative integer'),
)

export const numMinimum = <T extends number | Newtype<any, number>>(
  min: number,
): Validator<T, T> => input =>
  input < min ? E.left(`must be greater than ${min}`) : E.right(input)

export const numMaximum = <T extends number | Newtype<any, number>>(
  max: number,
): Validator<T, T> => input =>
  input > max ? E.left(`must be less than ${max}`) : E.right(input)

export const numBetween = <T extends number | Newtype<any, number>>(
  min: number,
  max: number,
) => pipeValidators(numMinimum<T>(min), numMaximum<T>(max))

export const boundNumber = ({
  min,
  max,
}: { min?: number; max?: number } = {}) => <
  T extends number | Newtype<any, number>
>(
  ab: Validator<string, T>,
) => {
  const bc =
    typeof min !== 'undefined' && typeof max !== 'undefined'
      ? numBetween<T>(min, max)
      : typeof min !== 'undefined'
      ? numMinimum<T>(min)
      : typeof max !== 'undefined'
      ? numMaximum<T>(max)
      : undefined
  return bc ? pipeValidators(ab, bc) : ab
}

export const addLabel = (name: string) => <I, A>(
  v: Validator<I, A>,
): Validator<I, A> =>
  pipe(
    v,
    E.mapLeft(e => name + ' ' + e),
  )

/**
 * A validator which verfies that inputs are equal
 */
export const mustEqual = <A>(
  EQ: Eq<A>,
): Curry<[A, string], Validator<A, A>> => val1 => err => val2 =>
  EQ.equals(val1, val2) ? E.right(val1) : E.left(err)

/**
 * Allows a validator to accept empty strings in addition to anything
 * it already accepts. The empty string is mapped to None, and valid
 * input is mapped to Some
 * @param v a validator
 */
export const optional = <A>(
  v: Validator<string, A>,
): Validator<string, Option<A>> => i =>
  i === '' ? E.either.of(O.none) : E.either.map(v(i), O.some)

/**
 * Allows a validator to accept empty strings in addition to anything
 * it already accepts. The empty string is mapped to the provided default,
 *  and valid input is left as is
 * @param v a validator
 */
export const optionalDefault = <A>(def: A) => (
  v: Validator<string, A>,
): Validator<string, A> => i => (i === '' ? E.either.of(def) : v(i))

export const Modified = <I>(value: I): Validated<I> => ({
  value,
  modified: true,
})
export const Fresh = <I>(value: I): Validated<I> => ({
  value,
  modified: false,
})
const get = <I>(validated: Validated<I>) => validated.value

// const modify = (message?: string) => (forest: Forest): Forest =>
//   pipeline(forest)(
//     foldRight(
//       () => [],
//       (init, last) =>
//         foldTree(
//           c => snoc(init, c) as Forest,
//           w =>
//             snoc(
//               init,
//               Wrapper({ ...w, children: modify(message)(w.children) }),
//             ),
//           n => snoc(init, Node({ ...n, validationError: message })),
//         )(last),
//     ),
//   )

/**
 * Attach a validation function to a Form, producing a new Form
 * that takes a Validated as the state and displays an error if the
 * form data is invalid
 *
 * Validation errors are only displayed if the field is modified
 * @param runValidator
 */
export const validate = <A, B>(runValidator: Validator<A, B>) => <I, UI, C>(
  editor: Form1<UI, I, A, C>,
): Form1<UI, Validated<I>, B, C> => v => {
  const value = v.value
  const { edit, validate: result, children } = editor(value)

  const res = O.option.chain(
    result,
    pipe(
      runValidator,
      v.modified
        ? O.some // don't suppress error if modified
        : E.fold(
            () => O.none as Option<Either<string, B>>,
            val => O.some(E.either.of(val)),
          ), // suppress error
    ),
  )

  const err = O.toUndefined(O.option.chain(res, pipe(E.swap, O.fromEither)))

  return {
    edit: ({ onChange }) =>
      edit({ onChange: f => onChange(v => Modified(f(v.value))), error: err }),
    validate: O.option.chain(res, O.fromEither),
    children,
  }
}

export const validatedAlt = <T>(fx: Validated<T>) => (fy: Validated<T>) =>
  !fx.modified ? fy : fx
export const validated: Alt1<ValidatedURI> & Functor1<ValidatedURI> = {
  URI: ValidatedURI,
  map: (fa, f) => ({ ...fa, value: f(fa.value) }),
  alt: (fx, fy) => (!fx.modified ? fy() : fx),
}

export const isValidated = (v: any): v is Validated<any> =>
  has(v, 'value') && has(v, 'modified', 'boolean')

const modifyValidated = heteroMap(isValidated) as <I>(
  fn: (val: Validated<I>) => Validated<I>,
) => <A>(value: A) => A

export const setModified = modifyValidated(pipe(get, Modified))
