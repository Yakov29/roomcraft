import { useEffect } from "react";
import Hero from "../../components/Hero/Hero";

const Homepage = () => {
    useEffect(() => { document.title = "RoomCraft | Головна" })
    return (
        <main>
            <Hero />
        </main>
    )
}

export default Homepage