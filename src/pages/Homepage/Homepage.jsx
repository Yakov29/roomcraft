import { useEffect } from "react";
import Hero from "../../components/Hero/Hero";
import About from "../../components/About/About";
import Footer from "../../components/Footer/Footer";
import Developer from "../../components/Developer/Developer";

const Homepage = () => {
    useEffect(() => { document.title = "RoomCraft | Головна" })
    return (
        <main>
            <Hero />
            <About/>
            <Developer/>
            <Footer/>
        </main>
    )
}

export default Homepage