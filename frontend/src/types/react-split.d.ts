declare module 'react-split' {
  import { ComponentType, HTMLAttributes } from 'react';

  export interface SplitProps extends HTMLAttributes<HTMLDivElement> {
    sizes?: number[];
    minSize?: number | number[];
    maxSize?: number | number[];
    expandToMin?: boolean;
    gutterSize?: number;
    gutterAlign?: string;
    snapOffset?: number;
    dragInterval?: number;
    direction?: 'horizontal' | 'vertical';
    cursor?: string;
    gutter?: (index: number, direction: string) => HTMLElement;
    elementStyle?: (dimension: number, elementIndex: number, gutterSize: number) => Object;
    gutterStyle?: (dimension: number, gutterIndex: number) => Object;
    onDrag?: (sizes: number[]) => void;
    onDragStart?: (sizes: number[]) => void;
    onDragEnd?: (sizes: number[]) => void;
  }

  declare const Split: ComponentType<SplitProps>;
  export default Split;
} 