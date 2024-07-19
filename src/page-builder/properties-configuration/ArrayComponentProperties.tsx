import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { InputFormField } from './form-fields/InputFormField';
import { BaseComponentProperties } from './types';
import { Button } from '@/components/ui/button';

export const ArrayComponentProperties: React.FunctionComponent<BaseComponentProperties> = ({
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
        <InputFormField name="componentName" label="Component Key" placeholder="Component Key" />
        <InputFormField name="name" label="Field Key" placeholder="Field Key" />
        <div className="flex justify-end">
          <Button type="submit" size="sm">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};
