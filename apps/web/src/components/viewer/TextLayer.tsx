import { forwardRef } from "react";

export const TextLayer = forwardRef<HTMLDivElement>(
  function TextLayer(_props, ref) {
    return (
      <div
        ref={ref}
        className="pdf-text-layer absolute inset-0 overflow-hidden opacity-20"
        style={{ lineHeight: 1 }}
      />
    );
  },
);
