import { Button } from 'antd';
import { BaseComponentProps, ComponentConfig } from '../types';
import { useComponent } from '../FormBuilder';
export type ButtonComponentProps = BaseComponentProps<ComponentConfig>;
const ButtonComponent: React.FunctionComponent<ButtonComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const {
    component: { onClick },
    componentInstance: componentInstance,
  } = useComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  return (
    <Button
      css={componentConfig.css}
      disabled={componentInstance.__state.disabled}
      hidden={componentInstance.__state.hidden}
      onClick={onClick}>
      {componentConfig.children}
    </Button>
  );
};
export default ButtonComponent;
