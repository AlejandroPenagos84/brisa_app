import { useBrisa } from '../../context/BrisaContext'
import type { AccountInput } from '../../types'
import { SelectField, TextField } from '../ui/Fields'

interface AccountFieldsProps {
  value: AccountInput
  onChange: (patch: Partial<AccountInput>) => void
}

export function AccountFields({ value, onChange }: AccountFieldsProps) {
  const { db } = useBrisa()
  const banks = db.banks.map((bank) => ({
    value: bank.id,
    label: [bank.name, db.countries.find((country) => country.id === bank.countryId)?.name]
      .filter(Boolean).join(' · '),
  }))

  return (
    <>
      <SelectField
        label="Banco"
        name="bank"
        options={[{ value: '', label: 'Selecciona un banco' }, ...banks]}
        value={value.bankId}
        required
        onChange={(event) => onChange({ bankId: event.target.value })}
      />
      <SelectField
        label="Tipo de cuenta"
        name="type"
        options={Array.from(new Set(['Ahorros', 'Corriente', value.type]))}
        value={value.type}
        onChange={(event) =>
          onChange({ type: event.target.value })
        }
      />
      <TextField
        label="Número de cuenta"
        name="number"
        value={value.number}
        required
        maxLength={30}
        onChange={(event) => onChange({ number: event.target.value })}
      />
    </>
  )
}
