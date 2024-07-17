import { Button } from 'antd';
import { BaseComponentProps, ComponentConfig } from '../types';
import { useUIComponent } from '../hooks';
export type ButtonComponentProps = BaseComponentProps<ComponentConfig>;
const ButtonComponent: React.FunctionComponent<ButtonComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index } = props;

  const { componentInstance: componentInstance } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
  });

  return (
    <Button disabled={componentInstance.__state.disabled} hidden={componentInstance.__state.hidden}>
      {componentConfig.children}
    </Button>
  );
};
export default ButtonComponent;
