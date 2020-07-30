import { Option, option, none, isSome } from 'fp-ts/lib/Option'
import { Endomorphism } from 'fp-ts/lib/function'
import { Fn } from './types'
import { Applicative4C } from 'fp-ts/lib/Applicative'
import { sequenceS } from 'fp-ts/lib/Apply'
import { Monoid } from 'fp-ts/lib/Monoid'
import { Monad4C } from 'fp-ts/lib/Monad'
import { Alt4C } from 'fp-ts/lib/Alt'
import { Semigroup } from 'fp-ts/lib/Semigroup'
import { Lens } from 'monocle-ts'
import { mapWithIndex } from 'fp-ts/lib/Record'
import { useState } from 'react'
import { setModified } from '../validation'
import { pipe } from 'fp-ts/lib/pipeable'

export const URI = 'Form'
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  // all of the curried typeclasses take E rather than the first
  // parameter R. The only instance we want to expose is with
  // R having a dependency (on Monoid), so we swap
  interface URItoKind4<S, R, E, A> {
    // E is UI, R is input type, A is output type, S is children
    [URI]: Form1<E, R, A, S>
  }
}

export type ChangeFn<I> = Fn<[Endomorphism<I>], void>

export type Form1<UI, I, A, C> = (
  i: I,
) => {
  edit: (props: { onChange: ChangeFn<I>; error?: string }) => UI
  validate: Option<A>
  children: C
}

export const map = <A, B>(fn: (a: A) => B) => <U, I, C>(
  form: Form1<U, I, A, C>,
): Form1<U, I, B, C> => v => {
  const { validate: result, ...rest } = form(v)
  return { validate: option.map(result, fn), ...rest }
}

export const mapUi = <U, V>(fn: (ui: U) => V) => <I, A, C>(
  form: Form1<U, I, A, C>,
): Form1<V, I, A, C> => v => {
  const { edit, ...rest } = form(v)
  return { edit: props => fn(edit(props)), ...rest }
}

export const mapChild = <C, V>(fn: (c: C) => V) => <U, I, A>(
  form: Form1<U, I, A, C>,
): Form1<U, I, A, V> => v => {
  const { children, ...rest } = form(v)
  return { children: fn(children), ...rest }
}

export const ap = <U, C>(MU: Semigroup<U>, MC: Semigroup<C>) => <I, A>(
  fa: Form1<U, I, A, C>,
) => <B>(fab: Form1<U, I, Fn<[A], B>, C>): Form1<U, I, B, C> => unvalidated => {
  const { edit: uiF, validate: resultF, children: cF } = fab(unvalidated)
  const { edit: uiA, validate: resultA, children: cA } = fa(unvalidated)
  return {
    edit: k => MU.concat(uiF(k), uiA(k)),
    validate: option.ap(resultF, resultA),
    children: MC.concat(cF, cA),
  }
}

export const of = <U, C>(MU: Monoid<U>, MC: Monoid<C>) => <E, A>(
  a: A,
): Form1<U, E, A, C> => _ => ({
  edit: () => MU.empty,
  validate: option.of(a),
  children: MC.empty,
})

export const getForm1 = <U, C>(
  MU: Monoid<U>,
  MC: Monoid<C>,
): Applicative4C<URI, U, C> => ({
  URI: URI,
  _E: (undefined as any) as U,
  _S: (undefined as any) as C,
  map: (fa, fn) => map(fn)(fa),
  ap: (fab, fa) => ap(MU, MC)(fa)(fab),
  of: of(MU, MC),
})

const sequentialChain = <U, C>(
  MU: Monoid<U>,
  MC: Monoid<C>,
): Monad4C<URI, U, C>['chain'] => (fa, f) => unvalidated => {
  const { edit: editF, validate: validateF, children: childF } = fa(unvalidated)
  const res = option.map(validateF, f)
  if (isSome(res)) {
    const { edit: editX, validate: validateX, children: childX } = res.value(
      unvalidated,
    )
    return {
      edit: k => MU.concat(editF(k), editX(k)),
      validate: validateX,
      children: MC.concat(childF, childX),
    }
  }
  return { edit: editF, validate: none, children: childF }
}

/**
 * Incompatible with the standard Form Apply instance
 * so we have a seperate instance generator function
 *
 * used for sequential forms, where a field depends
 * on the valididty of the previous
 */
export const getSequentialForm1 = <U, C>(
  MU: Monoid<U>,
  MC: Monoid<C>,
): Monad4C<URI, U, C> & Alt4C<URI, U, C> => {
  const form1 = getForm1(MU, MC)
  return {
    ...form1,
    // we define ap in terms of chain¸ ensuring that it is compatible
    ap: (fab, fa) => {
      const chain = sequentialChain(MU, MC)
      return chain(fab, f => chain(fa, a => form1.of(f(a))))
    },
    chain: sequentialChain(MU, MC),
    alt: (fx, fy) => unvalidated => {
      const rx = fx(unvalidated)
      const ry = fy()(unvalidated)

      return isSome(rx.validate) ? rx : ry
    },
  }
}

/** Revalidate a form to display errors or create a validated result */
export const revalidate = <U, I, A, C>(editor: Form1<U, I, A, C>) => (
  value: I,
): Option<A> => editor(value).validate

/** Invalidate a form, discarding the result */
export const invalidate = <U, C, I, A, B>(
  f: Form1<U, I, A, C>,
): Form1<U, I, B, C> => value => {
  const fx = f(value)
  return {
    ...fx,
    validate: none,
  }
}

/**
 * Focuses a form on a smaller piece of state using a lens
 */
export const focus = <S, A>(l: Lens<S, A>) => <Res, UI, C>(
  f: Form1<UI, A, Res, C>,
): Form1<UI, S, Res, C> => s => {
  const { edit, ...rest } = f(l.get(s))
  return {
    edit: ({ onChange: k, error }) =>
      edit({ onChange: v => k(l.modify(v)), error }),
    ...rest,
  }
}

export const recordFormBuilder1 = <UI, C>(MU: Monoid<UI>, MC: Monoid<C>) => <F>(
  propLens: <P extends keyof F>(prop: P) => Lens<F, F[P]>,
) => <R extends { [k in keyof F]: Form1<UI, F[k], any, C> }>(
  struct: R,
): Form1<UI, F, { [k in keyof R]: FormResult<R[k]> }, C> =>
  pipe(
    struct,
    // types here are obviously not correct
    // but typescript doesn't have great support for heterogenous mapping
    // while preserving types. The behavior is simple enough
    // that we can get away with so many any assertions
    mapWithIndex((k: any, f: Form1<UI, any, any, C>) => focus(propLens(k))(f)),
    sequenceS(getForm1(MU, MC)),
  ) as any

export const useForm1 = <UI, I, A, C>(
  editor: Form1<UI, I, A, C>,
  initialState: I,
) => {
  const [rawData, setRawData] = useState(initialState)
  const { edit, validate, children } = editor(rawData)

  const ui = edit({ onChange: setRawData })

  return {
    ui,
    rawData,
    setRawData,
    validatedData: children,
    reset: () => setRawData(() => initialState),
    setModified: () => setRawData(setModified),
    validated: validate,
  }
}

/** Create a react component from a Form and a render function */
export const build1 = <U>(render: Fn<[U], React.ReactElement>) => <I, A, C>(
  f: Form1<U, I, A, C>,
): React.ComponentType<{
  value: I
  onChange: ChangeFn<I>
}> => ({ value, onChange }) => {
  const { edit } = f(value)
  return render(edit({ onChange }))
}

export type FormUi<F> = F extends Form1<infer U, any, any, any> ? U : never
export type FormInput<F> = F extends Form1<any, infer I, any, any> ? I : never
export type FormResult<T> = T extends Form1<any, any, infer R, any> ? R : never
export type FormChildren<F> = F extends Form1<any, any, any, infer C>
  ? C
  : never
