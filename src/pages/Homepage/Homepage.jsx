import { useEffect } from "react";
import Hero from "../../components/Hero/Hero";
import About from "../../components/About/About";
import Footer from "../../components/Footer/Footer";

const Homepage = () => {
    useEffect(() => { document.title = "RoomCraft | Головна" })
    return (
        <main>
            <Hero />
            <About/>
            <Footer/>
        </main>
    )
}

export default Homepage