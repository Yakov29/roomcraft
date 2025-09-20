import React, { useState, useEffect } from "react";
import Container from "../Container/Container";
import "./Hero.css";
import { FaArrowDown } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Logo from "../../images/a6bd8a67-f3ca-4971-96e1-e0ba26802ace.png";
import AOS from "aos";
import "aos/dist/aos.css";

const phrases = [
    "RoomCraft — Створи простір, що надихає ✨",
    "Плануй кімнату без ризику та витрат 🛋️",
    "Геймерський куточок? Легко! 🎮",
    "Твій простір — твій стиль 🏡",
    "Ідеальна кімната — почни з віртуального проєкту 💡",
    "Створи атмосферу своєї мрії 🌈",
    "Комфорт починається тут 🛏️",
    "Візуалізуй свій ідеальний дім 🖼️",
    "Розстав меблі без меж 🪑",
    "Твій простір, твої правила 🏠",
    "Ідеї для будь-якого настрою 🌟",
    "Малюй кімнату своїми руками ✏️",
    "Творчість без обмежень 🎨",
    "Перетвори кімнату на оазис 🌿",
    "Дизайн, який надихає 💫",
    "Твій дім — твій стиль життя 🏡",
    "Грайся кольорами та формами 🎨",
    "Віртуальний ремонт без стресу 🛠️",
    "Створи простір, що відображає тебе ✨",
    "Мрії оживають у RoomCraft 🌈",
    "Зроби кімнату зручною та стильною 🛋️",
    "Твій простір — твій настрій 😊",
    "Візуалізація — перший крок до комфорту 💡",
    "Ідеї для кожного куточка дому 🏡",
    "Комфорт та стиль в одному 💫",
    "Створи свій ідеальний геймерський рай 🎮",
    "Дизайн кімнати ще ніколи не був таким простим 🖌️",
    "Змінюй простір одним кліком 🖱️",
    "Надихайся та плануй 💡",
    "Твори атмосферу, що подобається 🌟",
    "Візуалізуй майбутню кімнату 🏠",
    "Меблі та декор без обмежень 🪑",
    "Перетвори простір на витвір мистецтва 🎨",
    "Твій дім — твоя гордість 🏡",
    "Віртуальне планування — без стресу 🛋️",
    "Створи ідеальний офіс вдома 💻",
    "Твій простір — твоя історія 📖",
    "Дизайн, що відображає характер 💫",
    "Маленькі зміни — великий ефект ✨",
    "Комфортний простір для роботи та відпочинку 🛋️",
    "Кімната, яку хочеться показати друзям 👀",
    "Твори легко та весело 🎨",
    "Інтер’єр твоєї мрії чекає на тебе 🌈",
    "Планування без стресу та витрат 💡",
    "Візуалізуй будь-яку ідею 🖼️",
    "Твори стильні простори 🏡",
    "Меблі, декор та натхнення в одному 🎨",
    "Створи геймерський рай у кімнаті 🎮",
    "Змінюй простір за лічені хвилини ⏱️",
    "Твій дім — твій дизайн 💫",
    "Перетвори кімнату на затишний куточок 🌿",
    "Віртуальна кімната — без обмежень 🏠",
    "Ідеї для кожної кімнати 🛋️",
    "Комфортний простір — твій стиль 🏡",
    "Твори, експериментуй, надихайся ✨",
    "Створи кімнату, яка радує око 🎨",
    "Плануй дизайн без помилок 💡",
    "Ідеальна кімната — просто клік 🖱️",
    "Твій простір — твій настрій 🌈",
    "Візуалізуй будь-яку фантазію 🖼️",
    "Творчість у кожному куточку 🏡",
    "Дизайн без компромісів 💫",
    "Зроби кімнату стильним місцем 🛋️",
    "Мрії про дім стають реальністю ✨",
    "Твори свій ідеальний офіс вдома 💻",
    "Перетвори кімнату на творчий простір 🎨",
    "Твій дім — твій витвір мистецтва 🏡",
    "Візуалізуй ідеї миттєво 🖼️",
    "Твори без стресу та витрат 🛋️",
    "Ідеальний простір для роботи та відпочинку 💫",
    "Створи атмосферу, що надихає 🌟",
    "Віртуальний дизайн для реальних кімнат 🏠",
    "Малюй, плануй, надихайся 🎨",
    "Комфорт та стиль разом 🛋️",
    "Твій дім — твій настрій 🌈",
    "Геймерський куточок мрії 🎮",
    "Створи ідеальну вітальню 🛋️",
    "Візуалізація — ключ до ідеального дизайну 💡",
    "Мрії оживають у RoomCraft ✨",
    "Твій простір — твоя творчість 🎨",
    "Комфортний куточок для всіх 🏡",
    "Дизайн кімнати легко та весело 🎨",
    "Твори без меж та обмежень 🛋️",
    "Ідеї для кожного стилю 🏠",
    "Віртуальний ремонт без стресу 🛠️",
    "Створи кімнату для мрій 🌟",
    "Твій дім — твоя історія 📖",
    "Плануй, змінюй, надихайся 💡",
    "Комфорт та затишок у кожному кутку 🛋️",
    "Твори простір, який любиш 🌈",
    "Візуалізація твоїх ідей 🖼️",
    "Ідеальна кімната без компромісів ✨",
    "Малюй свій стиль у RoomCraft 🎨",
    "Зроби кімнату своєю гордістю 🏡",
    "Твори легко та креативно 💫",
    "Дизайн, що надихає щодня 🌟",
    "Ідеї для будь-якого простору 🛋️",
    "Віртуальний дім для реальних мрій 🏠",
    "Твори простір для себе 🎨",
    "Меблі та декор без меж 🪑",
    "Створи геймерський рай у кімнаті 🎮",
    "Твій простір — твій вибір 💡",
    "Комфорт та стиль у кожній кімнаті 🏡",
    "Візуалізуй будь-який дизайн миттєво 🖼️",
    "Твори свій ідеальний простір ✨",
    "Ідеальна кімната починається тут 💫"
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