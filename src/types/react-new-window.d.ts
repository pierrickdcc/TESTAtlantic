declare module 'react-new-window' {
  import * as React from 'react';

  export interface WindowFeatures {
    width?: number;
    height?: number;
    left?: number;
    top?: number;
    location?: boolean;
    menubar?: boolean;
    resizable?: boolean;
    scrollbars?: boolean;
    status?: boolean;
    toolbar?: boolean;
    [key: string]: boolean | number | string | undefined;
  }

  export interface NewWindowProps {
    url?: string;
    name?: string;
    title?: string;
    features?: WindowFeatures;
    onUnload?: () => void;
    onBlock?: () => void;
    onOpen?: (window: Window) => void;
    center?: 'parent' | 'screen';
    copyStyles?: boolean;
    children?: React.ReactNode;
  }

  const NewWindow: React.ComponentType<NewWindowProps>;
  export default NewWindow;
}
