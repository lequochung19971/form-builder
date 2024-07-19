/** @jsx jsx */
import { jsx, useTheme } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import { ComponentConfig, ComponentType } from './page-builder/types';
import { PageBuilder } from './page-builder/PageBuilder';

const components: ComponentConfig[] = [
  // {
  //   id: '1',
  //   name: 'firstName',
  //   type: ComponentType.INPUT,
  //   actions: {
  //     change(args) {
  //       if ((args.event.target as any).value === 'hung') {
  //         args.control.getCurrent().__control.setComponentInstance('firstName', {
  //           __state: {
  //             disabled: true,
  //           },
  //         });
  //       }
  //     },
  //   },
  // },
  // {
  //   id: '2',
  //   name: 'lastName',
  //   type: ComponentType.INPUT,
  //   visibility: {
  //     disabled: {
  //       method({ watches }) {
  //         const [fullNameComponentState] = watches?.states ?? [];
  //         console.log(fullNameComponentState);
  //         return !!fullNameComponentState.disabled;
  //       },
  //       watch: {
  //         values: 'firstName',
  //         states: 'firstName.__state',
  //       },
  //     },
  //   },
  //   actions: {
  //     change(args) {
  //       console.log(args.control.getComponentInstances('firstName'));
  //     },
  //   },
  // },
  // {
  //   id: '3',
  //   name: 'fullName',
  //   type: ComponentType.INPUT,
  //   visibility: {
  //     disabled: {
  //       method: ({ watches }) => {
  //         const [firstName] = watches?.values ?? [];
  //         return firstName !== 'hung';
  //       },
  //       watch: {
  //         values: 'firstName',
  //       },
  //     },
  //   },
  // },
  // {
  //   id: '4',
  //   name: 'object',
  //   type: ComponentType.OBJECT_CONTAINER,
  //   components: [
  //     {
  //       id: '4-1',
  //       name: 'firstName',
  //       type: ComponentType.INPUT,
  //       actions: {
  //         change(args) {
  //           // console.log(args);
  //         },
  //       },
  //       visibility: {
  //         disabled: {
  //           method({ watches = {}, control }) {
  //             const [firstName] = watches.values ?? [];
  //             console.log('object.firstNaem');
  //             return firstName === 'hung';
  //           },
  //           watch: {
  //             values: 'object.firstName',
  //           },
  //         },
  //       },
  //     },
  //     {
  //       id: '4-2',
  //       name: 'lastName',
  //       type: ComponentType.INPUT,
  //       visibility: {
  //         disabled: {
  //           method({ watches }) {
  //             const [firstNameComponentState] = watches?.states ?? [];
  //             // console.log(firstNameComponentState);
  //             return !!firstNameComponentState.disabled;
  //           },
  //           watch: {
  //             values: 'object.firstName',
  //             states: 'object.__children.firstName.__state',
  //           },
  //         },
  //       },
  //     },
  //     {
  //       id: '4-3',
  //       name: 'fullName',
  //       type: ComponentType.INPUT,
  //       visibility: {
  //         disabled: {
  //           method: ({ watches }) => {
  //             const [firstName] = watches?.values ?? [];
  //             return firstName !== 'hung';
  //           },
  //           watch: {
  //             values: 'object.firstName',
  //           },
  //         },
  //       },
  //     },
  //   ],
  // },
  // {
  //   id: 'array',
  //   name: 'array',
  //   type: ComponentType.ARRAY_CONTAINER,
  //   components: [
  //     {
  //       id: '1',
  //       name: 'object',
  //       type: ComponentType.OBJECT_CONTAINER,
  //       components: [
  //         {
  //           id: 'secondArray',
  //           name: 'secondArray',
  //           type: ComponentType.ARRAY_CONTAINER,
  //           components: [
  //             {
  //               id: 'firstName',
  //               name: 'firstName',
  //               type: ComponentType.INPUT,
  //               // actions: {
  //               //   change(args) {
  //               //     console.log(args);
  //               //   },
  //               // },
  //             },
  //           ],
  //         },
  //         {
  //           id: 'button',
  //           name: 'button',
  //           children: 'Child button',
  //           type: ComponentType.BUTTON,
  //           // actions: {
  //           //   click(args) {
  //           //     const objectParent = args.control.getParents()[1].__children as {
  //           //       secondArray: ComponentInstance;
  //           //     };
  //           //     console.log(
  //           //       objectParent?.secondArray?.__control?.append?.({
  //           //         firstName: 'hung',
  //           //       })
  //           //     );
  //           //   },
  //           // },
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   id: 'button',
  //   name: 'button',
  //   children: 'Root Butotn',
  //   type: ComponentType.BUTTON,
  //   // actions: {
  //   //   click(args) {
  //   //     const arrayControl = args.control.getComponentInstances('array') as ComponentInstance;
  //   //     arrayControl?.__control?.append?.({
  //   //       object: {
  //   //         secondArray: [],
  //   //       },
  //   //     });
  //   //     console.log(arrayControl);
  //   //   },
  //   // },
  // },
];

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
  return <PageBuilder />;
}
