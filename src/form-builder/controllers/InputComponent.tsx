import { css } from '@emotion/react';
import { Input } from 'antd';
import { BaseComponentProps, ComponentConfig } from '../types';
import { useComponent } from '../FormBuilder';

export type InputComponentProps = BaseComponentProps<ComponentConfig>;

const InputComponent: React.FunctionComponent<InputComponentProps> = (props) => {
  const { componentConfig, parentPaths } = props;

  const {
    component: { onBlur, onChange, onClick, value },
    componentInstance: componentInstance,
  } = useComponent({
    componentConfig,
    parentPaths,
  });

  const { error } = componentInstance.__state;

  return (
    <div css={componentConfig.css}>
      {componentConfig.label && (
        <label
          css={css`
            margin-bottom: 0.5rem;
          `}>
          {componentConfig.label}
        </label>
      )}
      <Input
        value={value}
        disabled={componentInstance.__state.disabled}
        hidden={componentInstance.__state.hidden}
        onChange={onChange}
        onBlur={onBlur}
        onClick={onClick}
      />
      {error?.message && (
        <span
          css={css`
            color: red;
            padding-top: 8px;
            font-size: 12px;
          `}>
          {error?.message}
        </span>
      )}
    </div>
  );
};
export default InputComponent;
