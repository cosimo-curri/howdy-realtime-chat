import { API_BASE_URL } from "../config";
import { useEffect, useState } from "react";
import "../styles/ChangePassword.css";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Validator from "../components/login/Validator";

function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        global.socket?.current?.disconnect();
        global.socketUser?.current?.disconnect();
    }, []);

    useEffect(() => {
        if (newPassword.match(/[A-Z]/) != null) {
            valid('capital', 'fa-check', 'fa-times');
        }
        else {
            invalid('capital', 'fa-check', 'fa-times');
        }

        if (newPassword.match(/[0-9]/) != null) {
            valid('number', 'fa-check', 'fa-times');
        }
        else {
            invalid('number', 'fa-check', 'fa-times');
        }

        if (newPassword.match(/[!@#$%^&*]/) != null) {
            valid('special-char', 'fa-check', 'fa-times');
        }
        else {
            invalid('special-char', 'fa-check', 'fa-times');
        }

        if (newPassword.length >= 8) {
            valid('more-than-8', 'fa-check', 'fa-times');
        }
        else {
            invalid('more-than-8', 'fa-check', 'fa-times');
        }
    }, [newPassword]);

    function handlePswCurrent(event) {
        setCurrentPassword(event.target.value);
    }

    function handlePsw(event) {
        setNewPassword(event.target.value);
    }

    function handlePswConfirm(event) {
        setConfirmPassword(event.target.value);
    }

    async function handleChange(event) {
        event.preventDefault();
        if (isSubmitting) return;

        if (newPassword !== confirmPassword) {
            toast.warn('Passwords do not match', { position: 'bottom-right' });
            return;
        }
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.warn('Complete all password fields', { position: 'bottom-right' });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/tokenApi/profile/changePassword`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    token: sessionStorage.getItem("token"),
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword1: newPassword,
                    newPassword2: confirmPassword,
                }),
            });
            if (!response.ok) throw new Error(`Password change failed: HTTP ${response.status}`);

            const result = await response.json();
            // Validation middleware returns an array; other handlers return an object.
            const message = Array.isArray(result) ? result[0]?.message : result?.message;
            if (message === "LOGOUT_OK") {
                sessionStorage.clear();
                navigate("/");
            } else if (message === "CURRENT_PASSWORD_ERROR") {
                toast.error('Incorrect current password', { position: 'bottom-right' });
            } else if (message === "WEAK_PASSWORD") {
                toast.warn('Weak password', { position: 'bottom-right' });
            } else if (message === "USER_ID_NOT_PROVIDED") {
                toast.warn('An error has occurred, try later', { position: 'bottom-right' });
            } else {
                toast.error('Unable to change password. Please try again', { position: 'bottom-right' });
            }
        } catch (_) {
            toast.error('Unable to change password. Please try again', { position: 'bottom-right' });
        } finally {
            setIsSubmitting(false);
        }
    }

    function valid(item, validIcon, invalidIcon) {
        const text = document.querySelector(`#${item}`);
        text.style.opacity = "1";
        const validIcons = document.querySelector(`#${item} .${validIcon}`);
        validIcons.style.opacity = '1';
        const invalidIcons = document.querySelector(`#${item} .${invalidIcon}`);
        invalidIcons.style.opacity = "0";
    }

    function invalid(item, validIcon, invalidIcon) {
        const text = document.querySelector(`#${item}`);
        text.style.opacity = "0.5";
        const validIcons = document.querySelector(`#${item} .${validIcon}`);
        validIcons.style.opacity = '0';
        const invalidIcons = document.querySelector(`#${item} .${invalidIcon}`);
        invalidIcons.style.opacity = "1";
    }

    return (
        <>
            <div className="container-all">
                <div className="container-forgot">
                    <h1>Restore Password</h1>
                    <form id="changePasswordForm" onSubmit={handleChange}>
                        <div className="infield">
                            <input type="password" name="currentPassword" placeholder="Current Password" onChange={handlePswCurrent} />
                            <div className="label"></div>
                        </div>
                        <div className="infield">
                            <input type="password" name="newPassword1" placeholder="Password" onChange={handlePsw} />
                            <div className="label"></div>
                        </div>
                        <div className="infield">
                            <input type="password" name="newPassword2" placeholder="Confirm Password" onChange={handlePswConfirm} />
                            <div className="label"></div>
                        </div>
                        <Validator />
                        <button type="submit" className="btn-forgot" disabled={isSubmitting}>Change</button>
                    </form>
                </div>
            </div>

        </>
    )
}

export default ChangePassword;