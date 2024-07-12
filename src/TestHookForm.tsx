import { useForm } from 'react-hook-form';
import { useFieldArray } from './components/form-builder/useFieldArray';

export const TestHookForm = () => {
  const form = useForm({
    mode: 'all',
    defaultValues: {
      array: [] as {
        value: string;
      }[],
    },
  });
  const { _fields: fields, append } = useFieldArray({
    name: 'array',
    control: form.control,
  });

  return (
    <div>
      {fields.map((f, index) => (
        <input
          key={`array.${index}.value`}
          {...form.register(`array.${index}.value`, {
            validate: {
              requred: (value: string) => {
                console.log('value', value);
                return !!value;
              },
            },
            maxLength: 2,
            required: true,
          })}
          placeholder="value"
        />
      ))}
      <button
        onClick={() =>
          append({
            value: 'new',
          })
        }>
        Add
      </button>
      <button
        onClick={() =>
          form.setValue('array', [
            {
              value: 'HUNG',
            },
          ])
        }>
        Set array
      </button>
    </div>
  );
};
