import React, { useEffect } from "react";
import avatar from "../../images/avatar.jpg";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Developer.css";

const Developer = () => {
    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

    return (
        <section className="developer" data-aos="fade-up">
            <h2 className="developer__title" data-aos="fade-down">
                Про розробника!
            </h2>
            <img className="developer__image" src={avatar} data-aos="zoom-in" />
            <p className="developer__description" data-aos="fade-up" data-aos-delay="200">
                Привіт! 👋 Мене звати Яков, мені всього 14, але я вже впевнено крокую в світ фронтенду 🌐
                Я з Дніпра 🇺🇦, і вже на 6-му семестрі вивчення React ⚛️
                Створюю інтерактивні інтерфейси, 3D-проєкти, як <strong>RoomCraft</strong>, і просто обожнюю кодити 💻
                Моя мета — створювати такі сайти, які не хочеться закривати 😍
            </p>
        </section>
    );
};

export default Developer;
