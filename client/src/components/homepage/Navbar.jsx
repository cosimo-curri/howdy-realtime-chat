import Header from "./Header";
import Menu from "./Menu";

function Navbar(props) {
    return (
        <nav className="sidebar close">
            <Header />
            <Menu handleLogout={props.handleLogout} handleColorTheme={props.handleColorTheme} handleChangeSearch={props.handleChangeSearch}/>
        </nav>
    );
}

export default Navbar;