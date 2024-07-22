import { Button } from '@/components/ui/button';
import { useUIComponent } from '@/ui-builder/useUIComponent';
import { BaseComponentProps } from '../types';
export type ButtonComponentProps = BaseComponentProps;
const ButtonComponent: React.FunctionComponent<ButtonComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { componentInstance: componentInstance } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  return (
    <Button disabled={componentInstance.__state.disabled} hidden={componentInstance.__state.hidden}>
      {componentConfig.children}
    </Button>
  );
};
export default ButtonComponent;
