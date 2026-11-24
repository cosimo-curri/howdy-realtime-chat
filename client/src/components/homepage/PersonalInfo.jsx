function PersonalInfo() {
    return (
        <>
            <div className="info-profile">
                <span>Edit Personal Information</span>
                <div className="infield">
                    <input type="date" className="modify-user" />
                    <div className="label"></div>
                </div>
                <div className="containers-radio">
                    <div className="radio-container" id="undefined">
                        <input type="radio" id="gender" name="gender" value="undefined"/>
                        <span>Undefined</span>
                    </div>
                    <div className="radio-container" id="male">
                        <input type="radio" id="gender" name="gender" value="male" />
                        <span>Male</span>
                    </div>
                    <div className="radio-container" id="female">
                        <input type="radio" id="gender" name="gender" value="female" />
                        <span>Female</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PersonalInfo;