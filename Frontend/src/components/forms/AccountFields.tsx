import { useBrisa } from '../../context/BrisaContext'
import {
  ACCOUNT_NUMBER_LENGTH,
  ACCOUNT_NUMBER_PATTERN,
  formatAccountNumber,
} from '../../domain/brisa'
import type { AccountInput } from '../../types'
import { SelectField, TextField } from '../ui/Fields'

interface AccountFieldsProps {
  value: AccountInput
  onChange: (patch: Partial<AccountInput>) => void
  // false keeps an existing account number that predates the format
  requireFormat?: boolean
}

export function AccountFields({
  value,
  onChange,
  requireFormat = true,
}: AccountFieldsProps) {
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
        value={formatAccountNumber(value.number)}
        required
        inputMode="numeric"
        autoComplete="off"
        placeholder="XXXX-XXXX-XXXX-XXXX"
        maxLength={ACCOUNT_NUMBER_LENGTH}
        pattern={requireFormat ? ACCOUNT_NUMBER_PATTERN.source : undefined}
        title="Ingresa los 16 dígitos con el formato XXXX-XXXX-XXXX-XXXX"
        onChange={(event) =>
          onChange({ number: formatAccountNumber(event.target.value) })
        }
      />
      <small>16 dígitos. El guion se agrega automáticamente.</small>
    </>
  )
}
