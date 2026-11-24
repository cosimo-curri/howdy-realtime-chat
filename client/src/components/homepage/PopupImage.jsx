import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function PopupImage(props) {
    function applyProfileChange(userInfo, event) {
        sessionStorage.setItem("infoLoggedUser", JSON.stringify(userInfo));
        props.handleUpdateInfo();
        global.socketUser?.current?.emit("notifyProfilePictureChange", {
            newProfilePictureURL: userInfo.profilePictureURL,
        });
        props.handleImage(event);
    }

    async function handleRemove(event) {
        event.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/tokenApi/profile/deleteProfilePicture`, {
                method: "DELETE",
                headers: { token: sessionStorage.getItem("token") },
            });
            if (!response.ok) throw new Error("Profile update failed");
            const result = await response.json();
            if (result.message !== "DELETE_PROFILE_PICTURE_OK") throw new Error("Profile update failed");
            applyProfileChange(result.userInfo, event);
            toast.success("Profile photo removed", { position: "bottom-right" });
        } catch (_) {
            toast.error("Unable to remove the profile photo", { position: "bottom-right" });
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            const response = await fetch(`${API_BASE_URL}/tokenApi/file/uploadProfilePicture`, {
                method: "POST",
                headers: { token: sessionStorage.getItem("token") },
                body: formData,
            });
            if (!response.ok) throw new Error("Profile upload failed");
            const result = await response.json();
            if (result.message !== "UPLOAD_OK") throw new Error("Profile upload failed");
            applyProfileChange(result.userInfo, event);
            toast.success("Profile photo updated", { position: "bottom-right" });
        } catch (_) {
            toast.error("Unable to update the profile photo", { position: "bottom-right" });
        }
    }

    return (
        <div className="all-popup-container">
            <i onClick={props.handleImage} className="fa-regular fa-circle-xmark closeBtn"></i>
            <div className="pop-container">
                <p className="titleImageDownload">Change profile photo</p>
                <form action="#" id="formImgProfile" onSubmit={handleSubmit}>
                    <input type="file" accept=".jpeg, .jpg, .png, .webp" name="file" required />
                    <button className="button">Change</button>
                </form>
                <p className="pRemove" onClick={handleRemove}>or click here to remove</p>
            </div>
        </div>
    );
}

export default PopupImage;
