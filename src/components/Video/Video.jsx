import React, { useEffect } from "react";
import Container from "../Container/Container";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Video.css";

const VideoPlayer = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
        });
    }, []);

    return (
        <section className="video-player" data-aos="fade-up">
            <Container>
                <h2 className="video-player__title" data-aos="fade-right">
                    Відео туторіал 📹
                </h2>
                <div className="video-player__wrapper" data-aos="zoom-in">
                    <div className="video-player__iframe-wrapper">
                        <iframe
                            className="video-player__iframe"
                            src="https://www.youtube.com/embed/78z3i8WNVEA"
                            title="RoomCraft туторіал"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default VideoPlayer;
