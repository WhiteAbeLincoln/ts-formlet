import React from 'react'
import NumberFormat, { NumberFormatProps } from 'react-number-format'
import TextField, { TextFieldProps } from '@material-ui/core/TextField'

function NumberFormatCustom({
  inputRef,
  onChange,
  ...other
}: NumberFormatProps & {
  inputRef: (instance: NumberFormat | null) => void
  onChange: (event: { target: { value: string } }) => void
}) {
  return (
    <NumberFormat
      getInputRef={inputRef}
      onValueChange={values => {
        onChange({
          target: {
            value: values.value,
          },
        })
      }}
      thousandSeparator
      isNumericString
      {...other}
    />
  )
}

export type NumericTextFieldProps = TextFieldProps & {
  inputProps?: NumberFormatProps
}

export const NumericTextField = (props: NumericTextFieldProps) => (
  <TextField
    {...props}
    inputMode="decimal"
    InputProps={{
      inputComponent: NumberFormatCustom as any,
      ...props.InputProps,
    }}
  />
)

export default NumericTextField
