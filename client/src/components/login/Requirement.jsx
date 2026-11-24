function Requirement(props) {
    return (
        <p id={props.id} className="pValidator">
            <i className="fas fa-times"></i>
            <i className="fas fa-check"></i>
            <span className="spanValidator">{props.text}</span>
        </p>
    );
}

export default Requirement;