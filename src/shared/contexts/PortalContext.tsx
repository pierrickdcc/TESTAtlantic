import React, { createContext, useContext } from 'react';

export const PortalContext = createContext<HTMLElement | null>(null);

export const usePortalContainer = () => useContext(PortalContext);
