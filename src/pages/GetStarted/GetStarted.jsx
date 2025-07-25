import { useEffect } from "react";
import Register from "../../components/Register/Register";

const GetStarted = () => {
    useEffect(() => { document.title = "RoomCraft | Початок" })

    return (
        <main>
            <Register />
        </main>
    )
}

export default GetStarted