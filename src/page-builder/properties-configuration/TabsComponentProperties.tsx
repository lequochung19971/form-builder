import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { CirclePlus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { v4 as uuidV4 } from 'uuid';
import { InputFormField } from './form-fields/InputFormField';
import { BaseComponentProperties } from './types';
import { ComponentType } from '../types';

const Tabs: React.FunctionComponent<{ control: UseFormReturn['control'] }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'components',
  });

  return (
    <div>
      <Label>Tabs</Label>
      <div className="pl-4 mt-2 w-full">
        <div className="space-y-2 w-full">
          {fields?.map((f, index) => (
            <div key={f.id} className="flex flex-row items-end space-x-3 w-full">
              <InputFormField
                id={f.id}
                name={`components.${index}.componentName`}
                placeholder="Tab Key"
                className="w-full"
              />
              <Button
                variant="ghost"
                className="w-7 h-7 flex items-center justify-center mb-1"
                size="icon"
                onClick={() => remove(index)}>
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          className="mt-2 w-7 h-7 flex items-center justify-center"
          size="icon"
          onClick={() =>
            append({
              id: uuidV4(),
              type: ComponentType.TAB,
              componentName: '',
            })
          }>
          <CirclePlus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export const TabsComponentProperties: React.FunctionComponent<BaseComponentProperties> = ({
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
        <Tabs control={formMethods.control} />
        <div className="flex justify-end">
          <Button type="submit" size="sm">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};
