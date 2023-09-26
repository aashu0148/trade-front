import React, { useState } from "react";

import InputControl from "Components/InputControl/InputControl";
import Button from "Components/Button/Button";

import { validateEmail } from "utils/util";

import styles from "./AuthPage.module.scss";
import { loginUser } from "apis/auth";

function AuthPage() {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    main: "",
  });
  const [submitButtonDisabled, setSubmitButtonDisabled] = useState(false);

  const validateForm = () => {
    const errors = {};

    if (!values.email) errors.email = "Please enter email";
    else if (!validateEmail(values.email)) errors.email = "Invalid email";

    if (!values.password) errors.password = "Please enter password";

    if (Object.keys(errors).length) {
      setErrors(errors);
      return false;
    } else {
      setErrors({});
      return true;
    }
  };

  const handleSubmission = async () => {
    if (!validateForm()) return;

    setSubmitButtonDisabled(true);
    const res = await loginUser(values);
    setSubmitButtonDisabled(false);
    if (!res?.data?.token) return;

    const token = res.data.token;
    localStorage.setItem("trade-token", token);

    window.location.replace("/");
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <p className={styles.heading}>Please Login to continue</p>
        <InputControl
          label="Email"
          placeholder="Enter email"
          value={values.email}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, email: event.target.value }))
          }
        />
        <InputControl
          label="Password"
          password
          placeholder="Enter password"
          value={values.password}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, password: event.target.value }))
          }
        />

        {errors.main ? <p className="error-msg">{errors.main}</p> : ""}

        <Button
          disabled={submitButtonDisabled}
          onClick={handleSubmission}
          useSpinnerWhenDisabled
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

export default AuthPage;
