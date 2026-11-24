const urlParams = new URLSearchParams(window.location.search);

const changePasswordForm = document.getElementById("changePasswordForm");

changePasswordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const password1 = formData.get("newPassword1");
    const password2 = formData.get("newPassword2");

    //I CHECK THE PASSWORDS HERE AND SERVER-SIDE
    if(password1 === password2) {
        const changePasswordToken = urlParams.get("changePasswordToken");

        fetch("/api/managePassword/restorePassword", {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                changePasswordToken: changePasswordToken,
                password1: password1,
                password2: password2
            })
        })
        .then(res => res.json())
        .then(obj => {
            if(obj.message === "RESTORE_PASSWORD_ERROR")
                location.href = "error.html";
            else if(obj.message === "RESTORE_PASSWORD_OK")
                location.href = "/restore_password_confirm.html";
            else {
                if(Array.isArray(obj)) {
                    const error = obj[0].message;

                    if(error === "WEAK_PASSWORD") {
                        alert("The password is too weak.");
                        location.reload();
                    }
                }
            }
        })
        .catch(() => {
            alert("An error occurred.");
            location.reload();
        });
    } else {
        alert("Passwords don't match.");
    }
});