import React, { useEffect } from "react";
import "./Footer.css";
import Container from "../Container/Container";
import logo from "../../logo.png";
import { CiMail } from "react-icons/ci";
import { FaGithub, FaInstagram } from "react-icons/fa";

import AOS from "aos";
import "aos/dist/aos.css";

const Footer = () => {
    useEffect(() => {
        AOS.init({
            duration: 700,
            once: true,
        });
    }, []);

    return (
        <footer className="footer" data-aos="fade-up" id="footer">
            <Container>
                <img
                    className="footer__logo"
                    src={logo}
                    alt="logo"
                    data-aos="zoom-in"
                    data-aos-delay="100"
                />
                <ul className="footer__list">
                    <li className="footer__item">
                        <p className="footer__text">
                            <CiMail /> Email:{" "}
                            <a className="footer__link" href="mailto:yakovderkachenko@gmail.com">
                                yakovderkachenko@gmail.com
                            </a>
                        </p>
                    </li>
                    <li className="footer__item">
                        <p className="footer__text">
                            <FaGithub /> GitHub:{" "}
                            <a className="footer__link" href="https://github.com/Yakov29" target="_blank" rel="noopener noreferrer">
                                Yakov29
                            </a>
                        </p>
                    </li>
                    <li className="footer__item">
                        <p className="footer__text">
                            <FaInstagram /> Instagram:{" "}
                            <a className="footer__link" href="https://www.instagram.com/d.yakov29/" target="_blank" rel="noopener noreferrer">
                                @d.yakov29
                            </a>
                        </p>
                    </li>
                    <li className="footer__item">
                        <p className="footer__text">
                            <FaInstagram /> Telegram:{" "}
                            <a className="footer__link" href="https://t.me/zovutyakov" target="_blank" rel="noopener noreferrer">
                                @zovutyakov
                            </a>
                        </p>
                    </li>
                </ul>
            </Container>
        </footer>
    );
};

export default Footer;
