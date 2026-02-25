"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INVENTORY_WIDTH_DEFAULT, INVENTORY_WIDTH_MAX, INVENTORY_WIDTH_MIN } from "@/lib/bookConstants";

export function useInventoryResize(initialWidth = INVENTORY_WIDTH_DEFAULT) {
  const [inventoryWidth, setInventoryWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(initialWidth);

  useEffect(() => {
    if (!isResizing) return;
    function onMove(e: MouseEvent) {
      const delta = e.clientX - resizeStartX.current;
      setInventoryWidth((w) =>
        Math.min(INVENTORY_WIDTH_MAX, Math.max(INVENTORY_WIDTH_MIN, resizeStartWidth.current + delta))
      );
    }
    function onUp() {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = inventoryWidth;
    setIsResizing(true);
  }, [inventoryWidth]);

  return { inventoryWidth, onResizeStart };
}
