import { BANKS } from '../../domain/brisa'
import type { AccountInput, AccountType } from '../../types'
import { SelectField, TextField } from '../ui/Fields'

interface AccountFieldsProps {
  value: AccountInput
  onChange: (patch: Partial<AccountInput>) => void
}

export function AccountFields({ value, onChange }: AccountFieldsProps) {
  return (
    <>
      <SelectField
        label="Banco"
        name="bank"
        options={BANKS}
        value={value.bank}
        onChange={(event) => onChange({ bank: event.target.value })}
      />
      <SelectField
        label="Tipo de cuenta"
        name="type"
        options={['Ahorros', 'Corriente']}
        value={value.type}
        onChange={(event) =>
          onChange({ type: event.target.value as AccountType })
        }
      />
      <TextField
        label="Número de cuenta"
        name="number"
        value={value.number}
        required
        pattern="[0-9]{6,20}"
        inputMode="numeric"
        onChange={(event) => onChange({ number: event.target.value })}
      />
    </>
  )
}
