import logo from "../../imgs/logo.png";

function Header() {
    const infoLoggedUser = JSON.parse(sessionStorage.getItem("infoLoggedUser"));

    function handleToggle() {
        const sidebar = document.querySelector(".sidebar");
        const modeSwitch = document.querySelector(".toggle-switch");
        sidebar.classList.toggle("close");
        modeSwitch.classList.toggle("close");
    }

    function handleReloadPage() {
        window.location.reload();
    }

    return (
        <header>
            <div className="image-text">
                <span className="image">
                    <img src={logo} alt="logo" onClick={handleReloadPage} />
                </span>
                <div className="text header-text">
                    <span className="name">howdy?</span>
                    <span className="profession">{infoLoggedUser.username}</span>
                </div>
            </div>
            <i className="bx bx-chevron-right toggle" onClick={handleToggle}></i>
        </header>
    );
}

export default Header;