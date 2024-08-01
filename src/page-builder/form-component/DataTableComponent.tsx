import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import React from 'react';
import { BaseComponentProps } from '../types';
import { useArrayFieldComponent } from '@/ui-builder/useArrayFieldComponent';
import { ComponentItem } from '../PageBuilder';

export type ArrayComponentProps = BaseComponentProps;

export const DataTableComponent: React.FunctionComponent<ArrayComponentProps> = ({
  componentConfig,
  parentPaths,
}) => {
  const { fields, componentInstance } = useArrayFieldComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {componentConfig.components?.map((com) => (
            <TableHead key={com.id}>{com.props?.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field, fieldIndex) => (
          <TableRow key={field.id}>
            {componentConfig.components?.map((com, index) => (
              <TableCell key={com.id}>
                <ComponentItem
                  key={`${field.id}-${com.id}`}
                  componentConfig={com}
                  index={index}
                  parentId={componentConfig.id}
                  parentPaths={parentPaths?.concat({
                    id: componentConfig.id,
                    group: componentConfig.group,
                    fieldName: componentConfig.fieldName,
                    componentName: componentConfig.componentName,
                    index: fieldIndex,
                  })}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
