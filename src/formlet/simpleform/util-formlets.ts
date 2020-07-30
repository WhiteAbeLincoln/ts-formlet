import { pipe } from 'fp-ts/lib/pipeable'
import { id } from '../internal/functional'
import { fieldNumber } from 'fp-ts/lib/Field'
import * as F from './form'
import * as V from '../validation'
import { NonNegative } from 'newtype-ts/es6/NonNegative'
import { nonEmptyL, inUSD } from '../util-formlets'
import { NonNegativeInteger } from 'newtype-ts/es6/NonNegativeInteger'

export * from '../util-formlets'

/**
 * Sets the required prop to true
 */
export const required = F.setProps({ required: true })

/**
 * A required form that accepts non-empty strings
 * @param label the form label
 */
export const nonEmptyReq = (label: string) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({ label, required: true }),
    F.validateLeaf(nonEmptyL(label)),
  )

export const number = (
  label: string,
  bounds: { min?: number; max?: number; def?: number } = {},
) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({
      label,
      inputMode: 'decimal',
      required: bounds.def == null,
    }),
    F.validateLeaf(
      pipe(
        V.validNumber,
        bounds.def != null ? V.optionalDefault(bounds.def) : id,
        V.boundNumber(bounds),
        V.addLabel(label),
      ),
    ),
  )

export const rateD = (div: (x: number, y: number) => number) => (
  label: string,
  bounds: { min?: number; max?: number; whole_amt?: number; def?: number } = {},
) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({
      label,
      inputMode: 'decimal',
      required: bounds.def == null,
    }),
    F.validateLeaf(
      pipe(
        V.validNumber,
        bounds.def != null ? V.optionalDefault(bounds.def) : id,
        V.boundNumber(bounds),
        V.map(n => div(n, bounds.whole_amt ?? 100)),
        V.addLabel(label),
      ),
    ),
  )

export const rate = rateD(fieldNumber.div)

/**
 * A form that accepts non-negative numbers
 * @param label the form label
 */
export const nonNegNum = (label: string, def?: NonNegative) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({
      label,
      // type="number" breaks react-number-format
      // inputMode lets us pop up numeric keyboards in recent
      // mobile browsers anyway. though not as semantically correct
      inputMode: 'decimal',
      required: def == null,
    }),
    F.validateLeaf(
      pipe(
        V.strNonNegative,
        def != null ? V.optionalDefault(def) : id,
        V.addLabel(label),
      ),
    ),
  )

/**
 * An optional form that accepts non-negative numbers
 *
 * The default value is 0
 *
 * @param label the form label
 * @param def set the default value
 */
export const optNonNegNum = (
  label: string,
  def: NonNegative = (0 as unknown) as NonNegative,
) => nonNegNum(label, def)

export const optDollars = (label: string) => inUSD(optNonNegNum(label))
export const dollars = (label: string) => inUSD(nonNegNum(label))

/**
 * A form that accepts natural numbers
 * @param label the form label
 */
export const naturalNum = (
  label: string,
  bounds: { min?: number; max?: number; def?: NonNegativeInteger } = {},
) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({
      label,
      required: bounds.def == null,
      inputMode: 'decimal',
    }),
    F.validateLeaf(
      pipe(
        V.naturalNumber,
        bounds.def != null ? V.optionalDefault(bounds.def) : id,
        V.boundNumber(bounds),
        V.addLabel(label),
      ),
    ),
  )

/**
 * A form that accepts years between 1900 and 2100
 * @param label the form label
 * @param props optional component props
 */
export const year = (
  label: string,
  props: { min: number; max: number; def?: NonNegativeInteger } = {
    min: 1900,
    max: 2100,
  },
) => naturalNum(label, props)

export const date = (label: string, def?: V.DateString) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({
      label,
      required: def == null,
      type: 'date',
      InputLabelProps: { shrink: true },
    }),
    F.validateLeaf(
      pipe(
        V.validDate,
        def != null ? V.optionalDefault(def) : id,
        V.addLabel(label),
      ),
    ),
  )

export const email = (label: string, def?: V.Email) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({
      label,
      required: def == null,
      type: 'email',
    }),
    F.validateLeaf(
      pipe(
        V.validEmail,
        def != null ? V.optionalDefault(def) : id,
        V.addLabel(label),
      ),
    ),
  )

export const phone = (label: string, def?: V.Phone) =>
  pipe(
    F.mkForm<string>(),
    F.setProps({
      label,
      required: def == null,
      type: 'tel',
    }),
    F.validateLeaf(
      pipe(
        V.validPhone,
        def != null ? V.optionalDefault(def) : id,
        V.addLabel(label),
      ),
    ),
  )
