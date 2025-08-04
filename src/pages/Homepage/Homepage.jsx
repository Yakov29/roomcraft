import { useEffect } from "react";
import Hero from "../../components/Hero/Hero";
import About from "../../components/About/About";
import Footer from "../../components/Footer/Footer";
import Developer from "../../components/Developer/Developer";
import Video from "../../components/Video/Video";
import Winner from "../../components/Winner/Winner";

const Homepage = () => {
    useEffect(() => { document.title = "RoomCraft | Головна" })
    return (
        <main>
            <Hero />
            <Winner/>
            <About/>
            <Video/>
            <Developer/>
            <Footer/>
        </main>
    )
}

export default Homepage