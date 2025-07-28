import React, { useEffect } from "react";
import Container from "../Container/Container";
import "./About.css";

import walls from  "../../images/walls.png";
import furniture from "../../images/furniture.png";
import colors from "../../images/colors.png";

import AOS from "aos";
import "aos/dist/aos.css";

const About = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
        });
    }, []);

    return (
        <section className="about" id="about" data-aos="fade-up">
            <Container>
                <h2 className="about__title" data-aos="fade-down">
                    Про цей проєкт ℹ️
                </h2>
                <p className="about__description" data-aos="fade-left">
                    RoomCraft — це крутий веб-додаток на React, який допоможе тобі створити кімнату своєї мрії! 💡 Уяви, що ти можеш віртуально розставляти меблі, експериментувати з дизайном та бачити результат одразу, без зайвих витрат і ризиків! 🎉 Цей проєкт створений, щоб допомогти підліткам легко спланувати свій простір, навіть якщо у голові суцільний хаос ідей. Тепер у тебе є цифровий конструктор кімнат — як The Sims, але для реального життя! 🛋️✨
                </p>
                <ul className="about__list">
                    <li className="about__item" data-aos="zoom-in" data-aos-delay="100">
                        <img src={walls} alt="Іконка планування" className="about__image"/>
                        <p className="about__text">
                            <strong>Плануйте з нуля.</strong> Створюйте підлогу та зводьте стіни будь-якої конфігурації. Ваш єдиний ліміт — це ваша уява!
                        </p>
                    </li>
                    <li className="about__item" data-aos="zoom-in" data-aos-delay="200">
                        <img src={furniture} alt="Іконка меблів" className="about__image"/>
                        <p className="about__text">
                            <strong>Обставляйте меблями.</strong> Вибирайте з великої бібліотеки дивани, столи та декор. Перетягуйте, повертайте та знаходьте ідеальне місце для кожного предмета.
                        </p>
                    </li>
                    <li className="about__item" data-aos="zoom-in" data-aos-delay="300">
                        <img src={colors} alt="Іконка палітри" className="about__image"/>
                        <p className="about__text">
                            <strong>Експериментуйте зі стилем.</strong> Перефарбовуйте стіни та підлогу, щоб створити унікальну атмосферу. Зберігайте свої проєкти та повертайтеся до них у будь-який час.
                        </p>
                    </li>
                </ul>
            </Container>
        </section>
    )
}

export default About;
