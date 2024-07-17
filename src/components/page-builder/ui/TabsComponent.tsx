import { ComponentConfig, BaseComponentProps, ComponentInstance } from '../types';
import { ComponentItem, useFormBuilderContext } from '../PageBuilder';
import React, { forwardRef, useMemo } from 'react';
import { css } from '@emotion/react';
import { Label } from '@/components/ui/label';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/uiUtils';
import { useDroppable } from '@dnd-kit/core';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { Button } from '@/components/ui/button';
import { DropHerePlaceholder } from '../DropHerePlaceholder';
import { useUIComponent } from '../hooks';

export type TabsComponentProps = BaseComponentProps<ComponentConfig>;

export const TabsComponent: React.FunctionComponent<TabsComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = useFormBuilderContext();

  useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
  });

  const tabsComponent = () => (
    <div className="w-full">
      <Label>{componentConfig.name}</Label>
      <Tabs
        defaultValue={componentConfig?.components?.[0].id}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}>
        <TabsList
          data-no-dnd
          className="flex w-fit"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}>
          {componentConfig?.components?.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}>
              {tab.componentName}
            </TabsTrigger>
          ))}
        </TabsList>
        {componentConfig?.components?.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="border rounded-md p-4">
            {!tab?.components?.length && isBuildingMode && (
              <DropHerePlaceholder componentConfig={tab} parentId={tab.id} />
            )}
            {tab?.components?.map((com, index) => (
              <ComponentItem
                key={com.id}
                componentConfig={com}
                parentPaths={parentPaths?.concat([
                  {
                    id: componentConfig.id,
                    type: componentConfig.type,
                    componentName: componentConfig.componentName,
                  },
                  {
                    id: tab.id,
                    type: tab.type,
                    componentName: tab.componentName,
                  },
                ])}
                parentId={tab.id}
                index={index}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  if (isBuildingMode) {
    return (
      <DragDropWrapper
        index={index}
        id={componentConfig.id}
        data={componentConfig}
        parentId={parentId}>
        {tabsComponent()}
      </DragDropWrapper>
    );
  }

  return tabsComponent();
};
