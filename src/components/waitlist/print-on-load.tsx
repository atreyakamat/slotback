"use client";

import { useEffect } from "react";

export function PrintOnLoad() {
  useEffect(() => {
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
