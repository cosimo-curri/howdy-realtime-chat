function SocialContainer() {
    const profileUser = JSON.parse(sessionStorage.getItem("profileUser"));


    function handleSocial(event, type) {
        event.preventDefault();
        if ("contacts" in (profileUser)) {
            switch(type) {
                case "instagram": window.open(profileUser.contacts.instagram); break;
                case "facebook": window.open(profileUser.contacts.facebook); break;
                case "linkedin": window.open(profileUser.contacts.linkedin); break;
            }
        }
    }

    return (
        <div className="social-container-user ">
            <div className="social-user facebook" onClick={(event) => handleSocial(event, "facebook")}>
                <i className='bx bxl-facebook-circle'></i>
            </div>
            <div className="social-user instagram" onClick={(event) => handleSocial(event, "instagram")}>
                <i className='bx bxl-instagram-alt'></i>
            </div>
            <div className="social-user linkedin" onClick={(event) => handleSocial(event, "linkedin")}>
                <i className='bx bxl-linkedin-square'></i>
            </div>
        </div>
    );
}

export default SocialContainer;