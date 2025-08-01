import React, { useState, useEffect } from "react";
import Container from "../Container/Container";
import "./Hero.css";
import { FaArrowDown } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Logo from "../../logo.png";
import AOS from "aos";
import "aos/dist/aos.css";

const phrases = [
    "RoomCraft — Створи простір, що надихає ✨",
    "Плануй кімнату без ризику та витрат 🛋️",
    "Геймерський куточок? Легко! 🎮",
    "Твій простір — твій стиль 🏡",
    "Ідеальна кімната — почни з віртуального проєкту 💡"
];

const Hero = () => {
    const [text, setText] = useState("");
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pause, setPause] = useState(false);

    const [hasUser, setHasUser] = useState(false);
    const [userId, setUserId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        AOS.init({
            duration: 700,
            easing: "ease-in-out",
            once: true,
        });

        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.id) {
                    setHasUser(true);
                    setUserId(user.id);
                } else {
                    setHasUser(false);
                    setUserId(null);
                }
            } catch (error) {
                console.error("Failed to parse user data from localStorage", error);
                setHasUser(false);
                setUserId(null);
            }
        } else {
            setHasUser(false);
            setUserId(null);
        }
    }, []);

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex % phrases.length];
        const speed = isDeleting ? 40 : 80;

        if (pause) {
            const pauseTimeout = setTimeout(() => {
                setPause(false);
                setIsDeleting(true);
            }, 5000);
            return () => clearTimeout(pauseTimeout);
        }

        const timeout = setTimeout(() => {
            setText(currentPhrase.slice(0, charIndex));

            if (!isDeleting && charIndex < currentPhrase.length) {
                setCharIndex(charIndex + 1);
            } else if (!isDeleting && charIndex === currentPhrase.length) {
                setPause(true);
            } else if (isDeleting && charIndex > 0) {
                setCharIndex(charIndex - 1);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setPhraseIndex((prev) => prev + 1);
            }
        }, speed);

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, phraseIndex, pause]);

    const handleButtonClick = () => {
        if (hasUser && userId) {
            navigate(`/user/${userId}/rooms`);
        } else {
            navigate('/get-started');
        }
    };

    const handleScrollDown = () => {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section className="hero" data-aos="fade-up">
            <Container>
                <div className="hero__content" data-aos="fade-right" data-aos-delay="100">
                    <h1 className="hero__title">
                        {text}
                        <span className="cursor"></span>
                    </h1>
                    <p className="hero__description" data-aos="fade-left" data-aos-delay="300">
                        RoomCraft — це твій персональний конструктор кімнати. Плануй, експериментуй і створюй ідеальний простір прямо у браузері.
                    </p>

                    <button
                        className="hero__button"
                        onClick={handleButtonClick}
                        data-aos="zoom-in"
                        data-aos-delay="500"
                    >
                        {hasUser ? "Відкрити редактор" : "Почати"}
                    </button>

                    <p className="hero__subtext" data-aos="fade-up" data-aos-delay="600">
                        Більше 10 000 користувачів вже створили свої віртуальні кімнати ✨
                    </p>
                </div>
                <div className="hero__preview" data-aos="zoom-in" data-aos-delay="400">
                    <img
                        src={Logo}
                        alt="Room Preview"
                    />
                </div>
            </Container>
            <button className="hero__arrow" onClick={handleScrollDown}>
                <FaArrowDown />
            </button>
        </section>
    );
};

export default Hero;