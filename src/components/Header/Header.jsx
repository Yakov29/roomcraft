import React, { useEffect, useState } from "react";
import "./Header.css";
import Container from "../Container/Container";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

const Header = () => {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        AOS.init({
            duration: 600,
            easing: "ease-in-out",
            once: true,
        });

        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    useEffect(() => {
        AOS.refresh();
    }, [menuOpen]);

    useEffect(() => {
        if (location.hash === "#about" || location.hash === "#footer") {
            const id = location.hash.substring(1);
            const scrollToSection = () => {
                const section = document.getElementById(id);
                if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                }
            };
            setTimeout(scrollToSection, 100);
        }
    }, [location]);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    const handleAboutClick = (e) => {
        e.preventDefault();
        closeMenu();

        if (location.pathname === "/") {
            const section = document.getElementById("about");
            if (section) {
                section.scrollIntoView({ behavior: "smooth" });
            }
        } else {
            navigate("/#about");
        }
    };

    const handleFooterClick = (e) => {
        e.preventDefault();
        closeMenu();

        if (location.pathname === "/") {
            const section = document.getElementById("footer");
            if (section) {
                section.scrollIntoView({ behavior: "smooth" });
            }
        } else {
            navigate("/#footer");
        }
    };

    const handleHomeClick = (e) => {
        e.preventDefault();
        closeMenu();

        if (location.pathname === "/") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            navigate("/");
        }
    };

    return (
        <header className="header" data-aos="fade-down">
            <Container>
                <Link to="/" onClick={handleHomeClick} data-aos="fade-right" data-aos-delay="100">
                    <img
                        className="header__home"
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVsJra7Rdc4ehn39o2sQW1hA9BP51afG1uVA&s"
                        alt="Логотип"
                    />
                </Link>

                <nav className={`header__list ${menuOpen ? "active" : ""}`} data-aos="fade-left" data-aos-delay="200">
                    <li className="header__item" data-aos="fade-up" data-aos-delay="250">
                        <a href="/" className="header__link" onClick={handleHomeClick}>Головна</a>
                    </li>
                    <li className="header__item" data-aos="fade-up" data-aos-delay="300">
                        <a href="/#winner" className="header__link" onClick={handleAboutClick}>
                            Про проєкт
                        </a>
                    </li>
                    <li className="header__item" data-aos="fade-up" data-aos-delay="350">
                        <a href="/#footer" className="header__link" onClick={handleFooterClick}>
                            Контакти
                        </a>
                    </li>
                    {user && (
                        <li className="header__item" data-aos="fade-up" data-aos-delay="375">
                            <Link to={`/user/${user.id}/rooms`} className="header__link" onClick={closeMenu}>
                                Кімнати
                            </Link>
                        </li>
                    )}
                    <li className="header__item header__item--mobile" data-aos="fade-up" data-aos-delay="400">
                        {user ? (
                            <Link to="/user" onClick={closeMenu}>
                                <img
                                    src={user.avatar}
                                    alt="Аватар"
                                    className="header__avatar"
                                />
                            </Link>
                        ) : (
                            <Link to="/get-started" className="header__start" onClick={closeMenu}>
                                Зареєструватися
                            </Link>
                        )}
                    </li>
                </nav>

                {user ? (
                    <Link to="/user" className="header__avatar--desktop">
                        <img
                            src={user.avatar}
                            alt="Аватар"
                            className="header__avatar"
                        />
                    </Link>
                ) : (
                    <Link to="/get-started" className="header__start header__start--desktop" data-aos="zoom-in" data-aos-delay="500">
                        Зареєструватися
                    </Link>
                )}

                <div className="header__burger" onClick={toggleMenu} data-aos="fade-up" data-aos-delay="600">
                    <span />
                    <span />
                    <span />
                </div>
            </Container>
        </header>
    );
};

export default Header;
