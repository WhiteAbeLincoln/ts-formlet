import { some } from 'fp-ts/lib/Option'
import {
  Form1,
  ChangeFn,
  FormUi,
  FormResult,
  getForm1,
  focus,
  mapUi,
  FormChildren,
} from '../internal/form'
import { getMonoid, mapWithIndex, map as mapRec } from 'fp-ts/lib/Record'
import { Lens } from 'monocle-ts'
import { getFirstSemigroup } from 'fp-ts/lib/Semigroup'
import { sequenceS } from 'fp-ts/lib/Apply'
import { pipe } from 'fp-ts/lib/pipeable'
import { pipe as flow, K, endoImap } from '../internal/functional'
import * as Arr from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import { DiscriminateUnion } from '../internal/types'
import { fromArray } from '../internal/Option'
import { fromOption } from '../internal/Array'
import { Newtype } from 'newtype-ts/es6'
import { Validator, Validated, validate } from '../validation'
import { deepMerge } from '../internal/util'

const leaf_kind = Symbol('LeafKind')
/**
 * Leaf that represents some action to perform.
 * Usually displayed by a Button
 */
export type ActionLeaf<I> = {
  [leaf_kind]: 'ACTION'
  /** executes the action. if undefined, typically means the action is disabled */
  run?: () => void
  /** value associated with an action. Can be a label, or the result of executing the action */
  value?: I
}
/**
 * leaf that holds a "constant" value.
 * The value may change by result of some other leaf,
 * but it cannot change itself
 */
export type ValueLeaf<I> = {
  [leaf_kind]: 'VALUE'
  value: I
}
/**
 * Leaf that represents some form that can change itself.
 */
export type FormLeaf<I> = {
  [leaf_kind]: 'FORM'
  onChange: ChangeFn<I>
  value: I
  error?: string
  props?: object
}

export type Leaf<I> = ActionLeaf<I> | ValueLeaf<I> | FormLeaf<I>
export const FormLeaf = <I>(
  data: Omit<FormLeaf<I>, typeof leaf_kind>,
): FormLeaf<I> => ({ ...data, [leaf_kind]: 'FORM' })
export const ValueLeaf = <I>(
  data: Omit<ValueLeaf<I>, typeof leaf_kind>,
): ValueLeaf<I> => ({ ...data, [leaf_kind]: 'VALUE' })
export const ActionLeaf = <I>(
  data: Omit<ActionLeaf<I>, typeof leaf_kind>,
): ActionLeaf<I> => ({ ...data, [leaf_kind]: 'ACTION' })
export const leafis = <K extends Leaf<any>[typeof leaf_kind]>(k: K) => (
  a: any,
): a is DiscriminateUnion<Leaf<any>, typeof leaf_kind, K> =>
  !!(typeof a === 'object' && a != null && a[leaf_kind] === k)

export const mkForm = <A = never>(): Form1<FormLeaf<A>, A, A, O.None> => v => ({
  edit: ({ onChange, error }) => FormLeaf({ value: v, onChange, error }),
  validate: some(v),
  children: O.none as O.None,
})

export const validateLeaf = <A, B>(runValidator: Validator<A, B>) => <
  I,
  UI extends FormLeaf<I>
>(
  editor: Form1<UI, I, A, O.None>,
): Form1<UI, Validated<I>, B, O.Option<B>> => v => {
  const r = validate(runValidator)(editor)(v)
  return { ...r, children: r.validate }
}

export const setProps = <V>(
  props: V,
): (<I, A, UI extends FormLeaf<I>, C>(
  f: Form1<UI, I, A, C>,
) => Form1<UI & { props: V }, I, A, C>) =>
  mapUi(ui => deepMerge(ui, { props }) as any)

/** The type of all record trees with heterogeneous Leaf values */
export type AnyRTree = Leaf<any> | Array<AnyRTree> | { [k: string]: AnyRTree }
export type AnyChild =
  | O.Option<any>
  | Array<AnyChild>
  | { [k: string]: AnyChild }

export const recordFormBuilder = <F>(
  propLens: <P extends keyof F>(prop: P) => Lens<F, F[P]>,
) => <R extends { [k in keyof F]: Form1<AnyRTree, F[k], any, any> }>(
  struct: R,
): Form1<
  { [k in keyof R]: FormUi<R[k]> },
  F,
  { [k in keyof R]: FormResult<R[k]> },
  {
    [k in keyof R]: {
      r: FormChildren<R[k]>
      v: O.Option<FormResult<R[k]>>
    }
  }
> => {
  const monoid = getMonoid(getFirstSemigroup<any>())
  return pipe(
    struct,
    mapWithIndex((k: any, f: Form1<AnyRTree, any, any, AnyChild>) =>
      pipe(
        // the new form with the input refocused
        focus(propLens(k))(f),
        (
          f,
        ): Form1<
          AnyRTree,
          F,
          any,
          { [k: string]: { r: AnyChild; v: O.Option<any> } }
        > => v => {
          const r = f(v)
          return {
            ...r,
            children: {
              [k]: { r: r.children, v: r.validate },
            },
          }
        },
        // we need to map the ui so that they are in the form { [key]: ui }
        // which is what will allow the record monoid to properly combine both
        // Leaf elements and Record Tree elements
        mapUi((ui: AnyRTree) => ({ [k]: ui })),
      ),
    ),
    sequenceS(getForm1(monoid, monoid)),
  ) as any
}

/** ensures that values for formBuilder can only be created by builderEntry */
type Entry<T> = Newtype<{ readonly btag: unique symbol }, T>
type EntryVal<T extends Entry<any>> = T extends Entry<infer A> ? A : never

/** ensures that entries in formBuilder have the proper type, with default value and input value matching */
export const builderEntry = <
  T extends [any, Form1<AnyRTree, T[0], any, AnyChild>]
>(
  ...v: T
): Entry<T> => (v as unknown) as Entry<T>

export const formBuilder = <
  Rec extends {
    [k in string]: Entry<[any, Form1<AnyRTree, any, any, AnyChild>]>
  },
  F extends { [k in keyof Rec]: EntryVal<Rec[k]>[0] } = {
    [k in keyof Rec]: EntryVal<Rec[k]>[0]
  },
  R extends { [k in keyof Rec]: EntryVal<Rec[k]>[1] } = {
    [k in keyof Rec]: EntryVal<Rec[k]>[1]
  }
>(
  rec: Rec,
): [
  <P extends keyof Rec>(prop: P) => Lens<F, F[P]>,
  { [k in keyof Rec]: EntryVal<Rec[k]>[0] },
  Form1<
    { [k in keyof Rec]: FormUi<EntryVal<Rec[k]>[1]> },
    F,
    { [k in keyof Rec]: FormResult<EntryVal<Rec[k]>[1]> },
    {
      [k in keyof Rec]: {
        r: FormChildren<EntryVal<Rec[k]>[1]>
        v: O.Option<FormResult<EntryVal<Rec[k]>[1]>>
      }
    }
  >,
] => {
  const defs = pipe(
    rec,
    mapRec(v => ((v as unknown) as [any, any])[0]),
  ) as F
  const forms = pipe(
    rec,
    mapRec(v => ((v as unknown) as [any, any])[1]),
  ) as R
  const lens = Lens.fromProp<F>()

  return [lens, defs, recordFormBuilder(lens)(forms as any) as any]
}

export type ArrayUi<F extends AnyRTree> = {
  addbtn: ActionLeaf<never>
  children: Array<{
    deletebtn: ActionLeaf<never>
    editor: F
  }>
}

const editAt = (idx: number) => <I>(f: (i: I) => I) => (ys: I[]): I[] =>
  O.getOrElse(K(ys))(Arr.modifyAt(idx, f)(ys))

const deleteAt = (idx: number) => <I>(ys: I[]): I[] =>
  pipe(ys, Arr.deleteAt(idx), O.getOrElse(K(ys)))

export const array = <I>(
  defaultValue: I,
  {
    minLen = 0,
    maxLen,
  }: {
    minLen?: number
    maxLen?: number
  } = {},
) => <U extends AnyRTree, A, C extends AnyChild>(
  editor: Form1<U, I, A, C>,
): Form1<
  ArrayUi<U>,
  I[],
  A[],
  {
    r: C[]
    v: O.Option<A>[]
  }
> => xs => {
  return {
    edit: ({ onChange }) => ({
      addbtn: ActionLeaf({
        run:
          maxLen != null && xs.length === maxLen
            ? undefined
            : () => onChange(ys => Arr.snoc(ys, defaultValue)),
      }),
      children: xs.map((x, i) => ({
        deletebtn: ActionLeaf({
          run: xs.length === minLen ? undefined : () => onChange(deleteAt(i)),
        }),
        editor: editor(x).edit({
          onChange: flow(editAt(i), onChange),
        }),
      })),
    }),

    validate: Arr.array.traverse(O.option)(
      xs,
      flow(editor, f => f.validate),
    ),

    get children() {
      return {
        r: xs.map(flow(editor, e => e.children)),
        v: xs.map(flow(editor, f => f.validate)),
      }
    },
  }
}

export const maybeable = <I>(defaultValue: I) => <
  A,
  U extends AnyRTree,
  C extends AnyChild
>(
  editor: Form1<U, I, A, C>,
): Form1<
  ArrayUi<U>,
  O.Option<I>,
  O.Option<A>,
  { r: O.Option<C>; v: O.Option<A> }
> => x => {
  const arrToOption = endoImap(fromArray, fromOption)
  const xs = fromOption(x)
  const r = array(defaultValue, { maxLen: 1, minLen: 0 })(editor)
  const { edit, validate, children } = r(xs)

  return {
    edit: ({ onChange, error }) =>
      edit({ onChange: flow(arrToOption, onChange), error }),
    validate: O.option.map(validate, fromArray),
    children: {
      r: fromArray(children.r),
      v: O.compact(fromArray(children.v)),
    },
  }
}

export type SelectUi = {
  items: Array<ValueLeaf<{ label: string; value: string }>>
  select: FormLeaf<string>
}

export const select = <A>(
  arr: Array<{ label: string; value: A }>,
  toString: (a: A) => string,
  fromString: (s: string) => O.Option<A>,
  label?: string,
): Form1<SelectUi, O.Option<A>, O.Option<A>, O.None> => selected => ({
  edit: ({ onChange, error }) => {
    const value = O.fold(() => '', toString)(selected)
    return {
      select: FormLeaf({
        value,
        onChange: vfn =>
          onChange(K(pipe(value, vfn, O.fromNullable, O.chain(fromString)))),
        error,
        props: label ? { label } : {},
      }),
      items: arr.map(({ label, value }) =>
        ValueLeaf({ value: { label, value: toString(value) } }),
      ),
    }
  },
  validate: O.some(selected),
  children: O.none as O.None,
})
