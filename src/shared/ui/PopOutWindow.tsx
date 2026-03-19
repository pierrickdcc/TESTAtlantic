import React, { useEffect, useState } from 'react';
import NewWindow from 'react-new-window';
import { useTheme } from 'next-themes';

import { PortalContext } from '@/shared/contexts/PortalContext';

interface PopOutWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export const PopOutWindow: React.FC<PopOutWindowProps> = ({
  title,
  onClose,
  children,
  width = 600,
  height = 800,
}) => {
  const { theme } = useTheme();
  const [popWindow, setPopWindow] = useState<Window | null>(null);

  const handleOpen = (openedWindow: Window) => {
    setPopWindow(openedWindow);
    openedWindow.document.title = title;

    openedWindow.document.body.style.margin = '0';
    openedWindow.document.body.style.padding = '0';
    openedWindow.document.documentElement.style.width = '100%';
    openedWindow.document.documentElement.style.height = '100%';
    openedWindow.document.body.style.width = '100%';
    openedWindow.document.body.style.height = '100%';
    openedWindow.document.body.style.overflow = 'hidden';
  };

  useEffect(() => {
    if (popWindow) {
      if (theme === 'dark') {
        popWindow.document.documentElement.classList.add('dark');
        popWindow.document.body.style.backgroundColor = '#030509'; // bg-deep-space
      } else {
        popWindow.document.documentElement.classList.remove('dark');
        popWindow.document.body.style.backgroundColor = '#f4f4f5'; // bg-zinc-50
      }
    }
  }, [theme, popWindow]);

  return (
    <NewWindow
      title={title}
      onUnload={onClose}
      onOpen={handleOpen}
      features={{
        width,
        height,
        menubar: false,
        toolbar: false,
        location: false,
        status: false,
      }}
      copyStyles={true}
    >
      <PortalContext.Provider value={popWindow ? popWindow.document.body : null}>
        <div className="w-[100vw] h-[100vh] bg-background dark:bg-deep-space text-foreground antialiased overflow-hidden flex flex-col m-0 p-0 absolute inset-0">
          {children}
        </div>
      </PortalContext.Provider>
    </NewWindow>
  );
};
