function Input(props) {
    return (
        <div className="infield">
            <input type={props.type} placeholder={props.placeholder} name={props.name} onChange={props.handle}/>
            <div className="label"></div>
        </div>
    );
}

export default Input;