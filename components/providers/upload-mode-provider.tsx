"use client";

import { createContext, useContext } from "react";

export type UploadMode = "uploadthing" | "local";

const UploadModeContext = createContext<UploadMode>("local");

export function UploadModeProvider({
  mode,
  children,
}: {
  mode: UploadMode;
  children: React.ReactNode;
}) {
  return <UploadModeContext.Provider value={mode}>{children}</UploadModeContext.Provider>;
}

export const useUploadMode = () => useContext(UploadModeContext);
