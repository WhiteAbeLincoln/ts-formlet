import { URIS4, Kind4 } from 'fp-ts/lib/HKT'
import { Apply4C } from 'fp-ts/lib/Apply'
import { Functor4C } from 'fp-ts/lib/Functor'
import { Applicative4C } from 'fp-ts/lib/Applicative'
import { Chain4C } from 'fp-ts/lib/Chain'

declare module 'fp-ts/lib/Functor' {
  export interface Functor4C<F extends URIS4, E, S> {
    readonly URI: F
    readonly _E: E
    readonly _S: S
    readonly map: <R, A, B>(
      fa: Kind4<F, S, R, E, A>,
      f: (a: A) => B,
    ) => Kind4<F, S, R, E, B>
  }
}
type EnforceNonEmptyRecord<R> = keyof R extends never ? never : R
declare module 'fp-ts/lib/Apply' {
  export interface Apply4C<F extends URIS4, E, S> extends Functor4C<F, E, S> {
    readonly ap: <R, A, B>(
      fab: Kind4<F, S, R, E, (a: A) => B>,
      fa: Kind4<F, S, R, E, A>,
    ) => Kind4<F, S, R, E, B>
  }
  export function sequenceT<F extends URIS4, E, S>(
    F: Apply4C<F, E, S>,
  ): <R, T extends Array<Kind4<F, S, R, E, any>>>(
    ...t: T & {
      0: Kind4<F, S, R, E, any>
    }
  ) => Kind4<
    F,
    S,
    R,
    E,
    {
      [K in keyof T]: [T[K]] extends [Kind4<F, S, R, E, infer A>] ? A : never
    }
  >
  export function sequenceS<F extends URIS4, E, S>(
    F: Apply4C<F, E, S>,
  ): <R, NER extends Record<string, Kind4<F, S, R, E, any>>>(
    r: EnforceNonEmptyRecord<NER> & Record<string, Kind4<F, S, R, E, any>>,
  ) => Kind4<
    F,
    S,
    R,
    E,
    {
      [K in keyof NER]: [NER[K]] extends [Kind4<F, any, any, any, infer A>]
        ? A
        : never
    }
  >
}
declare module 'fp-ts/lib/Applicative' {
  export interface Applicative4C<F extends URIS4, E, S>
    extends Apply4C<F, E, S> {
    readonly of: <R, A>(a: A) => Kind4<F, S, R, E, A>
  }
}
declare module 'fp-ts/lib/Alt' {
  export interface Alt4C<F extends URIS4, E, S> extends Functor4C<F, E, S> {
    readonly alt: <R, A>(
      fx: Kind4<F, S, R, E, A>,
      fy: () => Kind4<F, S, R, E, A>,
    ) => Kind4<F, S, R, E, A>
  }
}
declare module 'fp-ts/lib/Chain' {
  export interface Chain4C<F extends URIS4, E, S> extends Apply4C<F, E, S> {
    readonly chain: <R, A, B>(
      fa: Kind4<F, S, R, E, A>,
      f: (a: A) => Kind4<F, S, R, E, B>,
    ) => Kind4<F, S, R, E, B>
  }
}
declare module 'fp-ts/lib/Monad' {
  export interface Monad4C<M extends URIS4, E, S>
    extends Applicative4C<M, E, S>,
      Chain4C<M, E, S> {}
}
