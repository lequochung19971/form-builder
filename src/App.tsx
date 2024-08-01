/** @jsx jsx */
import { useState } from 'react';
import { PageBuilder } from './page-builder/PageBuilder';
import { ComponentConfig } from './ui-builder/types';
import { useForm } from 'react-hook-form';
import { Input } from './components/ui/input';
import { ComponentType } from './page-builder/types';
import { v4 as uuidV4 } from 'uuid';

const components: ComponentConfig<ComponentType>[] = [
  {
    id: uuidV4(),
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
            validations: {
              required: {
                when: {
                  dependsOn: ['array[].lastName'],
                  conditions: {},
                },
              },
            },
            props: {},
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
        validations: {
          required: {
            when: {
              dependsOn: ['lastName'],
              conditions: {},
            },
          },
        },
        props: {},
      },
      {
        id: 'inputField-dbb0ea77-3ca9-4d19-89b5-d8b07e09a87c',
        componentName: 'lastName',
        type: ComponentType.INPUT_FIELD,
        fieldName: 'lastName',
        group: 'form-field',
        validations: {
          required: {
            when: {
              dependsOn: ['firstName'],
              conditions: {},
            },
          },
        },
        props: {},
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
        },
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
    ],
  },
];

const components2: ComponentConfig<ComponentType>[] = [
  {
    id: uuidV4(),
    componentName: 'header1',
    type: ComponentType.TEXT,
    group: 'ui',
    props: {
      label: 'Demo UI Builder',
      variant: 'h1',
    },
  },
  {
    id: uuidV4(),
    componentName: 'tabs',
    group: 'ui',
    type: ComponentType.TABS,
    components: [
      {
        id: uuidV4(),
        componentName: 'tab1',
        group: 'ui',
        type: ComponentType.TAB,
        props: {
          label: 'Create user',
        },
        components: [
          {
            id: uuidV4(),
            componentName: 'header3',
            type: ComponentType.TEXT,
            group: 'ui',
            props: {
              label: 'Create a new user',
              variant: 'h3',
            },
          },
          {
            id: uuidV4(),
            componentName: 'form',
            type: ComponentType.FORM,
            group: 'form',
            props: {
              grid: {
                cols: 4,
              },
            },
            actions: {
              onSubmit: {
                callApi: {
                  method: 'POST',
                  url: '/users',
                  resetForm: true,
                },
              },
            },
            components: [
              {
                id: uuidV4(),
                componentName: 'firstName',
                fieldName: 'firstName',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'First Name',
                  grid: {
                    colSpan: 1,
                  },
                },
              },
              {
                id: uuidV4(),
                componentName: 'lastName',
                fieldName: 'lastName',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Last Name',
                  grid: {
                    colSpan: 1,
                  },
                },
              },
              {
                id: uuidV4(),
                componentName: 'fullName',
                fieldName: 'fullName',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Full Name',
                  grid: {
                    colSpan: 1,
                  },
                },
              },
              {
                id: uuidV4(),
                componentName: 'phone',
                fieldName: 'phone',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Phone',
                  grid: {
                    colSpan: 1,
                  },
                },
              },
              {
                id: uuidV4(),
                componentName: 'Address',
                fieldName: 'address',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Address',
                  grid: {
                    colSpan: 4,
                  },
                },
              },
              {
                id: uuidV4(),
                componentName: 'button',
                type: ComponentType.BUTTON,
                group: 'ui',
                props: {
                  grid: {
                    colSpan: 4,
                  },
                  type: 'submit',
                  label: 'Submit',
                },
              },
            ],
          },
        ],
      },
      {
        id: uuidV4(),
        componentName: 'tab2',
        group: 'ui',
        type: ComponentType.TAB,
        props: {
          label: 'User management',
        },
        components: [
          {
            id: uuidV4(),
            componentName: 'header3',
            type: ComponentType.TEXT,
            group: 'ui',
            props: {
              label: 'User list',
              variant: 'h3',
            },
          },
          {
            id: uuidV4(),
            componentName: 'form',
            type: ComponentType.FORM,
            group: 'form',
            lifecycle: {
              mountAndUpdate: {
                'form.loadDataSource': {
                  params: {
                    method: 'GET',
                    url: '/users',
                    loadSuccess: {
                      resetToPath: 'users',
                    },
                  },
                  dependencies: {
                    props: ['refetchEvent'],
                  },
                },
              },
            },
            components: [
              {
                id: uuidV4(),
                componentName: 'users',
                fieldName: 'users',
                group: 'form-array-field',
                type: ComponentType.DATA_TABLE,
                props: {
                  defaultValue: [],
                },
                components: [
                  {
                    id: uuidV4(),
                    componentName: 'firstName',
                    fieldName: 'firstName',
                    type: ComponentType.TEXT_FIELD,
                    group: 'form-field',
                    props: {
                      defaultValue: '',
                      label: 'First Name',
                    },
                  },
                  {
                    id: uuidV4(),
                    componentName: 'lastName',
                    fieldName: 'lastName',
                    type: ComponentType.TEXT_FIELD,
                    group: 'form-field',
                    props: {
                      defaultValue: '',
                      label: 'Last Name',
                    },
                  },
                  {
                    id: uuidV4(),
                    componentName: 'fullName',
                    fieldName: 'fullName',
                    type: ComponentType.TEXT_FIELD,
                    group: 'form-field',
                    props: {
                      defaultValue: '',
                      label: 'Full Name',
                    },
                  },
                  {
                    id: uuidV4(),
                    componentName: 'phone',
                    fieldName: 'phone',
                    type: ComponentType.TEXT_FIELD,
                    group: 'form-field',
                    props: {
                      defaultValue: '',
                      label: 'Phone',
                    },
                  },
                  {
                    id: uuidV4(),
                    componentName: 'editButton',
                    type: ComponentType.BUTTON,
                    group: 'ui',
                    props: {
                      label: 'Edit',
                    },
                    actions: {
                      onClick: {
                        setProps: {
                          props: {
                            open: true,
                          },
                          target: 'tabs.__children.tab2.__children.dialogForm',
                        },
                        setPropsFromArrayItemData: {
                          target: 'tabs.__children.tab2.__children.dialogForm',
                          source: {
                            id: 'id',
                          },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            id: uuidV4(),
            componentName: 'dialogForm',
            group: 'form',
            type: ComponentType.DIALOG_FORM,
            actions: {
              onSubmit: {
                updateUser: true,
              },
            },
            lifecycle: {
              mountAndUpdate: {
                'form.loadDataSource': {
                  params: {
                    method: 'GET',
                    url: '/users/${id}',
                    params: {
                      props: {
                        id: 'id',
                      },
                    },
                    loadSuccess: {
                      resetToPath: '',
                    },
                  },
                  dependencies: {
                    props: ['id'],
                  },
                },
              },
            },
            props: {
              open: false,
              title: 'Edit user',
            },
            components: [
              {
                id: uuidV4(),
                componentName: 'firstName',
                fieldName: 'firstName',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'First Name',
                },
              },
              {
                id: uuidV4(),
                componentName: 'lastName',
                fieldName: 'lastName',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Last Name',
                },
              },
              {
                id: uuidV4(),
                componentName: 'fullName',
                fieldName: 'fullName',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Full Name',
                },
              },
              {
                id: uuidV4(),
                componentName: 'phone',
                fieldName: 'phone',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Phone',
                },
              },
              {
                id: uuidV4(),
                componentName: 'Address',
                fieldName: 'address',
                type: ComponentType.INPUT_FIELD,
                group: 'form-field',
                props: {
                  defaultValue: '',
                  label: 'Address',
                },
              },
              {
                id: uuidV4(),
                componentName: 'button',
                type: ComponentType.BUTTON,
                group: 'ui',
                props: {
                  type: 'submit',
                  label: 'Submit',
                },
              },
            ],
          },
        ],
      },
      {
        id: uuidV4(),
        componentName: 'tab3',
        group: 'ui',
        type: ComponentType.TAB,
        props: {
          label: 'Tab 3',
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
  return <PageBuilder defaultComponentConfigs={components2} />;
}
