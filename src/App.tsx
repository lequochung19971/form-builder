/** @jsx jsx */
import { useState } from 'react';
import { PageBuilder } from './page-builder/PageBuilder';
import { ComponentConfig } from './ui-builder/types';
import { useForm } from 'react-hook-form';
import { Input } from './components/ui/input';
import { ComponentType } from './page-builder/types';

const components: ComponentConfig<ComponentType>[] = [
  {
    id: 'text-dcfdadc8-8723-4f01-a49d-50025081e2d8',
    componentName: 'header1',
    type: ComponentType.TEXT,
    group: 'ui',
    props: {
      label: 'Demo UI Builder',
    },
  },
  {
    id: 'form-6a33ba6f-9393-4190-a1d9-8fa7f04729a0',
    componentName: 'form',
    type: ComponentType.FORM,
    group: 'form',
    components: [
      {
        id: 'arrayContainer-34b17f15-2ae9-4d0b-8e2d-47aa9ffe34fc',
        componentName: 'array',
        fieldName: 'array',
        type: ComponentType.ARRAY_CONTAINER,
        group: 'form-array-field',
        props: {
          defaultValue: [{}],
        },
        components: [
          {
            id: 'inputField-6dc1deb7-f0c7-406d-b55a-7c29f1ba6c17',
            componentName: 'firstName',
            type: ComponentType.INPUT_FIELD,
            fieldName: 'firstName',
            group: 'form-field',
            props: {
              validations: {
                required: {
                  when: {
                    dependsOn: ['array[].lastName'],
                    conditions: {},
                  },
                },
              },
            },
          },
          {
            id: 'inputField-dbb0ea77-3ca9-4d19-89b5-d8b07e09a87a',
            componentName: 'lastName',
            type: ComponentType.INPUT_FIELD,
            group: 'form-field',
            fieldName: 'lastName',
          },
          {
            id: 'inputField-dcfdadc8-8723-4f01-a49d-50025081e2d9',
            componentName: 'fullName',
            group: 'form-field',
            type: ComponentType.INPUT_FIELD,
            fieldName: 'fullName',
            // validation: {
            //   'required': {
            //     when: {
            //       dependsOn: ['lastName', 'firstName'],
            //     },
            //   },
            // },
          },
        ],
      },
      {
        id: 'inputField-6dc1deb7-f0c7-406d-b55a-7c29f1ba6c16',
        componentName: 'firstName',
        type: ComponentType.INPUT_FIELD,
        fieldName: 'firstName',
        group: 'form-field',
        props: {
          validations: {
            required: {
              when: {
                dependsOn: ['lastName'],
                conditions: {},
              },
            },
          },
        },
      },
      {
        id: 'inputField-dbb0ea77-3ca9-4d19-89b5-d8b07e09a87c',
        componentName: 'lastName',
        type: ComponentType.INPUT_FIELD,
        fieldName: 'lastName',
        group: 'form-field',
        props: {
          validations: {
            required: {
              when: {
                dependsOn: ['firstName'],
                conditions: {},
              },
            },
          },
        },
      },
      {
        id: 'inputField-dcfdadc8-8723-4f01-a49d-50025081e2d8',
        componentName: 'fullName',
        type: ComponentType.INPUT_FIELD,
        group: 'form-field',
        fieldName: 'fullName',
        // validations: {
        //   required: {
        //     when: {
        //       dependsOn: ['lastName', 'firstName'],
        //     },
        //   },
        // },
      },
      {
        id: 'button-dcfdadc8-8723-4f01-a49d-50025081e2d8',
        componentName: 'button',
        type: ComponentType.BUTTON,
        fieldName: 'fullName',
        group: 'ui',
        props: {
          label: 'Click Here',
          actions: {
            onClick: {
              appendRow: {
                target: 'form.__children.array',
                value: {
                  firstName: '',
                },
              },
            },
          },
        },
      },
    ],
  },
];

const TestForm = () => {
  const { register } = useForm({
    mode: 'all',
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });
  return (
    <div>
      <Input
        {...register('firstName', {
          validate: {
            test: () => {
              console.log('firstName');
              return true;
            },
            test2: () => {
              console.log('firstName - 2');
              return true;
            },
          },
        })}
      />
      <Input
        {...register('lastName', {
          deps: ['firstName'],
          validate: {
            test: () => {
              console.log('lastName');
              return false;
            },
          },
        })}
      />
    </div>
  );
};

export default function App() {
  const [count, setCount] = useState(0);

  // return (
  //   <div className="App">
  //     <FormBuilder
  //       components={components}
  //       defaultValues={{
  //         firstName: '',
  //       }}
  //     />
  //     <Button onClick={() => setCount((prev) => prev + 1)}>Click</Button>
  //   </div>
  // );
  // return <TestForm />;
  return <PageBuilder defaultComponentConfigs={components} />;
}
