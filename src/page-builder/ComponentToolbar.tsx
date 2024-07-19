import React, { PropsWithChildren, useState } from 'react';
import { Pen, Trash2 } from 'lucide-react';

export type ComponentToolbarProps = PropsWithChildren & {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  id: string;
};
export const ComponentToolbar: React.FunctionComponent<ComponentToolbarProps> = (props) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseOut={(e) => {
        e.stopPropagation();
        setIsHover(false);
      }}
      onMouseOver={(e) => {
        e.stopPropagation();
        setIsHover(true);
      }}>
      {isHover && (
        <div className="flex absolute top-0 right-0 space-x-1">
          <button
            data-no-dnd
            type="button"
            className="w-5 h-5 shadow-md rounded-sm flex justify-center items-center"
            onClick={() => props.onEdit?.(props.id)}>
            <Pen className="w-4 h-4" />
          </button>
          <button
            data-no-dnd
            type="button"
            className="w-5 h-5 shadow-md rounded-sm flex justify-center items-center"
            onClick={() => props.onDelete?.(props.id)}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {props.children}
    </div>
  );
};
