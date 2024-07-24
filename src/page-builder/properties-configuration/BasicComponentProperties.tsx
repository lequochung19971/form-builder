import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { InputFormField } from './form-fields/InputFormField';
import { BaseComponentProperties } from './types';
import { Button } from '@/components/ui/button';

export const BasicComponentProperties: React.FunctionComponent<BaseComponentProperties> = ({
  componentConfig,
  onSubmit,
}) => {
  const formMethods = useForm({
    mode: 'all',
    defaultValues: componentConfig,
  });

  return (
    <Form {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit!)} className="space-y-4 w-full">
        <InputFormField
          name="componentName"
          label="Component Key"
          placeholder="Enter a component key"
        />
        <InputFormField name="label" label="Label" placeholder="Enter a label" />
        <div className="flex justify-end">
          <Button type="submit" size="sm">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};
