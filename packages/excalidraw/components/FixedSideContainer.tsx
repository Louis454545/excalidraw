import React from "react";
import clsx from "clsx";

import "./FixedSideContainer.scss";

type FixedSideContainerProps = {
  children: React.ReactNode;
  side: "top" | "left" | "right";
  className?: string;
};

export const FixedSideContainer = ({
  children,
  side,
  className,
}: FixedSideContainerProps) => (
  <div
    className={clsx(
      "FixedSideContainer",
      `FixedSideContainer_side_${side}`,
      className,
    )}
  >
    {children}
  </div>
);
