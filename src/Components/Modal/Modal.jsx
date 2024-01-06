import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "react-feather";

import { generateUniqueString } from "utils/util";

import styles from "./Modal.module.scss";

function Modal({
  className,
  title,
  onClose,
  doNotAnimate,
  noTopPadding,
  styleToInner,
  hideCloseButton = false,
  closeOnBlur = true,
  fullScreenInMobile = false,
  preventUrlChange = false,
  preventPortal = false,
  ...props
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef();
  const innerRef = useRef();
  const isMobileView = window.outerWidth < 768;

  const [lastLocation, setLastLocation] = useState("");

  const handleCloseModal = () => {
    if (!onClose) return;
    onClose();

    if (!location.search?.includes("modal") || preventUrlChange) return;

    navigate(-1);
  };

  const handleContainerClick = (event) => {
    const isClickedInsideContainer = containerRef.current.contains(
      event.target
    );
    if (!isClickedInsideContainer) return;
    const isClickedInsideInner = innerRef.current.contains(event.target);

    if (isClickedInsideInner) return;

    handleCloseModal();
    event.stopPropagation();
  };

  const handleURLParamsOnMount = () => {
    const location = window.location;
    const params = new URLSearchParams(location.search);

    if (
      preventUrlChange ||
      (location.search.includes("modal") && location.search.includes("modal2"))
    )
      return;

    if (
      location.search?.includes("modal") &&
      !location.search.includes("modal2")
    )
      params.append("modal2", "true");
    else params.append("modal", "true");

    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  const handleLocationChange = () => {
    const currLocation = location.pathname + location.search;

    if (!lastLocation || lastLocation == currLocation) {
      setLastLocation(currLocation);
      return;
    }
    setLastLocation(currLocation);

    const params = new URLSearchParams(location.search);
    if (!params.get("modal") && onClose) handleCloseModal();
  };

  useEffect(() => {
    handleLocationChange();
  }, [location]);

  useEffect(() => {
    if (isMobileView) {
      document.body.style.overflowY = "hidden";
    }
    handleURLParamsOnMount();

    const isHidden = document.body.style.overflowY === "hidden";
    if (!isHidden) document.body.style.overflowY = "hidden";

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  const modal = isMobileView ? (
    <div
      ref={containerRef}
      className={`${styles.mobileContainer} ${
        title || noTopPadding ? styles.modalWithTitle : ""
      } ${fullScreenInMobile ? styles.fullScreenMobile : ""} ${
        className || ""
      }`}
      onClick={handleContainerClick}
      style={{ zIndex: +props.zIndex || "" }}
    >
      <div
        ref={innerRef}
        className={`${styles.inner} custom-scroll`}
        style={styleToInner}
      >
        {title && (
          <div className={styles.modalTitle}>
            <div className={styles.heading}>{title}</div>
            {onClose && <X onClick={handleCloseModal} />}
          </div>
        )}
        {props.children}

        {/* {fullScreenInMobile && (
          <div className={styles.controls}>
            <div
              className={`icon ${styles.icon}`}
              onClick={() => (onClose ? handleCloseModal() : "")}
            >
              <ArrowLeft />
            </div>
          </div>
        )} */}
      </div>
    </div>
  ) : (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ""}`}
      onClick={handleContainerClick}
    >
      <div
        ref={innerRef}
        className={`${styles.inner} ${
          doNotAnimate ? styles.preventAnimation : ""
        }`}
        style={styleToInner}
      >
        {onClose && !hideCloseButton ? (
          <div
            className={`icon ${styles.close}`}
            onClick={() => (onClose ? handleCloseModal() : "")}
          >
            <X />
          </div>
        ) : (
          ""
        )}
        {props.children}
      </div>
    </div>
  );

  return preventPortal ? modal : ReactDOM.createPortal(modal, document.body);
}

export default Modal;
