import React, { useEffect } from "react";
import { X } from "react-feather";

import styles from "./Backdrop.module.scss";

function Backdrop({
  outerClassName,
  children,
  onClose,
  startFromLeft,
  className,
  showCloseBtn = false,
}) {
  useEffect(() => {
    const isHidden = document.body.style.overflowY === "hidden";
    if (!isHidden) document.body.style.overflowY = "hidden";

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  return (
    <div
      onClick={() => (onClose ? onClose() : "")}
      className={`${styles.backdrop} ${outerClassName || ""} ${
        startFromLeft ? styles.backdropLeft : ""
      }`}
    >
      <div
        className={`${styles.inner} ${className || ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        {showCloseBtn && (
          <div
            className={styles.close}
            onClick={() => (onClose ? onClose() : "")}
          >
            <div className="icon">
              <X />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Backdrop;
