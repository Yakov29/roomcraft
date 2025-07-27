import React, { useState, useEffect } from "react";
import Container from "../Container/Container";
import "./Hero.css";
import { FaArrowDown } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

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
        const userData = localStorage.getItem("user");
        if (userData) {
            const user = JSON.parse(userData);
            setHasUser(true);
            setUserId(user.id);
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
        }
    };

    return (
        <section className="hero">
            <Container>
                <div className="hero__content">
                    <h1 className="hero__title">
                        {text}
                        <span className="cursor"></span>
                    </h1>
                    <p className="hero__description">
                        RoomCraft — це твій персональний конструктор кімнати. Плануй, експериментуй і створюй ідеальний простір прямо у браузері.
                    </p>

                    <button
                        className="hero__button"
                        onClick={handleButtonClick}
                        disabled={!hasUser}
                    >
                        {hasUser ? "Відкрити редактор" : "Почати створення"}
                    </button>

                    <p className="hero__subtext">Більше 10 000 користувачів вже створили свої віртуальні кімнати ✨</p>
                </div>
                <div className="hero__preview">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
                        alt="Room Preview"
                    />
                </div>
            </Container>
            <button className="hero__arrow"><FaArrowDown/></button>
        </section>
    );
};

export default Hero;
