/**
 * useFormValidation.js – Composable for form validation with vee-validate + Yup.
 *
 * Usage:
 *   const schema = yup.object({ ... })
 *   const { handleSubmit, isSubmitting, resetForm, errors, values, validateField } =
 *     useFormValidation(schema, { field: '' })
 *
 *   const onSubmit = handleSubmit((values) => { ... })
 */
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'

/**
 * Wraps vee-validate's useForm with a Yup schema.
 * @param {import('yup').ObjectSchema} schema - Yup validation schema
 * @param {object} initialValues - Initial form values
 * @returns {{ handleSubmit, isSubmitting, resetForm, errors, values, validateField, setFieldValue, setErrors }}
 */
export function useFormValidation(schema, initialValues = {}) {
  const typedSchema = toTypedSchema(schema)

  const {
    handleSubmit,
    isSubmitting,
    resetForm,
    errors,
    values,
    validateField,
    setFieldValue,
    setErrors,
  } = useForm({
    validationSchema: typedSchema,
    initialValues,
    validateOnBlur: true,
    validateOnChange: true,
  })

  return {
    handleSubmit,
    isSubmitting,
    resetForm,
    errors,
    values,
    validateField,
    setFieldValue,
    setErrors,
  }
}
