import { ComponentConfig, BaseComponentProps } from '../types';
import { ComponentItem, useArrayComponent } from '../FormBuilder';
import React from 'react';
import { css } from '@emotion/react';

export type ArrayComponentProps = BaseComponentProps<ComponentConfig>;

export const ArrayComponent: React.FunctionComponent<ArrayComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const innerComponentConfigs = componentConfig.innerComponents;

  const { fields } = useArrayComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  return (
    <div
      css={css`
        border: 1px solid red;
        padding: 8px;
        width: 100%;
      `}>
      <span>{componentConfig.name}</span>
      {fields?.map((field, idx) => (
        <React.Fragment key={field.id}>
          {innerComponentConfigs?.map((com) => (
            <ComponentItem
              key={`component-${field.id}-${com.id}`}
              componentConfig={com}
              parentPaths={parentPaths?.concat({
                name: componentConfig.name,
                index: idx,
              })}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
