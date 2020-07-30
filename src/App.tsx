import React from 'react'
import * as F from './formlet/simpleform'
import { builderEntry as bE } from './formlet/simpleform'
import * as V from './formlet/validation'
import {
  dollars,
  year,
  date,
  phone,
  nonEmptyReq,
  nonOptionalL,
} from './formlet/simpleform/util-formlets'
import { pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import { ArrayValue } from './formlet/internal/types'
import { id } from './formlet/internal/functional'
import { useForm1 } from './formlet'
import { Typography, Button } from '@material-ui/core'

const US_TERRITORIES = [
  'Alabama',
  'Alaska',
  'American Samoa',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District Of Columbia',
  'Federated States Of Micronesia',
  'Florida',
  'Georgia',
  'Guam',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Marshall Islands',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Northern Mariana Islands',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Palau',
  'Pennsylvania',
  'Puerto Rico',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virgin Islands',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
] as const

const [, addrDef, addrForm] = F.formBuilder({
  address: bE(V.Fresh(''), nonEmptyReq('Address')),
  city: bE(V.Fresh(''), nonEmptyReq('City')),
  state: bE(
    V.Fresh(O.none as O.Option<ArrayValue<typeof US_TERRITORIES>>),
    pipe(
      F.select(
        US_TERRITORIES.map(v => ({ label: v, value: v })),
        id,
        v =>
          US_TERRITORIES.includes(v as ArrayValue<typeof US_TERRITORIES>)
            ? O.some(v as ArrayValue<typeof US_TERRITORIES>)
            : O.none,
        'State',
      ),
      V.validate(nonOptionalL('State')),
    ),
  ),
})

const [, def, exForm] = F.formBuilder({
  dollars: bE(V.Fresh(''), dollars('Non-Negative dollar amount')),
  year: bE(V.Fresh(''), year('Year between 1900 and 2100')),
  date: bE(V.Fresh(''), date('Date')),
  phone: bE(V.Fresh(''), phone('Phone Number')),
  array: bE([] as Array<typeof addrDef>, pipe(addrForm, F.array(addrDef))),
})

function App() {
  const { validatedData, validated, rawData, ui } = useForm1(exForm, def)

  return (
    <div className="App">
      <form
        style={{
          display: 'flex',
          flexFlow: 'column nowrap',
        }}
        noValidate
        onSubmit={e => {
          e.preventDefault()
          alert('Form Submitted, check the console')
          console.log(
            pipe(
              validated,
              O.fold(() => null, id),
            ),
          )
        }}
      >
        <F.MoneyForm leaf={ui.dollars} />
        <F.NumberForm
          leaf={ui.year}
          inputProps={{ thousandSeparator: false }}
        />
        <F.InputBoxForm leaf={ui.date} />
        <F.InputBoxForm leaf={ui.phone} />
        <F.ArrayForm
          leaf={ui.array}
          addLabel="Add Address"
          itemLabel={i => `Address #${i}`}
        >
          {({ form }) => (
            <>
              <F.InputBoxForm leaf={form.address} />
              <F.InputBoxForm leaf={form.city} />
              <F.SelectForm leaf={form.state} />
            </>
          )}
        </F.ArrayForm>
        <Button disabled={O.isNone(validated)} type="submit">
          Submit
        </Button>
      </form>
      <Typography>Raw Form Data</Typography>
      <pre>{JSON.stringify(rawData, null, 4)}</pre>
      <Typography>Validated Data</Typography>
      <pre>{JSON.stringify(validated, null, 4)}</pre>
      <Typography>Validated Data Accessor</Typography>
      <pre>{JSON.stringify(validatedData, null, 4)}</pre>
    </div>
  )
}

export default App
