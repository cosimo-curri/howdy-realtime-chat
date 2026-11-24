import { API_BASE_URL } from "../config";
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import "../styles/Forgot.css";

function Forgot() {
    const [showForgot, setShowForgot] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setShowForgot(true);
    }, []);

    function handleBackLogin() {
        setShowForgot(false);
        const timeout = setTimeout(() => {
            navigate('/login');
        }, 500);

        return () => {
            clearTimeout(timeout);
        };
    };

    function handleMail(event) {
        setEmail(event.target.value)
    };

    async function handleRecover(event) {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/managePassword/requestRestorePassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) throw new Error(`Password recovery failed: HTTP ${response.status}`);

            const result = await response.json();
            if (result?.message === "EMAIL_SEND_OK") {
                toast.info('Email sent, check your mailbox', { position: 'bottom-right' });
            } else if (result?.message === "USER_NOT_FOUND") {
                toast.error('Unregistered email', { position: 'bottom-right' });
            } else {
                toast.error('Unable to request a password reset. Please try again', { position: 'bottom-right' });
            }
        } catch (_) {
            toast.error('Unable to request a password reset. Please try again', { position: 'bottom-right' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <div className="container-all-forgot">
                <div className="container-forgot">
                    <h1>Forgot Password</h1>
                    <span className="span-forgot">enter your email address</span>
                    <div className="infield">
                        <input type="email" placeholder="Email" name="email" onChange={handleMail} />
                        <div className="label"></div>
                    </div>
                    <a className="forgot" onClick={handleBackLogin}>Back to Login</a>
                    <button className="btn-forgot" onClick={handleRecover} disabled={isSubmitting}>Reset</button>
                </div>
            </div>
        
        </>

    );
}

export default Forgot;