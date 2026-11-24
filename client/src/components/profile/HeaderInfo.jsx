import { useEffect, useState } from "react";

function HeaderInfo(props) {
    const [birthday, setBirthday] = useState("");
    const [eta, setEta] = useState(null)

    useEffect(() => {
        if ("birthday" in (props.profileUser)) {
            setBirthday(props.profileUser.birthday.substring(0, 10));

            const dataDiNascita = new Date(props.profileUser.birthday.substring(0, 10));
            const dataAttuale = new Date();
            const differenzaAnni = dataAttuale.getFullYear() - dataDiNascita.getFullYear();
            const compleannoPassato = (dataAttuale.getMonth() > dataDiNascita.getMonth()) ||
                (dataAttuale.getMonth() === dataDiNascita.getMonth() && dataAttuale.getDate() >= dataDiNascita.getDate());

            setEta(compleannoPassato ? differenzaAnni : differenzaAnni - 1);

        }
    }, []);

    return (
        <>
            <span className="nomeCognome">{props.profileUser.firstName} {props.profileUser.lastName}</span>
            {
                (birthday !== "")
                    ? <span className="years-old">{eta} years old</span>
                    : null
            }
        </>
    );
}

export default HeaderInfo;