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

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  label: string
  name: string
  options: readonly string[]
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
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
