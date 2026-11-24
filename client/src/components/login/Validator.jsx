import Requirement from "./Requirement";

function Validator() {
    return (
        <div className="validator">
            <Requirement id="number" text="Number" />
            <Requirement id="capital" text="Upper Case" />
            <Requirement id="special-char" text="Special Character" />
            <Requirement id="more-than-8" text="More than 8 characters" />
        </div>
    )
}

export default Validator;