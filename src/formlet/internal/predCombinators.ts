export type Predicate<A> = (a: A) => boolean
export type Refinement<A, B extends A> = (a: A) => a is B

export function every<A, B extends A>(
  pred: Refinement<A, B>,
): Refinement<A[], B[]>
export function every<A>(pred: Predicate<A>): Predicate<A[]>
export function every<A>(pred: Predicate<A>): Predicate<A[]> {
  return xs => xs.every(pred)
}

export const some = <A>(pred: Predicate<A>): Predicate<A[]> => xs =>
  xs.some(pred)

export function not<A, B extends A>(
  pred: Refinement<A, B>,
): Refinement<A, Exclude<A, B>>
export function not<A>(pred: Predicate<A>): Predicate<A>
export function not<A>(pred: Predicate<A>): Predicate<A> {
  return a => !pred(a)
}

export function or<A, B1 extends A, B2 extends A>(
  p1: Refinement<A, B1>,
  p2: Refinement<A, B2>,
): Refinement<A, B1 | B2>
export function or<A, B extends A>(
  p1: Refinement<A, B>,
  p2: Predicate<A>,
): Predicate<A>
export function or<A, B extends A>(
  p1: Predicate<A>,
  p2: Refinement<A, B>,
): Predicate<A>
export function or<A>(...ps: Predicate<A>[]): Predicate<A>
export function or<A>(...ps: Predicate<A>[]): Predicate<A> {
  return a => ps.some(p => p(a))
}

export function and<A, B1 extends A, B2 extends A>(
  p1: Refinement<A, B1>,
  p2: Refinement<A, B2>,
): Refinement<A, B1 & B2>
export function and<A, B extends A>(
  p1: Refinement<A, B>,
  p2: Predicate<A>,
): Predicate<A>
export function and<A, B extends A>(
  p1: Predicate<A>,
  p2: Refinement<A, B>,
): Predicate<A>
export function and<A>(...ps: Predicate<A>[]): Predicate<A>
export function and<A>(...ps: Predicate<A>[]): Predicate<A> {
  return a => ps.every(p => p(a))
}

/** Transitive version of and */
export const andT = <A, B extends A, C extends B>(
  p1: Refinement<A, B>,
  p2: Refinement<B, C>,
) => (x: A): x is C => p1(x) && p2(x)
