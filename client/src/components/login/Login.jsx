import Input from "./Input";
import Overlay from "./Overlay";

function Login(props) {

    function handleChangePage(event) {
        const container = document.querySelector("#container");
        container.classList.toggle("right-panel-active");
        event.target.classList.remove("btnScaled");
        window.requestAnimationFrame(() => {
            event.target.classList.add("btnScaled");
        });
    }

    return (
        <div className="container-all-login">

            <div className="container" id="container">
                <div className="form-container sign-up-container">
                    <form>
                        <h1>Create Account</h1>
                        <Input type="text" placeholder="First Name" name="firstName" handle={props.handleFirstName} />
                        <Input type="text" placeholder="Last Name" name="lastName" handle={props.handleLastName} />
                        <Input type="text" placeholder="Username" name="username" handle={props.handleUsername} />
                        <Input type="email" placeholder="Email" name="email" handle={props.handleEmail} />
                        <Input type="password" placeholder="Password" name="password" handle={props.handlePasswordSignup} />
                        <button onClick={props.handleClickSignUp}>Sign Up</button>
                    </form>
                </div>
                <div className="form-container sign-in-container">
                    <form>
                        <h1>Login Account</h1>
                        <div className="social-container">
                            <a className="social" onClick={props.handleClickGoogle}><i className="fab fa-google-plus-g"></i></a>
                        </div>
                        <span>or use your account</span>
                        <Input type="text" placeholder="Email or Username" name="data_access" handle={props.handleDataAccess} />
                        <Input type="password" placeholder="Password" name="password" handle={props.handlePasswordSignin} />
                        <a className="forgot" onClick={props.handleForgot}>Forgot your password?</a>
                        <button onClick={props.handleClickSignIn}>Sign In</button>
                    </form>
                </div>
                <div className="overlay-container" id="overlayCon">
                    <div className="overlay">
                        <Overlay className="overlay-panel overlay-left" desc="Enter your personal data to register or login on the site" btn="Sign In" handle={handleChangePage} />
                        <Overlay className="overlay-panel overlay-right" desc="Enter your personal data to access or register on the site" btn="Sign Up" handle={handleChangePage} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;