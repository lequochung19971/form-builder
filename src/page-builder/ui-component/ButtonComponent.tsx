import { Button } from '@/components/ui/button';
import { useUIComponent } from '@/ui-builder/useUIComponent';
import { BaseComponentProps } from '../types';
import { usePageBuilderContext } from '../PageBuilder';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
export type ButtonComponentProps = BaseComponentProps;
const ButtonComponent: React.FunctionComponent<ButtonComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;

  const { isBuildingMode } = usePageBuilderContext();

  const { actions } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  if (isBuildingMode) {
    return (
      <DragDropWrapper
        index={index}
        id={componentConfig.id}
        data={componentConfig}
        parentId={parentId}>
        <Button data-no-dnd onClick={actions.onClick}>
          {componentConfig.props?.label}
        </Button>
      </DragDropWrapper>
    );
  }

  return (
    <Button data-no-dnd onClick={actions.onClick}>
      {componentConfig.props?.label}
    </Button>
  );
};
export default ButtonComponent;
