import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string
  name: string
}

export function TextField({
  label,
  name,
  type = 'text',
  ...props
}: TextFieldProps) {
  return (
    <label>
      {label}
      <input name={name} type={type} {...props} />
    </label>
  )
}

interface StepperFieldProps {
  label: string
  name: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

// Numeric field that can only change through the − / + buttons
// (or the keyboard arrows); typing text is not allowed.
export function StepperField({
  label,
  name,
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
}: StepperFieldProps) {
  const current = Math.min(Math.max(value, min), max)

  function change(delta: number) {
    onChange(Math.min(Math.max(current + delta, min), max))
  }

  return (
    <div className="stepper-field">
      <span className="stepper-label" id={`${name}-label`}>
        {label}
      </span>
      <div className="stepper" role="group" aria-labelledby={`${name}-label`}>
        <button
          type="button"
          aria-label={`Disminuir ${label.toLowerCase()}`}
          disabled={current <= min}
          onClick={() => change(-1)}
        >
          −
        </button>
        <input
          name={name}
          value={current}
          readOnly
          inputMode="none"
          aria-labelledby={`${name}-label`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          role="spinbutton"
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              change(1)
            } else if (event.key === 'ArrowDown') {
              event.preventDefault()
              change(-1)
            }
          }}
        />
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={current >= max}
          onClick={() => change(1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  label: string
  name: string
  options: ReadonlyArray<string | SelectOption>
}

export function SelectField({
  label,
  name,
  options,
  ...props
}: SelectFieldProps) {
  return (
    <label>
      {label}
      <select name={name} {...props}>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value
          const text = typeof option === 'string' ? option : option.label

          return (
            <option key={value} value={value}>
              {text}
            </option>
          )
        })}
      </select>
    </label>
  )
}

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  label: string
  name: string
}

export function TextAreaField({
  label,
  name,
  ...props
}: TextAreaFieldProps) {
  return (
    <label>
      {label}
      <textarea name={name} {...props} />
    </label>
  )
}
