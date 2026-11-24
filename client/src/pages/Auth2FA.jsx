import { API_BASE_URL } from "../config";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Auth2FA.css";

function Auth2FA() {
    const [digits, setDigits] = useState(Array(6).fill(""));
    const fields = useRef([]);
    const navigate = useNavigate();
    const pending = useRef(false);

    useEffect(() => {
        sessionStorage.removeItem("password");
        sessionStorage.removeItem("dataAccess");
        fields.current[0]?.focus();
    }, []);
    const setDigit = (index, event) => {
        const input = event.target.value.replace(/\D/g, "").slice(-1);
        setDigits(previous => previous.map((value, i) => i === index ? input : value));
        if (input && index < 5) fields.current[index + 1]?.focus();
    };
    const handleKey = (index, event) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) fields.current[index - 1]?.focus();
    };
    const pinCode = digits.join("");
    useEffect(() => {
        if (pinCode.length !== 6 || pending.current) return;
        const challenge = sessionStorage.getItem("twoFactorChallenge");
        if (!challenge) { navigate("/"); return; }
        pending.current = true;
        const payload = { challenge, code2FA: pinCode };
        fetch(`${API_BASE_URL}/api/login`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        }).then(response => response.json()).then(data => {
            if (data.message !== "LOGIN_OK") throw new Error("Invalid or expired verification code");
            sessionStorage.setItem("infoLoggedUser", JSON.stringify(data.user));
            sessionStorage.setItem("token", data.token);
            sessionStorage.removeItem("twoFactorChallenge");
            navigate("/homepage");
        }).catch(() => {
            toast.error("Invalid or expired verification code");
            setDigits(Array(6).fill(""));
            fields.current[0]?.focus();
        }).finally(() => { pending.current = false; });
    }, [pinCode, navigate]);

    return (
        <div className="container-all-auth">
            <div className="container-auth">
                <p className="titleAuth">Two-Factor Authentication</p>
                <div className="inputs" aria-label="Six-digit verification code">
                    {digits.map((digit, index) => (
                        <div className="infield" key={index}>
                            <input ref={field => { fields.current[index] = field; }}
                                value={digit} onChange={event => setDigit(index, event)}
                                onKeyDown={event => handleKey(index, event)}
                                inputMode="numeric" pattern="[0-9]*" maxLength={1}
                                autoComplete={index === 0 ? "one-time-code" : "off"}
                                aria-label={`Digit ${index + 1}`} />
                            <div className="label" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default Auth2FA;
