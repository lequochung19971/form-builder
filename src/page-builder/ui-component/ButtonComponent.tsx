import { Button } from '@/components/ui/button';
import { useUIComponent } from '@/ui-builder/useUIComponent';
import { BaseComponentProps } from '../types';
import { usePageBuilderContext } from '../PageBuilder';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
export type ButtonComponentProps = BaseComponentProps;
const ButtonComponent: React.FunctionComponent<ButtonComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;

  const { isBuildingMode } = usePageBuilderContext();

  const { actions, componentInstance } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
  });
  const {
    props: { type = 'button', disabled, loading },
  } = componentInstance;

  if (isBuildingMode) {
    return (
      <DragDropWrapper
        index={index}
        id={componentConfig.id}
        data={componentConfig}
        parentId={parentId}>
        <Button data-no-dnd onClick={actions.onClick}>
          {componentInstance.props?.label}
        </Button>
      </DragDropWrapper>
    );
  }

  return (
    <Button data-no-dnd type={type} onClick={actions.onClick} disabled={disabled || loading}>
      {componentInstance.props?.label}
    </Button>
  );
};
export default ButtonComponent;
