import '../form.css'
import React from 'react'
import { FormLeaf, SelectUi, ArrayUi, AnyRTree } from './form'
import TextField, { TextFieldProps } from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import FormHelperText from '@material-ui/core/FormHelperText'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import Delete from '@material-ui/icons/Delete'
import Switch, { SwitchProps } from '@material-ui/core/Switch'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { K } from '../internal/functional'
import NumericTextField, {
  NumericTextFieldProps,
} from '../internal/NumericTextField'
import { partial } from '../internal/util'
import { useState, useEffect } from 'react'

// todo: this restriction props?: object allows props to have any type
// using Object or {} does the same thing. find a way to exclude all primitive types
type InputBoxLeaf = FormLeaf<string>
type InputBoxProps<L extends InputBoxLeaf> = { leaf: L } & TextFieldProps

export const InputBoxForm = <L extends InputBoxLeaf>({
  leaf: { onChange, value, error, props },
  // triggered = true,
  ...rest
}: InputBoxProps<L>) => (
  <TextField
    {...(props as any)}
    {...rest}
    className="formlet formlet-input"
    onChange={e => {
      // target may be released before set state callback
      // is invoked so we store value in an intermediate variable
      // or we can rely on javascript's eager evaluation
      // and use the K combinator to construct the constant function

      // const val = e.target.value
      onChange(K(e.target.value))
    }}
    value={value}
    error={!!error}
    helperText={error || rest.helperText}
  />
)

export const NumberForm = <L extends InputBoxLeaf>({
  leaf: { onChange, value, error, props },
  triggered = true,
  ...rest
}: { leaf: L; triggered?: boolean } & NumericTextFieldProps) => {
  const [val, setVal] = useState(value)

  // Makes sure displayed value is in sync when form value is changed out of band.
  // it would be better to use the leaf value as a key, and have this be an
  // uncontrolled component, but that would require adding a key prop to every usage
  // of NumberForm or MoneyForm. This current workaround will render the component twice,
  // but that doesn't seem to have much of a performance impact.
  useEffect(() => {
    if (value !== val) setVal(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <NumericTextField
      {...(props as any)}
      {...rest}
      className="formlet formlet-input"
      onChange={e => {
        setVal(K(e.target.value))
        if (!triggered) onChange(K(e.target.value))
      }}
      onBlur={
        triggered
          ? () => {
              onChange(K(val))
            }
          : undefined
      }
      value={val}
      error={!!error}
      helperText={error || rest.helperText}
    />
  )
}

export const MoneyForm: typeof NumberForm = partial(NumberForm, {
  inputProps: { prefix: '$', fixedDecimalScale: true, decimalScale: 2 },
}) as any

export const ToggleForm = ({
  label,
  leaf,
  props,
}: {
  leaf: FormLeaf<boolean>
  props?: SwitchProps
  label?: string
}) => {
  const control = (
    <Switch
      {...props}
      checked={leaf.value}
      onChange={e => {
        e.stopPropagation()
        leaf.onChange(K(e.target.checked))
      }}
    />
  )

  return (
    <FormControl className="formlet formlet-toggle">
      {label ? <FormControlLabel label={label} control={control} /> : control}
      {leaf.error && <FormHelperText error>{leaf.error}</FormHelperText>}
    </FormControl>
  )
}

export const SelectForm = ({
  leaf: {
    items,
    select: { error, onChange, value, props: sprops },
  },
  ...props
}: {
  leaf: SelectUi
} & TextFieldProps) => (
  <TextField
    {...sprops}
    {...props}
    className="formlet formlet-select"
    select
    error={!!error}
    helperText={error}
    onChange={e => onChange(K(e.target.value))}
    value={value}
  >
    {items.map(({ value: { label, value } }) => (
      <MenuItem className="formlet-select__item" key={label} value={value}>
        {label}
      </MenuItem>
    ))}
  </TextField>
)

export const ArrayForm = <U extends AnyRTree>({
  leaf: { addbtn, children },
  addLabel,
  itemLabel,
  children: render,
}: {
  leaf: ArrayUi<U>
  children: (data: { form: U; label: string }) => React.ReactElement
  addLabel: string
  itemLabel: string | ((idx: number) => string)
}) => (
  <div className="formlet formlet-array">
    <div className="formlet-array_children">
      {children.map(({ deletebtn, editor }, i) => {
        const label =
          typeof itemLabel === 'string'
            ? `${itemLabel} #${i + 1}`
            : itemLabel(i)

        return (
          <div key={i} className="formlet-array-child">
            <div className="formlet-array-label">
              <Typography className="formlet-array-label__label">
                {label}
              </Typography>
              <IconButton
                disabled={!deletebtn.run}
                className="formlet-array-label__delete-btn"
                onClick={() => deletebtn.run && deletebtn.run()}
              >
                <Delete />
              </IconButton>
            </div>
            <div className="formlet-array-editor">
              {render({ form: editor, label })}
            </div>
          </div>
        )
      })}
    </div>
    {addbtn.run && (
      <Button
        variant="outlined"
        className="formlet-array__add-btn"
        onClick={addbtn.run}
      >
        {addLabel}
      </Button>
    )}
  </div>
)
