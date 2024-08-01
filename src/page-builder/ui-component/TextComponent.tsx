import { useUIComponent } from '@/ui-builder/useUIComponent';
import { cn } from '@/utils/uiUtils';
import { BaseComponentProps } from '../types';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { usePageBuilderContext } from '../PageBuilder';
export type TextComponentProps = BaseComponentProps;
const TextComponent: React.FunctionComponent<TextComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = usePageBuilderContext();

  const { componentInstance } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
  });
  const {
    props: { variant = 'h1' },
  } = componentInstance;

  if (isBuildingMode) {
    return (
      <DragDropWrapper
        index={index}
        id={componentConfig.id}
        data={componentConfig}
        parentId={parentId}>
        <h1
          className={cn('scroll-m-20 text-4xl font-extrabold tracking-tight', {
            'text-5xl': variant === 'h1',
            'text-3xl': variant === 'h2',
            'text-xl': variant === 'h3',
            'text-lg': variant === 'h4',
          })}>
          {componentInstance.props?.label}
        </h1>
      </DragDropWrapper>
    );
  }

  return (
    <h1
      className={cn('scroll-m-20 text-4xl font-extrabold tracking-tight', {
        'text-5xl': variant === 'h1',
        'text-3xl': variant === 'h2',
        'text-xl': variant === 'h3',
        'text-lg': variant === 'h4',
      })}>
      {componentInstance.props?.label}
    </h1>
  );
};
export default TextComponent;
