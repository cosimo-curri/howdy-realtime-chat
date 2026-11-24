import { API_BASE_URL } from "../config";
import Login from "../components/login/Login";
import { useEffect, useState } from "react";
import React from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import "../styles/Login.css";

function AccessLogin(props) {
    const [dataAccess, setDataAccess] = useState("");
    const [passwordSignin, setPasswordSigin] = useState("");
    const [passwordSignup, setPasswordSignup] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const navigate = useNavigate();    

    useEffect(() => {
        global.socket?.current?.disconnect();
        global.socketUser?.current?.disconnect();
        // Clear any obsolete credentials left by an earlier login flow.
        sessionStorage.removeItem("password");
        sessionStorage.removeItem("dataAccess");
    }, []);

    useEffect(() => {
        if (passwordSignup.match(/[A-Z]/) != null) {
            valid('capital', 'fa-check', 'fa-times');
        }
        else {
            invalid('capital', 'fa-check', 'fa-times');
        }

        if (passwordSignup.match(/[0-9]/) != null) {
            valid('number', 'fa-check', 'fa-times');
        }
        else {
            invalid('number', 'fa-check', 'fa-times');
        }

        if (passwordSignup.match(/[!@#$%^&*]/) != null) {
            valid('special-char', 'fa-check', 'fa-times');
        }
        else {
            invalid('special-char', 'fa-check', 'fa-times');
        }

        if (passwordSignup.length >= 8) {
            valid('more-than-8', 'fa-check', 'fa-times');
        }
        else {
            invalid('more-than-8', 'fa-check', 'fa-times');
        }
    }, [passwordSignup]);

    useEffect(() => {
        const handleGoogleMessage = (event) => {
            if (event.origin !== new URL(API_BASE_URL).origin || !event.data || typeof event.data !== "object") return;
            if (event.data.message === "LOGIN_GOOGLE_OK" && event.data.user && event.data.token) {
                sessionStorage.setItem("infoLoggedUser", JSON.stringify(event.data.user));
                sessionStorage.setItem("token", event.data.token);
                props.handleColorTheme(event.data.user.darkTheme ? "dark" : "light");
                navigate("/homepage");
            } else {
                toast.error("Google Authentication Error", { position: "bottom-right" });
            }
        };
        window.addEventListener("message", handleGoogleMessage);
        return () => window.removeEventListener("message", handleGoogleMessage);
    }, [navigate, props.handleColorTheme]);

    function valid(item, validIcon, invalidIcon) {
        const text = document.querySelector(`#${item}`);
        if (!text) return;
        text.style.opacity = "1";
        const validIcons = document.querySelector(`#${item} .${validIcon}`);
        if (validIcons) validIcons.style.opacity = '1';
        const invalidIcons = document.querySelector(`#${item} .${invalidIcon}`);
        if (invalidIcons) invalidIcons.style.opacity = "0";
    }

    function invalid(item, validIcon, invalidIcon) {
        const text = document.querySelector(`#${item}`);
        if (!text) return;
        text.style.opacity = "0.5";
        const validIcons = document.querySelector(`#${item} .${validIcon}`);
        if (validIcons) validIcons.style.opacity = '0';
        const invalidIcons = document.querySelector(`#${item} .${invalidIcon}`);
        if (invalidIcons) invalidIcons.style.opacity = "1";
    }

    function handleDataAccess(event) {
        setDataAccess(event.target.value);
    };

    function handlePasswordSignin(event) {
        setPasswordSigin(event.target.value);
    };

    function handlePasswordSignup(event) {
        setPasswordSignup(event.target.value);
    };

    function handleFirstName(event) {
        setFirstName(event.target.value);
    };

    function handleLastName(event) {
        setLastName(event.target.value);
    };

    function handleUsername(event) {
        setUsername(event.target.value);
    };

    function handleEmail(event) {
        setEmail(event.target.value);
    };

    function handleClickSignUp(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/api/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                username: username,
                email: email,
                password: passwordSignup,
            })
        })
            .then((res) => {
                if (!res.ok) throw new Error("Signup request failed");
                return res.json();
            })
            .then((obj) => {
                if (obj.message === "EMAIL_SEND_OK") {
                    toast.info('Email sent, check your mailbox', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "EMAIL_SEND_ERROR") {
                    toast.info('Server connection error', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "NOT_AN_EMAIL") {
                    toast.error('Unrecognized email', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "WEAK_PASSWORD") {
                    toast.warning('Weak password', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "UserExistsError") {
                    toast.error('Username already in use', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "MongoServerError") {
                    toast.error('Email already in use', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "ValidationError") {
                    toast.warning('Complete all data', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
            })
            .catch(() => toast.error("Unable to connect to the server", { position: "bottom-right" }));
    };

    async function handleClickSignIn(event) {
        event.preventDefault();
        const identifier = dataAccess.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            ? { email: dataAccess } : { username: dataAccess };
        const credentials = { ...identifier, password: passwordSignin };

        try {
            const factorResponse = await fetch(`${API_BASE_URL}/api/isUserAuth2FA`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials)
            });
            if (!factorResponse.ok) throw new Error("Authentication request failed");
            const factor = await factorResponse.json();
            if (factor.message === "AUTH_2FA_YES") {
                if (!factor.challenge) throw new Error("Missing authentication challenge");
                sessionStorage.setItem("twoFactorChallenge", factor.challenge);
                navigate("/auth2FA");
                return;
            }
            if (factor.message === "USER_NOT_FOUND") {
                toast.error("User not found", { position: "bottom-right" });
                return;
            }
            if (factor.message !== "AUTH_2FA_NO") {
                toast.error("Incorrect credentials", { position: "bottom-right" });
                return;
            }

            const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials)
            });
            if (!loginResponse.ok) throw new Error("Login request failed");
            const login = await loginResponse.json();
            if (login.message === "LOGIN_OK") {
                sessionStorage.setItem("infoLoggedUser", JSON.stringify(login.user));
                sessionStorage.setItem("token", login.token);
                props.handleColorTheme(login.user.darkTheme ? "dark" : "light");
                navigate("/homepage");
            } else if (login.message === "LOGIN_ERROR") {
                toast.error("Incorrect credentials", { position: "bottom-right" });
            } else {
                toast.error("Unverified user, check your email", { position: "bottom-right" });
            }
        } catch (_) {
            toast.error("Unable to connect to the server", { position: "bottom-right" });
        }
    }

    function handleForgot(event) {
        event.preventDefault();
        const timeout = setTimeout(() => {
            navigate("/forgot");
        }, 500);

        return () => {
            clearTimeout(timeout);
        };
    };

    const handleClickGoogle = async () => {
        const googleAuthLogin = `${API_BASE_URL}/auth/google`;
        window.open(
            googleAuthLogin,
            "_blank",
            "width=500, height=600"
        );
    };

    return (
        <>
            <Login
                handleDataAccess={handleDataAccess}
                handlePasswordSignin={handlePasswordSignin}
                handlePasswordSignup={handlePasswordSignup}
                handleFirstName={handleFirstName}
                handleLastName={handleLastName}
                handleUsername={handleUsername}
                handleEmail={handleEmail}
                handleClickGoogle={handleClickGoogle}
                handleClickSignIn={handleClickSignIn}
                handleClickSignUp={handleClickSignUp}
                handleForgot={handleForgot}
            />
        </>
    )
}

export default AccessLogin;