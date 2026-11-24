import { API_BASE_URL } from "../../config";
import { useEffect } from "react";
import ItemLink from "./ItemLink";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Menu(props) {
    const navigate = useNavigate();

    function handleSearch() {
        const sidebar = document.querySelector(".sidebar");
        const modeSwitch = document.querySelector(".toggle-switch");
        const inputSearch = document.querySelector(".nav-text");
        const overSearch = document.querySelector(".search");
        const overNotify = document.querySelector(".notify");
        const overProfile = document.querySelector(".profile");
        const overSettings = document.querySelector(".settings");
        let checkOpen = false;

        inputSearch.focus();
        if (overNotify.classList.contains("open")) {
            overNotify.classList.toggle("open");
            checkOpen = true;
        }
        if (overProfile.classList.contains("open")) {
            checkOpen = true;
            overProfile.classList.toggle("open");
        }
        if (overSettings.classList.contains("open")) {
            checkOpen = true;
            overSettings.classList.toggle("open");
        }
        if ((sidebar.classList.contains("close"))) {
            sidebar.classList.toggle("close");
            modeSwitch.classList.toggle("close");
            if (!overSearch.classList.contains("open")) {
                if (checkOpen) {
                    const timeout = setTimeout(() => {
                        overSearch.classList.toggle("open");
                    }, 700);

                    return () => {
                        clearTimeout(timeout);
                    };
                }
                else {
                    overSearch.classList.toggle("open");
                }
            }
        }
        else {
            if (checkOpen) {
                const timeout = setTimeout(() => {
                    overSearch.classList.toggle("open");
                }, 700);

                return () => {
                    clearTimeout(timeout);
                };
            }
            else {
                overSearch.classList.toggle("open");
            }
        }
    }

    function handleHome() {
        const sidebar = document.querySelector(".sidebar");
        const modeSwitch = document.querySelector(".toggle-switch");
        const overSearch = document.querySelector(".search");
        const overNotify = document.querySelector(".notify");
        const overProfile = document.querySelector(".profile");
        const overSettings = document.querySelector(".settings");
        if (!(sidebar.classList.contains("close"))) {
            sidebar.classList.toggle("close");
            modeSwitch.classList.toggle("close");
        }
        if (overSearch.classList.contains("open")) {
            overSearch.classList.toggle("open");
        }
        if (overNotify.classList.contains("open")) {
            overNotify.classList.toggle("open");
        }
        if (overProfile.classList.contains("open")) {
            overProfile.classList.toggle("open");
        }
        if (overSettings.classList.contains("open")) {
            overSettings.classList.toggle("open");
        }
    }

    function handleToggle() {
        const body = document.querySelector("body");
        const modeText = document.querySelector(".mode-text");
        const infoLoggedUser = JSON.parse(sessionStorage.getItem("infoLoggedUser"));
        body.classList.toggle("dark");
        if (body.classList.contains("dark")) {
            modeText.innerHTML = "Dark Mode";
            infoLoggedUser.darkTheme = true;
            sessionStorage.setItem("infoLoggedUser", JSON.stringify(infoLoggedUser));
            props.handleColorTheme("dark");
        }
        else {
            props.handleColorTheme("light");
            modeText.innerHTML = "Light Mode";
            infoLoggedUser.darkTheme = false;
            sessionStorage.setItem("infoLoggedUser", JSON.stringify(infoLoggedUser));
        }
        fetch(`${API_BASE_URL}/tokenApi/profile/changeDarkTheme`, {
            method: "PUT",
            headers: new Headers({
                "Content-Type": "application/json",
                token: sessionStorage.getItem("token"),
            }),
            body: JSON.stringify({
                darkTheme: infoLoggedUser.darkTheme,
            }),
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
    }

    function handleNotify() {
        const overSearch = document.querySelector(".search");
        const overNotify = document.querySelector(".notify");
        const overProfile = document.querySelector(".profile");
        const overSettings = document.querySelector(".settings");
        let checkOpen = false;

        if (overSearch.classList.contains("open")) {
            overSearch.classList.toggle("open");
            checkOpen = true;
        }
        if (overProfile.classList.contains("open")) {
            overProfile.classList.toggle("open");
            checkOpen = true;
        }
        if (overSettings.classList.contains("open")) {
            overSettings.classList.toggle("open");
            checkOpen = true;
        }
        if (checkOpen) {
            const timeout = setTimeout(() => {
                overNotify.classList.toggle("open");
            }, 700);

            return () => {
                clearTimeout(timeout);
            };
        }
        else {
            overNotify.classList.toggle("open");
        }
    }

    function handleProfile() {
        const overSearch = document.querySelector(".search");
        const overNotify = document.querySelector(".notify");
        const overProfile = document.querySelector(".profile");
        const overSettings = document.querySelector(".settings");
        let checkOpen = false;

        if (overSearch.classList.contains("open")) {
            overSearch.classList.toggle("open");
            checkOpen = true;
        }
        if (overNotify.classList.contains("open")) {
            overNotify.classList.toggle("open");
            checkOpen = true;
        }
        if (overSettings.classList.contains("open")) {
            overSettings.classList.toggle("open");
            checkOpen = true;
        }
        if (checkOpen) {
            const timeout = setTimeout(() => {
                overProfile.classList.toggle("open");
            }, 700);

            return () => {
                clearTimeout(timeout);
            };
        }
        else {
            overProfile.classList.toggle("open");
        }
    }

    function handleSettings() {
        const overSearch = document.querySelector(".search");
        const overNotify = document.querySelector(".notify");
        const overProfile = document.querySelector(".profile");
        const overSettings = document.querySelector(".settings");
        let checkOpen = false;

        if (overSearch.classList.contains("open")) {
            overSearch.classList.toggle("open");
            checkOpen = true;
        }
        if (overNotify.classList.contains("open")) {
            overNotify.classList.toggle("open");
            checkOpen = true;
        }
        if (overProfile.classList.contains("open")) {
            overProfile.classList.toggle("open");
            checkOpen = true;
        }
        if (checkOpen) {
            const timeout = setTimeout(() => {
                overSettings.classList.toggle("open");
            }, 700);

            return () => {
                clearTimeout(timeout);
            };
        }
        else {
            overSettings.classList.toggle("open");
        }
    }

    useEffect(() => {
        const body = document.querySelector("body");
        const modeText = document.querySelector(".mode-text");
        const infoLoggedUser = JSON.parse(sessionStorage.getItem("infoLoggedUser"));
        if (infoLoggedUser.darkTheme) {
            modeText.innerHTML = "Dark Mode";
            body.classList.add("dark");
        }
        else {
            modeText.innerHTML = "Light Mode";
            body.classList.remove("dark");
        }
    }, []);

    return (
        <>
            <div className="menu-bar">
                <div className="menu">
                    <li className="search-box" onClick={handleSearch}>
                        <i className="bx bx-search icon"></i>
                        <input type="text" placeholder="Search" className="text nav-text" onChange={props.handleChangeSearch} />
                    </li>
                    <ul className="menu-links">
                        <ItemLink classBtn="home-btn" classIcon="bx bx-home-alt icon" text="Homepage" handle={handleHome} />
                        <ItemLink classBtn="notify-btn" classIcon="bx bx-bell icon" text="Notifications" handle={handleNotify} />
                        <ItemLink classBtn="profile-btn" classIcon="bx bx-user icon" text="Profile" handle={handleProfile} />
                        <ItemLink classBtn="settings-btn" classIcon="bx bxs-cog icon" text="Settings" handle={handleSettings} />
                    </ul>
                </div>
                <div className="bottom-content">
                    <ItemLink classBtn="" classIcon="bx bx-log-out-circle icon" text="Logout" handle={props.handleLogout} />
                    <li className="mode">
                        <div className="moon-sun">
                            <i className="bx bx-moon icon moon"></i>
                            <i className="bx bx-sun icon sun"></i>
                        </div>
                        <span className="mode-text text">Dark Mode</span>
                        <div className="toggle-switch close" onClick={handleToggle}>
                            <span className="switch"></span>
                        </div>
                    </li>
                </div>
            </div>
        </>
    );
}

export default Menu;