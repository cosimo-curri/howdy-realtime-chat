import Validator from "./Validator";
import logo from "../../imgs/logo.png";


function Overlay(props) {
    return (
        <div className={props.className}>
            <div className="title">
                <img src={logo} alt="photo"></img>
                <h1>howdy?</h1>
            </div>
            <p>{props.desc}</p>
            <button onClick={props.handle}>{props.btn}</button>
            {(props.className === "overlay-panel overlay-left") ? <Validator /> : null}
        </div>
    );
}

export default Overlay;