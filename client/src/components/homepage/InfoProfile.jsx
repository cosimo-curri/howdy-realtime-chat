import ModifyItem from "./ModifyItem";

function InfoProfile(props) {
    return (
        <>
            <div className="info-profile">
                <span>{props.textSpan}</span>
                <ModifyItem handle={props.handleChange} value={props.value1} placeholder={props.placeholder1} />
                <ModifyItem handle={props.handleChange} value={props.value2} placeholder={props.placeholder2} />
                <ModifyItem handle={props.handleChange} value={props.value3} placeholder={props.placeholder3} />
            </div>
        </>
    );
}

export default InfoProfile;