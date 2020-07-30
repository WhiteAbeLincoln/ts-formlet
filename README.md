# ts-formlet

A future form building and validation library for TypeScript inspired by [this PureScript article](https://www.lumi.dev/blog/using-purescript-to-create-a-dsl-for-building-forms). Used in production for a financial calculator website.

See example usage in `src/App.tsx`. Code for the library is under `src/formlet`.

## Future Changes

+ Change Form type to produce an `Either<T, Error[]>` instead of `Option<T>`, so that sub-errors can be gathered at the end of the form.
+ Have Form builder functions hold their default values as properties on the function object, so that we can avoid specifying a default manually. Should build up across combinators like `formBuilder` to produce an object default.
+ Generate a ui from the form automatically. Separate out the UI generation and the core form into separate libraries with stable interfaces for the UI types so people can use components different from Material-UI
