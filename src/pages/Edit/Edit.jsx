import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Outlines, MeshReflectorMaterial, useDetectGPU, Preload } from '@react-three/drei';
import { GridHelper, Vector3, MeshStandardMaterial, Raycaster, Plane, Euler, Quaternion, PointLight } from 'three';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';

const styles = {
    root: {
        '--background-color': '#121924',
        '--primary-dark': '#2C3A59',
        '--primary-darker': '#1B2438',
        '--accent': '#2D9CDB',
        '--text-color-light': '#E1E6F0',
        '--text-color-muted': '#A0AEC0',
    },
    preloader: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'var(--background-color)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'var(--text-color-light)',
        fontSize: '1.5em',
        zIndex: 10000,
        flexDirection: 'column',
        gap: '20px'
    },
    contextMenu: {
        position: 'fixed',
        background: 'rgba(31, 41, 55, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: 'var(--text-color-light)',
        borderRadius: '10px',
        padding: '8px',
        zIndex: 3000,
        boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
        border: '1px solid rgba(75, 85, 99, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '200px',
    },
    contextMenuTitle: {
        padding: '8px 12px',
        fontSize: '1.1em',
        fontWeight: '700',
        color: 'var(--text-color-light)',
        borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
        marginBottom: '4px',
        textAlign: 'center',
    },
    contextMenuButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-color-muted)',
        padding: '10px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '1em',
        transition: 'background-color 0.2s ease, color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    contextMenuButtonHover: {
        backgroundColor: 'var(--accent)',
        color: 'white',
    },
    contextMenuButtonDisabled: {
        color: '#6B7280',
        cursor: 'not-allowed',
    },
    contextMenuColorSection: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '8px 12px',
        borderTop: '1px solid rgba(75, 85, 99, 0.5)',
        marginTop: '4px',
    },
    tutorialModal: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    tutorialContent: {
        background: 'var(--primary-dark)',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
        color: 'var(--text-color-light)',
        maxWidth: '600px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    tutorialTitle: {
        color: '#E1E6F0',
        margin: 0,
        fontSize: '2em',
        fontWeight: '700',
    },
    tutorialText: {
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        color: 'var(--text-color-muted)',
        fontSize: '1.1em',
    },
    tutorialButtonContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
    },
    buttonBase: {
        padding: '15px 40px',
        color: '#FFFFFF',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1.1em',
        transition: 'background-color 0.3s ease, transform 0.2s, box-shadow 0.3s ease',
    },
    tutorialSkipButton: {
        backgroundColor: '#DC2626',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
    },
    tutorialSkipButtonHover: {
        backgroundColor: '#EF4444',
        transform: 'translateY(-2px)',
    },
    tutorialNextButton: {
        backgroundColor: 'var(--accent)',
        boxShadow: '0 4px 12px rgba(45, 156, 219, 0.3)',
    },
    tutorialNextButtonHover: {
        backgroundColor: '#3AA0FF',
        transform: 'translateY(-2px)',
    },
    inventoryPanel: {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '340px',
        background: 'rgba(31, 41, 55, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'var(--text-color-light)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRight: '1px solid rgba(75, 85, 99, 0.5)',
        boxShadow: '4px 0 14px rgba(0, 0, 0, 0.3)',
        zIndex: 999,
        transition: 'transform 0.3s ease-out',
    },
    inventorySection: {
        background: 'var(--primary-darker)',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    inventoryTitle: {
        margin: '0 0 12px 0',
        color: '#E1E6F0',
        fontSize: '1.3em',
        fontWeight: '700',
    },
    inventoryCategoryTitle: {
        margin: '0 0 8px 0',
        color: 'var(--text-color-light)',
        fontSize: '1em',
        fontWeight: '600',
        borderBottom: '1px solid var(--primary-dark)',
        paddingBottom: '6px',
    },
    toolButtonActive: {
        backgroundColor: 'var(--accent)',
        boxShadow: '0 4px 12px rgba(45, 156, 219, 0.3)',
    },
    toolButtonActiveHover: {
        backgroundColor: '#3AA0FF',
        transform: 'translateY(-2px)',
    },
    toolButtonInactive: {
        background: 'rgba(75,85,99,0.7)',
        boxShadow: 'none',
    },
    toolButtonInactiveHover: {
        backgroundColor: '#5A6578',
        transform: 'translateY(-2px)',
    },
    colorSwatch: {
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'border 0.2s ease, transform 0.2s',
    },
    furnitureItem: {
        padding: '10px 14px',
        background: 'rgba(31, 41, 55, 0.85)',
        color: '#FFFFFF',
        borderRadius: '10px',
        cursor: 'grab',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        userSelect: 'none',
        fontSize: '0.95em',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    },
    furnitureItemHover: {
        backgroundColor: 'rgba(45, 156, 219, 0.3)',
        transform: 'translateY(-2px)',
    },
    saveButton: {
        backgroundColor: '#28A745',
        boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
    },
    saveButtonHover: {
        backgroundColor: '#34D399',
        transform: 'translateY(-2px)',
    },
    clearButton: {
        backgroundColor: '#DC2626',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
    },
    clearButtonHover: {
        backgroundColor: '#EF4444',
        transform: 'translateY(-2px)',
    },
    exitButton: {
        backgroundColor: '#545454ff',
        boxShadow: '0 4px 12px rgba(65, 65, 66, 0.3)',
    },
    exitButtonHover: {
        backgroundColor: '#6B7280',
        transform: 'translateY(-2px)',
    },
    tutorialButton: {
        backgroundColor: '#007BFF',
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
    },
    tutorialButtonHover: {
        backgroundColor: '#0056b3',
        transform: 'translateY(-2px)',
    },
    searchInput: {
        width: '100%',
        padding: '12px',
        backgroundColor: 'var(--primary-dark)',
        border: '1px solid var(--primary-darker)',
        borderRadius: '8px',
        color: 'var(--text-color-light)',
        fontSize: '1em',
        marginBottom: '10px',
        boxSizing: 'border-box',
    },
};

const HoverButton = ({ children, style, hoverStyle, onClick, disabled }) => {
    const [isHovered, setIsHovered] = useState(false);
    const mergedStyle = { ...style, ...(isHovered && !disabled ? hoverStyle : {}), ...(disabled ? styles.contextMenuButtonDisabled : {}) };
    return (<button onClick={disabled ? undefined : onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={mergedStyle} disabled={disabled}>{children}</button>);
};

const HoverDiv = ({ children, style, hoverStyle, onMouseDown, title }) => {
    const [isHovered, setIsHovered] = useState(false);
    const mergedStyle = { ...style, ...(isHovered ? hoverStyle : {}) };
    return (<div onMouseDown={onMouseDown} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={mergedStyle} title={title}>{children}</div>);
};

const CELL_SIZE = 1;
const WALL_HEIGHT = 3;
const INITIAL_GRID_SIZE = 16;
const FLOOR_LEVEL = 0;
const INITIAL_CAMERA_POSITION = [20, 24, 20];
const INITIAL_LOOK_AT_TARGET = new Vector3(0, 0, 0);
const MOVEMENT_SPEED = 0.25; // Slower movement
const VERTICAL_MOVEMENT_SPEED = 0.3;
const ROTATION_SPEED_KEYBOARD_YAW = 0.1;
const ROTATION_SPEED_KEYBOARD_PITCH = 0.1;
const LERP_FACTOR = 0.2;
const BOBBING_FREQUENCY = 10;
const BOBBING_AMPLITUDE = 0.05;

const TOOL_TYPES = {
    wall: '🧱 Несуча стіна',
    narrowWall: '🧱 Звичайна стіна',
    cornerWall: '🧱 Кутова стіна',
    floor: '⬜ Підлога',
    furniture: 'Меблі',
};

const BASE_COLORS = ['#E1E6F0', '#2C3A59', '#2D9CDB', '#FFA94D', '#228B22'];
const hoverMaterial = new MeshStandardMaterial({ color: "#ADD8E6", transparent: true, opacity: 0.3 });
const phantomMaterial = new MeshStandardMaterial({ color: "#2D9CDB", transparent: true, opacity: 0.5 });
const invalidPhantomMaterial = new MeshStandardMaterial({ color: "#FF0000", transparent: true, opacity: 0.5 });

const FURNITURE_CATEGORIES = {
    '🛋️ Меблі': [
        { type: 'sofa', label: 'Диван', dimensions: { width: 1.6, depth: 0.8, height: 0.8 } },
        { type: 'armchair', label: 'Крісло', dimensions: { width: 0.8, depth: 0.8, height: 0.9 } },
        { type: 'chair', label: 'Стілець', dimensions: { width: 0.6, depth: 0.6, height: 0.8 } },
        { type: 'barStool', label: 'Барний стілець', dimensions: { width: 0.4, depth: 0.4, height: 1.0 } },
        { type: 'beanBag', label: 'Крісло-мішок', dimensions: { width: 0.8, depth: 0.8, height: 0.6 } },
        { type: 'table', label: 'Стіл', dimensions: { width: 1.0, depth: 0.8, height: 0.8 } },
        { type: 'coffeeTable', label: 'Журнальний стіл', dimensions: { width: 0.8, depth: 0.5, height: 0.4 } },
        { type: 'fireplace', label: 'Камін', dimensions: { width: 1.5, depth: 0.5, height: 1.2 } },
    ],
    '🗄️ Зберігання': [
        { type: 'bookshelf', label: 'Книжкова шафа', dimensions: { width: 1.0, depth: 0.3, height: 1.8 } },
        { type: 'cabinet', label: 'Шафа', dimensions: { width: 1.0, depth: 0.5, height: 2.0 } },
        { type: 'wardrobe', label: 'Гардеробна шафа', dimensions: { width: 1.5, depth: 0.6, height: 2.2 } },
        { type: 'dresser', label: 'Комод', dimensions: { width: 1.2, depth: 0.5, height: 0.9 } },
        { type: 'nightstand', label: 'Тумбочка', dimensions: { width: 0.5, depth: 0.4, height: 0.6 } },
        { type: 'wallShelf', label: 'Настінна полиця', dimensions: { width: 1.2, depth: 0.25, height: 0.1 } },
    ],
    '🚪 Двері та вікна': [
        { type: 'door', label: 'Двері (для несущої)', dimensions: { width: 0.9, depth: 0.05, height: WALL_HEIGHT } },
        { type: 'window', label: 'Вікно (для несущої)', dimensions: { width: 0.9, depth: 0.05, height: WALL_HEIGHT } },
        { type: 'narrowDoor', label: 'Двері (для звичайної)', dimensions: { width: 0.9, depth: 0.2, height: WALL_HEIGHT } },
        { type: 'narrowWindow', label: 'Вікно (для звичайної)', dimensions: { width: 0.9, depth: 0.2, height: WALL_HEIGHT } },
    ],
    '🧑‍🍳 Кухня': [
        { type: 'kitchenTable', label: 'Кухонний стіл', dimensions: { width: 1.2, depth: 0.7, height: 0.8 } },
        { type: 'barTable', label: 'Барний стіл', dimensions: { width: 0.6, depth: 1.2, height: 1.0 } },
        { type: 'kitchenCabinet', label: 'Кухонна шафа', dimensions: { width: 1.0, depth: 0.5, height: 1.0 } },
    ],
    '🌳 Вулиця': [
        { type: 'outdoorChair', label: 'Вуличний стілець', dimensions: { width: 0.6, depth: 0.6, height: 0.5 } },
        { type: 'outdoorTable', label: 'Вуличний стіл', dimensions: { width: 1.0, depth: 1.0, height: 0.75 } },
        { type: 'grill', label: 'Мангал', dimensions: { width: 0.7, depth: 0.5, height: 1.0 } },
        { type: 'gardenBench', label: 'Садова лавка', dimensions: { width: 1.5, depth: 0.5, height: 0.6 } },
    ],
    '🛏️ Спальня': [
        { type: 'bed', label: 'Ліжко', dimensions: { width: 1.9, depth: 1.3, height: 0.5 } },
    ],
    '💻 Техніка та розваги': [
        { type: 'tv', label: 'Телевізор', dimensions: { width: 1.2, depth: 0.3, height: 1.0 } },
        { type: 'wallMountedTV', label: 'Настінний телевізор', dimensions: { width: 1.2, depth: 0.06, height: 0.7 } },
        { type: 'console', label: 'Ігрова консоль', dimensions: { width: 0.4, depth: 0.1, height: 0.6 } },
        { type: 'computerSetup', label: 'Комп’ютер', dimensions: { width: 1.6, depth: 0.7, height: 1.0 } },
        { type: 'piano', label: 'Рояль', dimensions: { width: 1.5, depth: 1.5, height: 1.0 } },
        { type: 'projectorScreen', label: 'Екран проєктора', dimensions: { width: 2.0, depth: 0.1, height: 1.2 } },
    ],
    '💡 Освітлення': [
        { type: 'lamp', label: 'Торшер', dimensions: { width: 0.3, depth: 0.3, height: 1.1 } },
        { type: 'ceilingLamp', label: 'Стельова лампа', dimensions: { width: 0.6, depth: 0.6, height: 0.6 } },
        { type: 'rgbStrip', label: 'RGB-підсвітка', dimensions: { width: 1.0, depth: 0.05, height: 0.02 } },
    ],
    '🌿 Декор та рослини': [
        { type: 'pottedPlant', label: 'Кімнатна рослина', dimensions: { width: 0.4, depth: 0.4, height: 0.8 } },
        { type: 'tallPlant', label: 'Висока рослина', dimensions: { width: 0.5, depth: 0.5, height: 1.5 } },
        { type: 'rug', label: 'Килим', dimensions: { width: 2.0, depth: 3.0, height: 0.02 } },
        { type: 'mirror', label: 'Дзеркало', dimensions: { width: 0.6, depth: 0.05, height: 1.2 } },
        { type: 'aquarium', label: 'Акваріум', dimensions: { width: 1.0, depth: 0.4, height: 0.6 } },
    ],
    '🚿 Ванна кімната': [
        { type: 'toilet', label: 'Унітаз', dimensions: { width: 0.4, depth: 0.7, height: 0.7 } },
        { type: 'sink', label: 'Умивальник', dimensions: { width: 0.6, depth: 0.5, height: 0.8 } },
        { type: 'bathtub', label: 'Ванна', dimensions: { width: 1.7, depth: 0.8, height: 0.6 } },
        { type: 'shower', label: 'Душова кабіна', dimensions: { width: 0.9, depth: 0.9, height: 2.0 } },
    ],
    '🏢 Офіс': [
        { type: 'desk', label: 'Письмовий стіл', dimensions: { width: 1.4, depth: 0.7, height: 0.75 } },
        { type: 'officeChair', label: 'Офісне крісло', dimensions: { width: 0.6, depth: 0.6, height: 0.9 } },
        { type: 'filingCabinet', label: 'Картотечна шафа', dimensions: { width: 0.5, depth: 0.5, height: 1.5 } },
    ],
    '🍽️ Їдальня': [
        { type: 'diningTable', label: 'Обідній стіл', dimensions: { width: 1.8, depth: 0.9, height: 0.75 } },
        { type: 'diningChair', label: 'Обідній стілець', dimensions: { width: 0.5, depth: 0.5, height: 0.9 } },
    ]
};


const useHistory = (initialState) => {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = useMemo(() => history[currentIndex], [history, currentIndex]);
    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    const setState = useCallback((action) => {
        const newState = typeof action === 'function' ? action(history[currentIndex]) : action;
        if (JSON.stringify(newState) === JSON.stringify(history[currentIndex])) {
            return;
        }
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [currentIndex, history]);

    const undo = useCallback(() => {
        if (canUndo) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [canUndo, currentIndex]);

    const redo = useCallback(() => {
        if (canRedo) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [canRedo, currentIndex]);

    const resetHistory = useCallback((newInitialState) => {
        setHistory([newInitialState]);
        setCurrentIndex(0);
    }, []);

    return { state, setState, undo, redo, canUndo, canRedo, resetHistory };
};

const isWebGLSupported = () => { try { const canvas = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))); } catch (e) { return false; } };
const isMobileDevice = () => (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('Mobi') !== -1);
const calculateWallSnapPosition = (x, z, walls, floorTiles, getKey, furnitureItem) => {
    if (!furnitureItem || !furnitureItem.dimensions) return { x, z, snapped: false, offsetX: 0, offsetZ: 0 };
    const { width, depth } = furnitureItem.dimensions;
    const rotation = furnitureItem.rotation || 0;
    const halfEffectiveWidth = (Math.abs(Math.cos(rotation)) * width + Math.abs(Math.sin(rotation)) * depth) / 2;
    const halfEffectiveDepth = (Math.abs(Math.sin(rotation)) * width + Math.abs(Math.cos(rotation)) * depth) / 2;
    if (!floorTiles[getKey(x, z)]) return { x, z, snapped: false, offsetX: 0, offsetZ: 0 };

    const potentialSnaps = [
        { wallX: x - 1, wallZ: z, dir: 'east' },
        { wallX: x + 1, wallZ: z, dir: 'west' },
        { wallX: x, wallZ: z - 1, dir: 'south' },
        { wallX: x, wallZ: z + 1, dir: 'north' },
    ];

    for (const snap of potentialSnaps) {
        const wallKey = getKey(snap.wallX, snap.wallZ);
        const wall = walls[wallKey];
        if (wall && !wall.hasOpening) {
            const wallThickness = (wall.type === TOOL_TYPES.narrowWall || wall.type === TOOL_TYPES.cornerWall) ? 0.2 : CELL_SIZE;
            const halfWallThickness = wallThickness / 2;
            
            let offsetX = 0, offsetZ = 0;

            switch(snap.dir) {
                case 'east': // wall at x-1
                    offsetX = halfEffectiveWidth - 1 + halfWallThickness;
                    break;
                case 'west': // wall at x+1
                    offsetX = -halfEffectiveWidth + 1 - halfWallThickness;
                    break;
                case 'south': // wall at z-1
                    offsetZ = halfEffectiveDepth - 1 + halfWallThickness;
                    break;
                case 'north': // wall at z+1
                    offsetZ = -halfEffectiveDepth + 1 - halfWallThickness;
                    break;
                default:
                    continue;
            }
            return { x, z, snapped: true, offsetX, offsetZ };
        }
    }
    return { x, z, snapped: false, offsetX: 0, offsetZ: 0 };
};

const Modal = ({ show, title, message, onClose, onConfirm, isConfirm = false }) => {
    if (!show) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            <div style={{ background: styles.tutorialContent.background, padding: styles.tutorialContent.padding, borderRadius: styles.tutorialContent.borderRadius, boxShadow: styles.tutorialContent.boxShadow, color: styles.tutorialContent.color, maxWidth: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ color: styles.tutorialTitle.color, margin: 0 }}>{title}</h2>
                <p style={{ lineHeight: 1.6, color: styles.tutorialText.color }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: isConfirm ? 'space-between' : 'center', marginTop: '20px' }}>
                    {isConfirm && (<HoverButton onClick={onClose} style={{ ...styles.buttonBase, ...styles.tutorialSkipButton, padding: '10px 20px', fontSize: '16px', opacity: 0.9 }} hoverStyle={styles.tutorialSkipButtonHover}>Скасувати</HoverButton>)}
                    <HoverButton onClick={onConfirm || onClose} style={{ ...styles.buttonBase, ...styles.tutorialNextButton, padding: '10px 20px', fontSize: '16px', marginLeft: isConfirm ? 'auto' : '0' }} hoverStyle={styles.tutorialNextButtonHover}>{isConfirm ? 'Підтвердити' : 'ОК'}</HoverButton>
                </div>
            </div>
        </div>
    );
};

const ContextMenu = ({ menuState, onAction, onColorSelect, baseColors, userColors, customColor, setCustomColor, addUserColor, onRotationChange, furniture, walls }) => {
    const menuRef = useRef(null);
    const { target } = menuState;

    const currentItem = useMemo(() => {
        if (!target) return null;
        if (target.type === 'furniture') return furniture[target.key];
        if (target.type === 'wall') return walls[target.key];
        return target.item;
    }, [target, furniture, walls]);

    useEffect(() => {
        if (!menuState.visible || !menuRef.current) return;

        const handleMouseMove = (e) => {
            if (!menuRef.current) return;
            const menuRect = menuRef.current.getBoundingClientRect();
            const threshold = 60;
            if (
                e.clientX < menuRect.left - threshold ||
                e.clientX > menuRect.right + threshold ||
                e.clientY < menuRect.top - threshold ||
                e.clientY > menuRect.bottom + threshold
            ) {
                onAction('close');
            }
        };

        const timer = setTimeout(() => {
            window.addEventListener('mousemove', handleMouseMove);
        }, 300);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [menuState.visible, onAction]);

    if (!menuState.visible || !target) return null;

    const { x, y } = menuState;

    const isActionable = target.type === 'furniture' && target.item.type !== 'door' && target.item.type !== 'window' && target.item.type !== 'narrowDoor' && target.item.type !== 'narrowWindow';
    const isToggleable = currentItem && ['lamp', 'ceilingLamp', 'tv', 'aquarium', 'rgbStrip', 'wallMountedTV'].includes(currentItem.type);
    const toggleText = currentItem?.isOn ? 'Вимкнути' : 'Увімкнути';
    const isRotatable = currentItem && (target.type === 'furniture' || (target.type === 'wall' && !currentItem.hasOpening));

    const handleAction = (action) => {
        onAction(action, target.key);
    };

    const handleColorClick = (color) => {
        onColorSelect(target.key, color);
        onAction('close');
    };

    const handleAddColor = (e) => {
        e.stopPropagation();
        addUserColor();
    };
    
    const handleRotationSlider = (e) => {
        onRotationChange(target.key, parseInt(e.target.value, 10));
    };

    let currentRotationDegrees = currentItem?.rotation ? Math.round(THREE.MathUtils.radToDeg(currentItem.rotation)) : 0;
    currentRotationDegrees = (currentRotationDegrees % 360 + 360) % 360; // Normalize to 0-360

    return (
        <div id="context-menu-div" ref={menuRef} style={{ ...styles.contextMenu, top: `${y}px`, left: `${x}px` }}>
            <div style={styles.contextMenuTitle}>{target.name}</div>
            {isToggleable && (
                <HoverButton onClick={() => handleAction('toggle')} style={styles.contextMenuButton} hoverStyle={styles.contextMenuButtonHover}>
                    💡 {toggleText}
                </HoverButton>
            )}
            <HoverButton onClick={() => handleAction('move')} style={styles.contextMenuButton} hoverStyle={styles.contextMenuButtonHover} disabled={!isActionable}>🚚 Перемістити</HoverButton>
            <HoverButton onClick={() => handleAction('rotate')} style={styles.contextMenuButton} hoverStyle={styles.contextMenuButtonHover} disabled={!isRotatable}>🔄 Повернути на 90°</HoverButton>
            {isRotatable && (
                 <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(75, 85, 99, 0.5)', marginTop: '4px' }}>
                    <label style={{ fontSize: '0.9em', color: 'var(--text-color-muted)', display: 'block', marginBottom: '8px' }}>
                        Точний поворот: {currentRotationDegrees}°
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={currentRotationDegrees}
                        onInput={handleRotationSlider}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                </div>
            )}
            <HoverButton onClick={() => handleAction('raise')} style={styles.contextMenuButton} hoverStyle={styles.contextMenuButtonHover} disabled={!isActionable}>🔼 Підняти</HoverButton>
            <HoverButton onClick={() => handleAction('lower')} style={styles.contextMenuButton} hoverStyle={styles.contextMenuButtonHover} disabled={!isActionable}>🔽 Опустити</HoverButton>
            <HoverButton onClick={() => handleAction('snap')} style={styles.contextMenuButton} hoverStyle={styles.contextMenuButtonHover} disabled={!isActionable}>📌 Притулити до стіни</HoverButton>
            <HoverButton onClick={() => handleAction('delete')} style={{ ...styles.contextMenuButton, color: '#EF4444' }} hoverStyle={{ ...styles.contextMenuButtonHover, backgroundColor: '#DC2626' }}>❌ Видалити</HoverButton>
            <div style={styles.contextMenuColorSection}>
                {[...baseColors, ...userColors].map(color => (
                    <div key={color} onClick={() => handleColorClick(color)} style={{ ...styles.colorSwatch, background: color }} title={`Пофарбувати в ${color}`} />
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderTop: '1px solid rgba(75, 85, 99, 0.5)' }}>
                <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        padding: 0,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: 'transparent'
                    }}
                    title="Обрати свій колір"
                />
                <HoverButton
                    onClick={handleAddColor}
                    style={{ ...styles.contextMenuButton, flexGrow: 1, textAlign: 'center', padding: '8px' }}
                    hoverStyle={styles.contextMenuButtonHover}
                >
                    Додати
                </HoverButton>
            </div>
        </div>
    );
};

const RmcAiModal = ({ show, onClose, onGenerate }) => {
    const [roomType, setRoomType] = useState('Вітальня');
    const [roomSize, setRoomSize] = useState('Середня');
    const [roomStyle, setRoomStyle] = useState('Сучасний');

    if (!show) return null;

    const handleGenerate = () => {
        onGenerate(roomType, roomSize, roomStyle);
        onClose();
    };

    const selectStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: 'var(--primary-dark)',
        border: '1px solid var(--primary-darker)',
        borderRadius: '8px',
        color: 'var(--text-color-light)',
        fontSize: '1em',
        boxSizing: 'border-box',
    };

    return (
        <div style={styles.tutorialModal}>
            <div style={{ ...styles.tutorialContent, maxWidth: '500px', gap: '20px' }}>
                <h2 style={styles.tutorialTitle}>🤖 RMC AI Генератор Кімнат</h2>
                <p style={styles.tutorialText}>
                    Виберіть параметри, і ШІ створить для вас кімнату.
                    <br />
                    <strong style={{ color: '#EF4444' }}>Увага:</strong> Ця дія видалить ваш поточний дизайн.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Тип кімнати</label>
                        <select value={roomType} onChange={(e) => setRoomType(e.target.value)} style={selectStyle}>
                            <option>Вітальня</option>
                            <option>Спальня</option>
                            <option>Кухня</option>
                            <option>Офіс</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Розмір кімнати</label>
                        <select value={roomSize} onChange={(e) => setRoomSize(e.target.value)} style={selectStyle}>
                            <option>Маленька</option>
                            <option>Середня</option>
                            <option>Велика</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Стиль</label>
                        <select value={roomStyle} onChange={(e) => setRoomStyle(e.target.value)} style={selectStyle}>
                            <option>Сучасний</option>
                            <option>Затишний</option>
                            <option>Мінімалізм</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <HoverButton onClick={onClose} style={{ ...styles.buttonBase, ...styles.tutorialSkipButton, padding: '10px 20px' }} hoverStyle={styles.tutorialSkipButtonHover}>
                        Скасувати
                    </HoverButton>
                    <HoverButton onClick={handleGenerate} style={{ ...styles.buttonBase, ...styles.tutorialNextButton, padding: '10px 20px' }} hoverStyle={styles.tutorialNextButtonHover}>
                        Згенерувати
                    </HoverButton>
                </div>
            </div>
        </div>
    );
};

const Material = ({ isPhantom, ...props }) => {
    return isPhantom ? <primitive object={phantomMaterial} attach="material" /> : <meshStandardMaterial {...props} />;
};

const Chair = React.memo(({ color = '#A0522D', rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.5, 0.08, 0.5]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.58, -0.22]}>
            <boxGeometry args={[0.5, 0.5, 0.08]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0.1} />
        </mesh>
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.13, z]}>
                <cylinderGeometry args={[0.025, 0.025, 0.26, 12]} />
                <Material isPhantom={isPhantom} color={'#2C3A59'} roughness={0.6} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const OutdoorChair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.6]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.45, -0.25]}>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.1, z]}>
                <cylinderGeometry args={[0.04, 0.04, 0.2]} />
                <Material isPhantom={isPhantom} color="#4B5563" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Table = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1, 0.05, 0.8]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.375, z]}>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const CoffeeTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[0.8, 0.04, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.19, z]}>
                <boxGeometry args={[0.05, 0.38, 0.05]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Bookshelf = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[1.0, 1.8, 0.3]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[0.4, 0, -0.4].map((y, i) => (
            <mesh key={i} position={[0, 0.9 + y, 0.13]}>
                <boxGeometry args={[0.9, 0.05, 0.2]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Armchair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.8, 0.3, 0.8]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.7, 0.15, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.6, -0.3]}>
            <boxGeometry args={[0.7, 0.4, 0.1]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[-0.35, 0.45, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0.35, 0.45, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Fireplace = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.5, 1.2, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.4, 0.26]}>
            <boxGeometry args={[0.8, 0.8, 0.05]} />
            <Material isPhantom={isPhantom} color="#111111" />
        </mesh>
        <mesh position={[0, 0.1, 0.26]}>
            <boxGeometry args={[0.8, 0.2, 0.05]} />
            <Material isPhantom={isPhantom} color="#8B4513" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const DiningTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.8, 0.05, 0.9]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.375, z]}>
                <boxGeometry args={[0.07, 0.75, 0.07]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const DiningChair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.5, 0.08, 0.5]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.7, -0.22]}>
            <boxGeometry args={[0.5, 0.6, 0.08]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0.1} />
        </mesh>
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.18, z]}>
                <cylinderGeometry args={[0.025, 0.025, 0.36, 12]} />
                <Material isPhantom={isPhantom} color="#2C3A59" roughness={0.6} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const OutdoorTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.05, 0.1, 0.7, 16]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Grill = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.7, 0.2, 0.5]} />
            <Material isPhantom={isPhantom} color="#333333" />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.7, 0.05, 0.5]} />
            <Material isPhantom={isPhantom} color="#555555" />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 16]} />
            <Material isPhantom={isPhantom} color="#444444" />
        </mesh>
        {[[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.05, z]}>
                <cylinderGeometry args={[0.03, 0.03, 0.1, 12]} />
                <Material isPhantom={isPhantom} color="#222222" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const GardenBench = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.5, 0.1, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.45, -0.2]}>
            <boxGeometry args={[1.5, 0.4, 0.1]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[[-0.7, 0.05, -0.2], [0.7, 0.05, -0.2], [-0.7, 0.05, 0.2], [0.7, 0.05, 0.2]].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
                <boxGeometry args={[0.05, 0.5, 0.05]} />
                <Material isPhantom={isPhantom} color="#4B5563" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Sofa = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.6, 0.3, 0.8]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.5, 0.15, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.6, -0.3]}>
            <boxGeometry args={[1.5, 0.4, 0.1]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[-0.8, 0.45, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0.8, 0.45, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[[-0.75, 0.05, -0.3], [0.75, 0.05, -0.3], [-0.75, 0.05, 0.3], [0.75, 0.05, 0.3]].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
                <cylinderGeometry args={[0.03, 0.03, 0.1, 16]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Bed = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.9, 0.3, 1.3]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.8, 0.2, 1.2]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Lamp = React.memo(({ color, rotation, isHighlighted, isPhantom, isOn = true }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
            <Material isPhantom={isPhantom} color="#3A3A3A" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 16]} />
            <Material isPhantom={isPhantom} color="#5A5A5A" />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.25, 0.3, 32]} />
            <Material isPhantom={isPhantom} color={color} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
        {!isPhantom && isOn && (<pointLight intensity={10} distance={10} color={color} position={[0, 1.0, 0]} decay={2} />)}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Dresser = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.2, 0.9, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[0.25, -0.25].map((x, i) => (
            <mesh key={i} position={[x, 0.45, 0.26]}>
                <boxGeometry args={[0.5, 0.8, 0.05]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {[0.15, -0.15].map((y, i) => (
            <mesh key={i} position={[0, 0.6 + y, 0.28]}>
                <boxGeometry args={[0.1, 0.02, 0.05]} />
                <Material isPhantom={isPhantom} color="#FFD700" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Nightstand = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.5, 0.6, 0.4]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.45, 0.21]}>
            <boxGeometry args={[0.4, 0.2, 0.02]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        <mesh position={[0, 0.15, 0.21]}>
            <boxGeometry args={[0.4, 0.2, 0.02]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        <mesh position={[0, 0.45, 0.22]}>
            <boxGeometry args={[0.1, 0.02, 0.02]} />
            <Material isPhantom={isPhantom} color="#FFD700" />
        </mesh>
        <mesh position={[0, 0.15, 0.22]}>
            <boxGeometry args={[0.1, 0.02, 0.02]} />
            <Material isPhantom={isPhantom} color="#FFD700" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Wardrobe = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[1.5, 2.2, 0.6]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[-0.35, 0.35].map((x, i) => (
            <mesh key={i} position={[x, 1.1, 0.31]}>
                <boxGeometry args={[0.7, 2.0, 0.05]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {[[-0.6, 1.1, 0.33], [0.6, 1.1, 0.33]].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
                <Material isPhantom={isPhantom} color="#FFD700" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Cabinet = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 2, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[-0.25, 1, 0.26]}>
            <boxGeometry args={[0.48, 1.8, 0.05]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0.25, 1, 0.26]}>
            <boxGeometry args={[0.48, 1.8, 0.05]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 1, 0.28]}>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
                <Material isPhantom={isPhantom} color="#FFD700" />
            </mesh>
        ))}
        {[0.5, 1.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
                <boxGeometry args={[0.9, 0.05, 0.4]} />
                <Material isPhantom={isPhantom} color="#4B5563" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const KitchenCabinet = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[-0.25, 0.5, 0.26]}>
            <boxGeometry args={[0.48, 0.8, 0.05]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0.25, 0.5, 0.26]}>
            <boxGeometry args={[0.48, 0.8, 0.05]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 0.5, 0.28]}>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
                <Material isPhantom={isPhantom} color="#FFD700" />
            </mesh>
        ))}
        <mesh position={[0, 1.025, 0]}>
            <boxGeometry args={[1, 0.05, 0.5]} />
            <Material isPhantom={isPhantom} color="#6B7280" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const KitchenTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.2, 0.05, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.375, z]}>
                <boxGeometry args={[0.07, 0.75, 0.07]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Toilet = React.memo(({ color = "#ffffff", rotation = 0, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0} />
        </mesh>
        <mesh position={[0, 0.65, 0]} rotation={[-0.1, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0} />
        </mesh>
        <mesh position={[0, 0.9, -0.3]}>
            <boxGeometry args={[0.5, 0.4, 0.15]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0} />
        </mesh>
        <mesh position={[0, 1.1, -0.3]}>
            <boxGeometry args={[0.5, 0.05, 0.15]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.4} metalness={0} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Sink = React.memo(({ color = "#ffffff", rotation = 0, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.7, 0.35, 0.5]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.3} metalness={0} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.55, 0.15, 0.35]} />
            <Material isPhantom={isPhantom} color="#e6f0f7" roughness={0.2} metalness={0} transparent opacity={0.85} />
        </mesh>
        <group position={[0.2, 0.65, 0]}>
            <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.25, 32]} />
                <Material isPhantom={isPhantom} color="#888888" metalness={1} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.125, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.07, 0.02, 16, 100, Math.PI * 0.8]} />
                <Material isPhantom={isPhantom} color="#888888" metalness={1} roughness={0.25} />
            </mesh>
        </group>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Bathtub = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.7, 0.6, 0.8]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.6, 0.5, 0.7]} />
            <Material isPhantom={isPhantom} color="#ADD8E6" transparent opacity={0.7} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Shower = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, WALL_HEIGHT / 2, 0]}>
            <boxGeometry args={[0.9, WALL_HEIGHT, 0.9]} />
            <Material isPhantom={isPhantom} color="#ADD8E6" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 16]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.3, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <Material isPhantom={isPhantom} color="#AAAAAA" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Desk = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.73, 0]}>
            <boxGeometry args={[1.4, 0.04, 0.7]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[-0.6, 0.375, -0.25]}>
            <boxGeometry args={[0.05, 0.75, 0.4]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        <mesh position={[0.6, 0.375, -0.25]}>
            <boxGeometry args={[0.05, 0.75, 0.4]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        <mesh position={[-0.3, 0.5, 0.25]}>
            <boxGeometry args={[0.5, 0.4, 0.4]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const OfficeChair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.7, -0.2]}>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 5]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const FilingCabinet = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[0.5, 1.5, 0.5]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {[0.4, 0, -0.4].map((y, i) => (
            <mesh key={i} position={[0, 0.75 + y, 0.26]}>
                <boxGeometry args={[0.45, 0.4, 0.05]} />
                <Material isPhantom={isPhantom} color="#2C3A59" />
            </mesh>
        ))}
        {[0.4, 0, -0.4].map((y, i) => (
            <mesh key={i} position={[0, 0.75 + y, 0.28]}>
                <boxGeometry args={[0.1, 0.02, 0.05]} />
                <Material isPhantom={isPhantom} color="#FFD700" />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Painting = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, WALL_HEIGHT / 2, -0.49]}>
            <boxGeometry args={[1.0, 0.8, 0.02]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT / 2, -0.48]}>
            <boxGeometry args={[1.05, 0.85, 0.01]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Door = React.memo(({ color = '#5A2D0C', rotation = 0, isHighlighted, isPhantom }) => {
    const wallThickness = CELL_SIZE;
    const frameDepth = wallThickness - 0.04;

  return (
    <group rotation={[0, rotation, 0]}>
      <mesh position={[0, (WALL_HEIGHT * 0.7) / 2, 0]}>
        <boxGeometry args={[0.8, WALL_HEIGHT * 0.7, 0.05]} />
        <Material isPhantom={isPhantom} color={color} roughness={0.3} metalness={0.1} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT * 0.7 + 0.025, 0]}>
        <boxGeometry args={[0.9, 0.05, frameDepth]} />
        <Material isPhantom={isPhantom} color="#3B2A1A" roughness={0.4} />
      </mesh>

      <mesh position={[-0.425, (WALL_HEIGHT * 0.7) / 2, 0]}>
        <boxGeometry args={[0.05, WALL_HEIGHT * 0.7, frameDepth]} />
        <Material isPhantom={isPhantom} color="#3B2A1A" roughness={0.4} />
      </mesh>

      <mesh position={[0.425, (WALL_HEIGHT * 0.7) / 2, 0]}>
        <boxGeometry args={[0.05, WALL_HEIGHT * 0.7, frameDepth]} />
        <Material isPhantom={isPhantom} color="#3B2A1A" roughness={0.4} />
      </mesh>

      <mesh position={[0.3, (WALL_HEIGHT * 0.7) / 2, 0.08]}>
        <boxGeometry args={[0.1, 0.02, 0.02]} />
        <Material isPhantom={isPhantom} color="#FFD700" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[0.3, (WALL_HEIGHT * 0.7) / 2, -0.08]}>
        <boxGeometry args={[0.1, 0.02, 0.02]} />
        <Material isPhantom={isPhantom} color="#FFD700" metalness={1} roughness={0.15} />
      </mesh>

      {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
  );
});

const NarrowDoor = React.memo(({ color = '#5A2D0C', rotation = 0, isHighlighted, isPhantom }) => {
    const frameDepth = 0.18; // wallThickness (0.2) - 0.02
    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, (WALL_HEIGHT * 0.7) / 2, 0]}>
                <boxGeometry args={[0.8, WALL_HEIGHT * 0.7, 0.05]} />
                <Material isPhantom={isPhantom} color={color} roughness={0.3} metalness={0.1} />
            </mesh>
            
            <mesh position={[0, WALL_HEIGHT * 0.7 + 0.025, 0]}>
                <boxGeometry args={[0.9, 0.05, frameDepth]} />
                <Material isPhantom={isPhantom} color="#3B2A1A" roughness={0.4} />
            </mesh>
            
            <mesh position={[-0.425, (WALL_HEIGHT * 0.7) / 2, 0]}>
                <boxGeometry args={[0.05, WALL_HEIGHT * 0.7, frameDepth]} />
                <Material isPhantom={isPhantom} color="#3B2A1A" roughness={0.4} />
            </mesh>
            
            <mesh position={[0.425, (WALL_HEIGHT * 0.7) / 2, 0]}>
                <boxGeometry args={[0.05, WALL_HEIGHT * 0.7, frameDepth]} />
                <Material isPhantom={isPhantom} color="#3B2A1A" roughness={0.4} />
            </mesh>

            <mesh position={[0.3, (WALL_HEIGHT * 0.7) / 2, 0.08]}>
                <boxGeometry args={[0.1, 0.02, 0.02]} />
                <Material isPhantom={isPhantom} color="#FFD700" metalness={1} roughness={0.15} />
            </mesh>
            <mesh position={[0.3, (WALL_HEIGHT * 0.7) / 2, -0.08]}>
                <boxGeometry args={[0.1, 0.02, 0.02]} />
                <Material isPhantom={isPhantom} color="#FFD700" metalness={1} roughness={0.15} />
            </mesh>
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Window = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const windowHeight = WALL_HEIGHT * 0.7;
    const totalWidth = 0.9;
    const wallThickness = CELL_SIZE;
    const frameWidth = 0.05;
    const frameDepth = wallThickness - 0.04;

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, windowHeight / 2, 0]}>
                <boxGeometry args={[totalWidth - 2 * frameWidth, windowHeight - 2 * frameWidth, 0.01]} />
                <Material isPhantom={isPhantom} color={"#ADD8E6"} transparent opacity={0.5} roughness={0.1} metalness={0.2} />
            </mesh>

            <mesh position={[0, windowHeight - frameWidth / 2, 0]}>
                <boxGeometry args={[totalWidth, frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>

            <mesh position={[0, frameWidth / 2, 0]}>
                <boxGeometry args={[totalWidth, frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>

            <mesh position={[-totalWidth / 2 + frameWidth / 2, windowHeight / 2, 0]}>
                <boxGeometry args={[frameWidth, windowHeight - 2 * frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>

            <mesh position={[totalWidth / 2 - frameWidth / 2, windowHeight / 2, 0]}>
                <boxGeometry args={[frameWidth, windowHeight - 2 * frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const NarrowWindow = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const windowHeight = WALL_HEIGHT;
    const totalWidth = 0.9;
    const wallThickness = 0.2;
    const frameWidth = 0.05;
    const frameDepth = wallThickness - 0.02;

    return (
        <group rotation={[0, rotation, 0]}>
            
            <mesh position={[0, windowHeight / 2, 0]}>
                <boxGeometry args={[totalWidth - 2 * frameWidth, windowHeight - 2 * frameWidth, 0.01]} />
                <Material isPhantom={isPhantom} color={"#ADD8E6"} transparent opacity={0.5} roughness={0.1} metalness={0.2} />
            </mesh>
            
            <mesh position={[0, windowHeight - frameWidth / 2, 0]}>
                <boxGeometry args={[totalWidth, frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>
            
            <mesh position={[0, frameWidth / 2, 0]}>
                <boxGeometry args={[totalWidth, frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>
            
            <mesh position={[-totalWidth / 2 + frameWidth / 2, windowHeight / 2, 0]}>
                <boxGeometry args={[frameWidth, windowHeight - 2 * frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>
            
            <mesh position={[totalWidth / 2 - frameWidth / 2, windowHeight / 2, 0]}>
                <boxGeometry args={[frameWidth, windowHeight - 2 * frameWidth, frameDepth]} />
                <Material isPhantom={isPhantom} color="#A0AEC0" />
            </mesh>

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});


const TV = React.memo(({ color, rotation, isHighlighted, isPhantom, isOn = true }) => (
  <group rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.65, 0]}>
      <boxGeometry args={[1.2, 0.7, 0.04]} />
      <Material isPhantom={isPhantom} color="#1a1a1a" />
    </mesh>
    <mesh position={[0, 0.65, 0.021]}>
      <planeGeometry args={[1.18, 0.68]} />
      <meshStandardMaterial
        color={isOn ? "#E1E6F0" : "#050505"}
        emissive={isOn ? "#E1E6F0" : "#000000"}
        emissiveIntensity={isOn ? 0.7 : 0}
      />
    </mesh>
    <mesh position={[0, 0.25, -0.05]}>
      <boxGeometry args={[0.08, 0.35, 0.08]} />
      <Material isPhantom={isPhantom} color={color} metalness={0.4} roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.05, -0.05]}>
      <boxGeometry args={[0.6, 0.05, 0.3]} />
      <Material isPhantom={isPhantom} color={color} metalness={0.4} roughness={0.6} />
    </mesh>
    {!isPhantom && isOn && (
      <pointLight intensity={2} distance={4} color={"#E1E6F0"} position={[0, 0.65, 0.5]} />
    )}
    {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
  </group>
));


const Console = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.6]} />
            <Material isPhantom={isPhantom} color="#2C3A59" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const ComputerSetup = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
  <group rotation={[0, rotation, 0]}>
    {/* Стільниця */}
    <mesh position={[0, 0.4, 0]}>
      <boxGeometry args={[1.6, 0.05, 0.7]} />
      <Material isPhantom={isPhantom} color={color} metalness={0.2} roughness={0.6} />
    </mesh>

    {/* Ніжки столу */}
    {[[-0.75, 0.35], [0.75, 0.35], [-0.75, -0.35], [0.75, -0.35]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.2, z]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />
        <Material isPhantom={isPhantom} color={"#2C3A59"} metalness={0.3} roughness={0.5} />
      </mesh>
    ))}

    {/* Монітор на кронштейні */}
    <group position={[0, 0.85, -0.2]}>
      <mesh>
        <boxGeometry args={[0.7, 0.4, 0.05]} />
        <Material isPhantom={isPhantom} color={"#2C3A59"} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[0.65, 0.35, 0.01]} />
        <Material isPhantom={isPhantom} color={"#111111"} metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 12]} />
        <Material isPhantom={isPhantom} color={"#4B5563"} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>

    {/* Компактний системний блок на столі зліва */}
    <mesh position={[-0.55, 0.55, 0]}>
      <boxGeometry args={[0.25, 0.45, 0.35]} />
      <Material isPhantom={isPhantom} color={"#2C3A59"} metalness={0.3} roughness={0.5} />
    </mesh>
    <mesh position={[-0.55, 0.55, 0]}>
      <boxGeometry args={[0.23, 0.42, 0.32]} />
      <Material isPhantom={isPhantom} color={"#111111"} metalness={0.5} roughness={0.2} />
    </mesh>

    {/* Клавіатура */}
    <mesh position={[0.2, 0.43, 0.15]}>
      <boxGeometry args={[0.5, 0.02, 0.15]} />
      <Material isPhantom={isPhantom} color={"#4B5563"} metalness={0.2} roughness={0.6} />
    </mesh>

    {/* Миша */}
    <mesh position={[0.6, 0.43, 0.2]}>
      <boxGeometry args={[0.1, 0.02, 0.07]} />
      <Material isPhantom={isPhantom} color={"#111111"} metalness={0.5} roughness={0.3} />
    </mesh>

    {isHighlighted && <Outlines thickness={0.02} color={"#FFFF00"} opacity={1} />}
  </group>
));

const CeilingLamp = React.memo(({ color, rotation, isHighlighted, isPhantom, isOn = true }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, WALL_HEIGHT - 0.1, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.4, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <Material isPhantom={isPhantom} color={color} transparent opacity={0.7} />
        </mesh>
        {!isPhantom && isOn && (<pointLight intensity={10} distance={10} color={color} position={[0, WALL_HEIGHT - 0.4, 0]} decay={2} />)}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const RgbStrip = React.memo(({ color, rotation, isHighlighted, isPhantom, isOn = true }) => {
    const [rgbColor, setRgbColor] = useState(new THREE.Color(color));
    useEffect(() => {
        if (!isPhantom && isOn) {
            const interval = setInterval(() => {
                setRgbColor(new THREE.Color(Math.random() * 0xffffff));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isPhantom, isOn]);

    const finalColor = isOn ? rgbColor : new THREE.Color("#333333");

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[1, 0.02, 0.05]} />
                <Material isPhantom={isPhantom} color={finalColor} emissive={finalColor} emissiveIntensity={isOn ? 0.5 : 0} />
            </mesh>
            {!isPhantom && isOn && <pointLight intensity={5} distance={2} color={rgbColor} />}
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const PottedPlant = React.memo(({ color = "#2E8B57", rotation = 0, isHighlighted, isPhantom }) => {
    const Leaf = ({ position, rotation, scale = [1, 1, 1] }) => (
        <mesh position={position} rotation={rotation} scale={scale}>
            <sphereGeometry args={[0.12, 8, 4, 0, Math.PI, 0, Math.PI / 2]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.7} metalness={0.1} />
        </mesh>
    );
    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.18, 0.22, 0.3, 32]} />
                <Material isPhantom={isPhantom} color="#8B4513" roughness={0.6} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
                <Material isPhantom={isPhantom} color="#8B4513" roughness={0.6} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.17, 32]} />
                <Material isPhantom={isPhantom} color="#3B2F2F" roughness={1} metalness={0} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.03, 0.04, 0.4, 12]} />
                <Material isPhantom={isPhantom} color={color} roughness={0.8} metalness={0} />
            </mesh>
            <Leaf position={[0.1, 0.7, 0]} rotation={[0.2, 0.2, 0]} />
            <Leaf position={[-0.1, 0.72, 0.05]} rotation={[-0.3, 0.4, 0.2]} scale={[0.9, 0.9, 0.9]} />
            <Leaf position={[0.05, 0.8, -0.1]} rotation={[0.4, -0.1, -0.3]} />
            <Leaf position={[-0.08, 0.85, 0]} rotation={[0, 0.3, -0.4]} />
            <Leaf position={[0, 0.88, 0.08]} rotation={[-0.2, -0.1, 0.3]} scale={[0.85, 0.85, 0.85]} />
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const TallPlant = React.memo(({ color = "#3CB371", rotation = 0, isHighlighted, isPhantom }) => {
    const Leaf = ({ position, rotation, size }) => (
        <>
            <mesh position={position} rotation={rotation}>
                <planeGeometry args={size} />
                <Material isPhantom={isPhantom} color={color} roughness={0.7} metalness={0} />
            </mesh>
            <mesh position={position} rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]}>
                <planeGeometry args={size} />
                <Material isPhantom={isPhantom} color={color} roughness={0.7} metalness={0} />
            </mesh>
        </>
    );
    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.2, 0.25, 0.2, 16]} />
                <Material isPhantom={isPhantom} color="#696969" roughness={0.6} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
                <Material isPhantom={isPhantom} color="#556B2F" roughness={0.8} metalness={0} />
            </mesh>
            <Leaf position={[0.2, 1.2, 0]} rotation={[0, 0, Math.PI / 4]} size={[0.1, 0.6]} />
            <Leaf position={[-0.1, 1.0, 0.1]} rotation={[0, 0, -Math.PI / 6]} size={[0.1, 0.5]} />
            <Leaf position={[0, 0.9, -0.2]} rotation={[Math.PI / 6, 0, 0]} size={[0.4, 0.1]} />
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Rug = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.011, 0]}>
            <boxGeometry args={[2.0, 0.02, 3.0]} />
            <Material isPhantom={isPhantom} color={color} roughness={0.9} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Mirror = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
  const mirrorRef = useRef();
  const { scene, gl } = useThree();
  const renderTarget = useMemo(() => new THREE.WebGLRenderTarget(512, 512), []);
  const renderedRef = useRef(false);

  useFrame(() => {
    if (!renderedRef.current) {
      const currentBackground = scene.background;
      scene.background = null;
      gl.setRenderTarget(renderTarget);
      gl.render(scene, mirrorRef.current);
      gl.setRenderTarget(null);
      scene.background = currentBackground;
      renderedRef.current = true;
    }
  });

  return (
    <group rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.6, 1.6, 0.05]} />
        <Material isPhantom={isPhantom} color={color} />
      </mesh>

      <mesh position={[0, 0, 0.026]} ref={mirrorRef}>
        <planeGeometry args={[0.55, 1.55]} />
        <meshStandardMaterial
          map={renderTarget.texture}
          metalness={1}
          roughness={0.1}
        />
      </mesh>

      {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
  );
});

const BarStool = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 32]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.37, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 16]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
            <Material isPhantom={isPhantom} color="#4B5563" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Aquarium = React.memo(({ color, rotation, isHighlighted, isPhantom, isOn = true }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.0, 0.6, 0.4]} />
            <Material isPhantom={isPhantom} color="#ADD8E6" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[1.05, 0.1, 0.45]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.05, 0.05, 0.45]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {!isPhantom && isOn && <pointLight intensity={2} distance={3} color="#5F9EA0" position={[0, 0.3, 0]} />}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Piano = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.4, -0.2]}>
            <boxGeometry args={[1.4, 0.8, 1.0]} />
            <Material isPhantom={isPhantom} color={color} metalness={0.2} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0.4]}>
            <boxGeometry args={[1.2, 0.1, 0.4]} />
            <Material isPhantom={isPhantom} color="#f0f0f0" />
        </mesh>
        <mesh position={[0, 0.42, 0.45]}>
            <boxGeometry args={[1.1, 0.05, 0.3]} />
            <Material isPhantom={isPhantom} color="#1a1a1a" />
        </mesh>
        {[[-0.6, -0.6], [0.6, -0.6], [0, 0.7]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.15, z]}>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
                <Material isPhantom={isPhantom} color={color} />
            </mesh>
        ))}
        <mesh position={[0, 0.82, -0.2]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[1.4, 0.04, 1.0]} />
            <Material isPhantom={isPhantom} color={color} metalness={0.2} roughness={0.3} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const BeanBag = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.4, 32, 16]} />
            <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.2, 0.1]} scale={[1.1, 0.8, 1.1]}>
            <sphereGeometry args={[0.35, 32, 16]} />
            <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const WallShelf = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.2, 0.05, 0.25]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        <mesh position={[0, -0.025, -0.1]}>
            <boxGeometry args={[1.2, 0.1, 0.05]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const ProjectorScreen = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 1.8, 0]}>
            <boxGeometry args={[2.0, 1.2, 0.05]} />
            <Material isPhantom={isPhantom} color="#111111" />
        </mesh>
        <mesh position={[0, 1.8, 0.03]}>
            <planeGeometry args={[1.95, 1.15]} />
            <Material isPhantom={isPhantom} color="#FFFFFF" />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const BarTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.6, 1.0, 1.2]} />
            <Material isPhantom={isPhantom} color={color} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const WallMountedTV = React.memo(({ color, rotation, isHighlighted, isPhantom, isOn = true }) => (
    <group rotation={[0, rotation, 0]}>
        <group position={[0, 0, -0.47]}>
            <mesh>
                <boxGeometry args={[1.2, 0.7, 0.06]} />
                <Material isPhantom={isPhantom} color="#111111" />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
                <planeGeometry args={[1.15, 0.65]} />
                <meshStandardMaterial color={isOn ? "#E1E6F0" : "#050505"} emissive={isOn ? "#E1E6F0" : "#000000"} emissiveIntensity={isOn ? 0.7 : 0} />
            </mesh>
            {!isPhantom && isOn && <pointLight intensity={2} distance={4} color={"#E1E6F0"} position={[0, 0, 0.5]} />}
        </group>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const NarrowWall = React.memo(({ color, hasOpening, isHighlighted, furnitureType }) => {
    const wallThickness = 0.2;
    const zOffset = 0;
    if (hasOpening) {
        const openingWidth = 0.9; // Same as narrow window/door
        const isWindow = furnitureType === 'narrowWindow';
        const openingHeight = isWindow ? WALL_HEIGHT : WALL_HEIGHT * 0.7;
        const sideWidth = (CELL_SIZE - openingWidth) / 2;
        return (
            <group>
                {/* Left part */}
                <mesh position={[-CELL_SIZE / 2 + sideWidth / 2, WALL_HEIGHT / 2, zOffset]}>
                    <boxGeometry args={[sideWidth, WALL_HEIGHT, wallThickness]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Right part */}
                <mesh position={[CELL_SIZE / 2 - sideWidth / 2, WALL_HEIGHT / 2, zOffset]}>
                    <boxGeometry args={[sideWidth, WALL_HEIGHT, wallThickness]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Top part */}
                {!isWindow && (
                    <mesh position={[0, openingHeight + (WALL_HEIGHT - openingHeight) / 2, zOffset]}>
                        <boxGeometry args={[openingWidth, WALL_HEIGHT - openingHeight, wallThickness]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                )}
                {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
            </group>
        );
    }
    return (
        <mesh position={[0, WALL_HEIGHT / 2, zOffset]}>
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, wallThickness]} />
            <meshStandardMaterial color={color} />
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </mesh>
    );
});

const CornerWall = React.memo(({ color, isHighlighted }) => {
    const wallThickness = 0.2;
    return (
        <group>
            <mesh position={[-0.25, WALL_HEIGHT / 2, 0]}>
                <boxGeometry args={[0.5, WALL_HEIGHT, wallThickness]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, WALL_HEIGHT / 2, -0.25]}>
                <boxGeometry args={[wallThickness, WALL_HEIGHT, 0.5]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, WALL_HEIGHT / 2, 0]}>
                <boxGeometry args={[wallThickness, WALL_HEIGHT, wallThickness]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const WallPhantom = React.memo(({ hasOpening, wallType }) => {
    if (hasOpening) {
        return (
            <group>
                <mesh position={[-0.45, WALL_HEIGHT / 2, 0]} material={phantomMaterial}>
                    <boxGeometry args={[0.1, WALL_HEIGHT, CELL_SIZE]} />
                </mesh>
                <mesh position={[0.45, WALL_HEIGHT / 2, 0]} material={phantomMaterial}>
                    <boxGeometry args={[0.1, WALL_HEIGHT, CELL_SIZE]} />
                </mesh>
                <mesh position={[0, WALL_HEIGHT - 0.05 / 2, 0]} material={phantomMaterial}>
                    <boxGeometry args={[CELL_SIZE, 0.05, CELL_SIZE]} />
                </mesh>
            </group>
        );
    }

    const wallThickness = 0.2;
    switch (wallType) {
        case TOOL_TYPES.narrowWall:
            return (
                <mesh position={[0, WALL_HEIGHT / 2, -0.5 + wallThickness / 2]} material={phantomMaterial}>
                    <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, wallThickness]} />
                </mesh>
            );
        case TOOL_TYPES.cornerWall:
            return (
                <group>
                    <mesh position={[0, WALL_HEIGHT / 2, -0.5 + wallThickness / 2]} material={phantomMaterial}>
                        <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, wallThickness]} />
                    </mesh>
                    <mesh position={[-0.5 + wallThickness / 2, WALL_HEIGHT / 2, 0]} material={phantomMaterial}>
                        <boxGeometry args={[wallThickness, WALL_HEIGHT, CELL_SIZE]} />
                    </mesh>
                </group>
            );
        default: // wall
            return (
                <mesh position={[0, WALL_HEIGHT / 2, 0]} material={phantomMaterial}>
                    <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
                </mesh>
            );
    }
});

const Wall = React.memo(({ color, hasOpening, isHighlighted, furnitureType }) => {
    if (hasOpening) {
        const openingWidth = 0.9;
        const openingHeight = WALL_HEIGHT * 0.7;
        const sideWidth = (CELL_SIZE - openingWidth) / 2;

        return (
            <group>
                {/* Left part */}
                <mesh position={[-CELL_SIZE / 2 + sideWidth / 2, WALL_HEIGHT / 2, 0]}>
                    <boxGeometry args={[sideWidth, WALL_HEIGHT, CELL_SIZE]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Right part */}
                <mesh position={[CELL_SIZE / 2 - sideWidth / 2, WALL_HEIGHT / 2, 0]}>
                    <boxGeometry args={[sideWidth, WALL_HEIGHT, CELL_SIZE]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Top part (lintel) */}
                <mesh position={[0, openingHeight + (WALL_HEIGHT - openingHeight) / 2, 0]}>
                    <boxGeometry args={[openingWidth, WALL_HEIGHT - openingHeight, CELL_SIZE]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
            </group>
        );
    }
    return (
        <mesh position={[0, WALL_HEIGHT / 2, 0]}>
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
            <meshStandardMaterial color={color} />
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </mesh>
    );
});

const FloorPhantom = React.memo(() => (
    <mesh material={phantomMaterial}>
        <boxGeometry args={[1, 0.1, 1]} />
    </mesh>
));

const FURNITURE_COMPONENTS = {
    sofa: Sofa, chair: Chair, table: Table, coffeeTable: CoffeeTable, bookshelf: Bookshelf, armchair: Armchair, fireplace: Fireplace, door: Door, window: Window, kitchenTable: KitchenTable, kitchenCabinet: KitchenCabinet, outdoorChair: OutdoorChair, outdoorTable: OutdoorTable, grill: Grill, gardenBench: GardenBench, bed: Bed, lamp: Lamp, cabinet: Cabinet, dresser: Dresser, nightstand: Nightstand, wardrobe: Wardrobe, tv: TV, console: Console, computerSetup: ComputerSetup, ceilingLamp: CeilingLamp, rgbStrip: RgbStrip, pottedPlant: PottedPlant, tallPlant: TallPlant, toilet: Toilet, sink: Sink, bathtub: Bathtub, shower: Shower, desk: Desk, officeChair: OfficeChair, filingCabinet: FilingCabinet, diningTable: DiningTable, diningChair: DiningChair,
    rug: Rug, mirror: Mirror, barStool: BarStool, aquarium: Aquarium, piano: Piano, beanBag: BeanBag, wallShelf: WallShelf, projectorScreen: ProjectorScreen, barTable: BarTable, wallMountedTV: WallMountedTV, narrowDoor: NarrowDoor, narrowWindow: NarrowWindow
};

const Tutorial = ({ show, onClose }) => {
    const [step, setStep] = useState(0);

    const steps = useMemo(() => [
        { title: "Ласкаво просимо до RoomCraft редактор!", text: `Давайте швидко освоїмо основи. Натисніть "Далі", щоб почати.` },
        { title: "Інструменти та Кольори", text: `У лівій панелі ви знайдете інструменти (🧱, ⬜) та палітру кольорів. Виберіть потрібний інструмент і колір, щоб почати.` },
        { title: "Створення Підлоги та Стін", text: `Виберіть інструмент "⬜ Підлога" або "🧱 Стіна". Клацніть ЛІВОЮ кнопкою миші на сітці та, не відпускаючи, ведіть курсор, щоб розмістити об'єкти.` },
        { title: "Розміщення Меблів (Перетягування)", text: `Клацніть ЛІВОЮ кнопкою миші на предметі в інвентарі та, не відпускаючи, перетягніть його на потрібну плитку підлоги. Відпустіть кнопку, щоб розмістити.` },
        { title: "Дії з об'єктами (Правий Клік)", text: `Ви можете пофарбувати, підняти/опустити, видалити, повернути або притулити до стіни будь-який об'єкт, клацнувши по ньому ПРАВОЮ кнопкою миші та обравши дію в меню.` },
        { title: "Обертання Об'єктів (Клавіша)", text: `Щоб обернути об'єкт (фантомний під час перетягування або вже розміщений), наведіть на нього курсор і натисніть "R" на клавіатурі.` },
        { title: "Прив'язка до Стіни (Клавіша)", text: `Щоб прив'язати меблі до краю блоку (до стіни), наведіть на об'єкт і натисніть "T". Об'єкт переміститься до найближчої стіни замість центру блоку.` },
        { title: "Історія Змін (Undo/Redo)", text: `Використовуйте кнопки "Назад" та "Вперед" у лівій панелі або комбінації клавіш Ctrl+Z / Ctrl+Shift+Z для скасування та повторення дій.` },
        { title: "Збереження при виході", text: `Ваш прогрес автоматично зберігається при натисканні кнопки "Вийти".` },
        { title: "Керування Камерою (Клавіатура)", text: `Використовуйте клавіші WASD для переміщення вперед/назад/вбік.\nВикористовуйте E для руху вгору та Q для руху вниз.\nВикористовуйте стрілки вліво/вправо для повороту камери.\nВикористовуйте стрілки вгору/вниз для нахилу камери.` },
        { title: "Готово!", text: `Ви освоїли основи! Насолоджуйтесь створенням свого дизайну!` }
    ], []);

    if (!show) return null;
    const handleNext = () => { if (step < steps.length - 1) { setStep(step + 1); } else { onClose(); setStep(0); localStorage.setItem('hasSeenTutorial', 'true'); } };
    const handleSkip = () => { onClose(); setStep(0); localStorage.setItem('hasSeenTutorial', 'true'); };
    return (<div style={styles.tutorialModal}><div style={styles.tutorialContent}><h2 style={styles.tutorialTitle}>{steps[step].title}</h2><p style={styles.tutorialText}>{steps[step].text}</p><div style={styles.tutorialButtonContainer}>{step < steps.length - 1 ? (<HoverButton onClick={handleSkip} style={{ ...styles.buttonBase, ...styles.tutorialSkipButton }} hoverStyle={styles.tutorialSkipButtonHover}>Пропустити</HoverButton>) : (<div />)}<HoverButton onClick={handleNext} style={{ ...styles.buttonBase, ...styles.tutorialNextButton, marginLeft: step < steps.length - 1 ? 'auto' : '0' }} hoverStyle={styles.tutorialNextButtonHover}>{step < steps.length - 1 ? 'Далі' : 'Почати'}</HoverButton></div></div></div>);
};

const GraphicsSettingsModal = ({ show, onClose, settings, onSettingsChange, onPresetChange }) => {
    if (!show) return null;

    const handleToggle = (key) => {
        onSettingsChange(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSelectChange = (e, key) => {
        onSettingsChange(prev => ({ ...prev, [key]: parseFloat(e.target.value) }));
    }

    const getActivePreset = (s) => {
        if (s.dpr === 0.5 && s.msaaSamples === 0 && !s.reflections && !s.shadows) return 'Низькі';
        if (s.dpr === 0.75 && s.msaaSamples === 2 && !s.reflections && s.shadows) return 'Середні';
        if (s.dpr === 1 && s.msaaSamples === 4 && s.reflections && s.shadows) return 'Високі';
        if (s.dpr === 1.5 && s.msaaSamples === 8 && s.reflections && s.shadows) return 'Ультра';
        return 'Користувацькі';
    };

    const activePreset = getActivePreset(settings);

    const presetButtonStyle = {
        padding: '8px 12px',
        border: '1px solid var(--accent)',
        background: 'transparent',
        color: 'var(--text-color-light)',
        borderRadius: '5px',
        cursor: 'pointer',
        textAlign: 'center',
        flexGrow: 1,
    };

    const presetButtonActiveStyle = {
        ...presetButtonStyle,
        background: 'var(--accent)',
        color: 'white',
    };

    const controlBaseStyle = {
        padding: '8px 12px',
        border: '1px solid var(--accent)',
        borderRadius: '5px',
        cursor: 'pointer',
        textAlign: 'center',
        minWidth: '120px',
        fontSize: '1em',
    };

    const settingToggleStyle = {
        ...controlBaseStyle,
        background: 'transparent',
        color: 'var(--text-color-light)',
    };

    const settingToggleActiveStyle = {
        ...settingToggleStyle,
        background: 'var(--accent)',
        color: 'white',
    };

    const selectControlStyle = {
        ...controlBaseStyle,
        background: 'var(--text-color-light)',
        color: 'var(--primary-darker)',
        appearance: 'none',
        fontWeight: '600',
    };

    const presets = ['Низькі', 'Середні', 'Високі', 'Ультра', 'Користувацькі'];

    return (
        <div style={styles.tutorialModal}>
            <div style={{ ...styles.tutorialContent, maxWidth: '500px', gap: '15px' }}>
                <h2 style={styles.tutorialTitle}>Налаштування графіки</h2>

                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
                    {presets.map(preset => (
                        <button
                            key={preset}
                            onClick={() => preset !== 'Користувацькі' && onPresetChange(preset)}
                            style={preset === activePreset ? presetButtonActiveStyle : presetButtonStyle}
                            disabled={preset === 'Користувацькі'}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', padding: '10px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1em' }}>Масштаб рендера</span>
                        <select value={settings.dpr} onChange={(e) => handleSelectChange(e, 'dpr')} style={selectControlStyle}>
                            <option value={0.5}>50%</option>
                            <option value={0.75}>75%</option>
                            <option value={1}>100%</option>
                            <option value={1.5}>150%</option>
                            <option value={2}>200%</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1em' }}>Згладжування (MSAA)</span>
                        <select value={settings.msaaSamples} onChange={(e) => handleSelectChange(e, 'msaaSamples')} style={selectControlStyle}>
                            <option value={0}>Вимк.</option>
                            <option value={2}>2x</option>
                            <option value={4}>4x</option>
                            <option value={8}>8x</option>
                            <option value={16}>16x</option>
                        </select>
                    </div>
                    {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1em' }}>Відображення в дзеркалі</span>
                        <button
                            onClick={() => handleToggle('reflections')}
                            style={settings.reflections ? settingToggleActiveStyle : settingToggleStyle}
                        >
                            {settings.reflections ? 'Увімк.' : 'Вимк.'}
                        </button>
                    </div> */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1em' }}>Динамічні тіні</span>
                        <button
                            onClick={() => handleToggle('shadows')}
                            style={settings.shadows ? settingToggleActiveStyle : settingToggleStyle}
                        >
                            {settings.shadows ? 'Увімк.' : 'Вимк.'}
                        </button>
                    </div>
                </div>
                <HoverButton onClick={onClose} style={{ ...styles.buttonBase, ...styles.tutorialNextButton, padding: '10px 20px', fontSize: '16px', marginTop: '10px', alignSelf: 'center' }} hoverStyle={styles.tutorialNextButtonHover}>Закрити</HoverButton>
            </div>
        </div>
    );
};

const GpuDetector = ({ onDetect }) => {
    const gpu = useDetectGPU();
    useEffect(() => {
        if (gpu) {
            onDetect(gpu);
        }
    }, [gpu, onDetect]);
    return null;
};

const Preloader = ({ text = "Завантаження сцени..." }) => (
    <div style={styles.preloader}>
        <p>{text}</p>
        <div className="spinner" />
        <style>{`
            .spinner {
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 4px solid var(--accent);
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

const FpsStabilizer = ({ onStable, stableFramesRequired = 30, fpsThreshold = 45 }) => {
    const frameCount = useRef(0);
    const fpsHistory = useRef([]);
    const isStable = useRef(false);

    useFrame((_, delta) => {
        if (isStable.current) return;

        frameCount.current++;
        if (frameCount.current < 60) return;

        const currentFps = 1 / delta;
        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > stableFramesRequired) {
            fpsHistory.current.shift();
        }

        if (fpsHistory.current.length === stableFramesRequired) {
            const allStable = fpsHistory.current.every(fps => fps >= fpsThreshold);
            if (allStable) {
                isStable.current = true;
                onStable();
            }
        }
    });

    return null;
};

export default function Edit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const roomId = useMemo(() => parseFloat(id), [id]);
    useEffect(() => { document.title = "RoomCraft | Редактор" });

    const [gridSize, setGridSize] = useState(INITIAL_GRID_SIZE);
    const { state, setState, undo, redo, canUndo, canRedo, resetHistory } = useHistory({ walls: {}, furniture: {}, floorTiles: {}, userColors: [] });
    const { walls, furniture, floorTiles, userColors } = state;

    const [selectedTool, setSelectedTool] = useState(TOOL_TYPES.floor);
    const [selectedColor, setSelectedColor] = useState(BASE_COLORS[0]);
    const [customColor, setCustomColor] = useState('#8B4513');
    const [roomName, setRoomName] = useState('');
    const [hoveredCell, setHoveredCell] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedType, setDraggedType] = useState(null);
    const [draggedSubType, setDraggedSubType] = useState(null);
    const [phantomObjectPosition, setPhantomObjectPosition] = useState(null);
    const [phantomObjectRotation, setPhantomObjectRotation] = useState(0);
    const [draggedItemData, setDraggedItemData] = useState(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });
    const [contextMenuTargetKey, setContextMenuTargetKey] = useState(null);
    const canvasRef = useRef();
    const [showTutorial, setShowTutorial] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', onConfirm: null, isConfirm: false });
    const [isMobile, setIsMobile] = useState(false);
    const mobileMovementInput = useRef({ forward: 0, backward: 0, left: 0, right: 0 });
    const cameraRotationInput = useRef({ yaw: 0, pitch: 0 });
    const cameraVerticalInput = useRef(0);
    const keyPressed = useRef({});
    const initialCameraQuaternion = useMemo(() => { const tempCamera = new THREE.Camera(); tempCamera.position.set(...INITIAL_CAMERA_POSITION); tempCamera.lookAt(INITIAL_LOOK_AT_TARGET); return tempCamera.quaternion.clone(); }, []);
    const targetCameraPosition = useRef(new Vector3(...INITIAL_CAMERA_POSITION));
    const targetCameraQuaternion = useRef(initialCameraQuaternion);
    const allFurnitureItems = useMemo(() => Object.values(FURNITURE_CATEGORIES).flat(), []);

    const [graphicsSettings, setGraphicsSettings] = useState({ reflections: true, shadows: true, dpr: 1, msaaSamples: 4 });
    const [showGraphicsSettings, setShowGraphicsSettings] = useState(false);
    const [isGpuReady, setIsGpuReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isTestDrive, setIsTestDrive] = useState(false);
    const [isTestDriveLoading, setIsTestDriveLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const updateState = useCallback((updater) => {
        setState(updater);
    }, [setState]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const filteredFurnitureCategories = useMemo(() => {
        if (!debouncedSearchQuery) return FURNITURE_CATEGORIES;
        const lowercasedQuery = debouncedSearchQuery.toLowerCase();
        const filtered = {};
        for (const category in FURNITURE_CATEGORIES) {
            const items = FURNITURE_CATEGORIES[category].filter(item =>
                item.label.toLowerCase().includes(lowercasedQuery)
            );
            if (items.length > 0) {
                filtered[category] = items;
            }
        }
        return filtered;
    }, [debouncedSearchQuery]);

    const handleGpuDetect = useCallback((gpu) => {
        if (isGpuReady) return;

        const savedSettings = localStorage.getItem('graphicsSettings');
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                setGraphicsSettings(parsedSettings);
            } catch (e) {
                console.error("Failed to parse graphics settings from localStorage", e);
            }
        }
        setIsGpuReady(true);
    }, [isGpuReady]);

    useEffect(() => {
        if (!isGpuReady) return;

        const timer = setTimeout(() => {
            if (isLoading) {
                setModalContent({
                    title: 'Низька продуктивність',
                    message: 'Не вдалося стабілізувати FPS. Ваше обладнання може бути недостатньо потужним для комфортної роботи. Рекомендуємо знизити налаштування графіки.',
                    onConfirm: () => {
                        setShowModal(false);
                        setShowGraphicsSettings(true);
                    },
                    isConfirm: false
                });
                setShowModal(true);
                setIsLoading(false);
            }
        }, 15000);

        return () => clearTimeout(timer);
    }, [isGpuReady, isLoading]);

    const handleGraphicsSettingsChange = (updater) => {
        const newSettings = typeof updater === 'function' ? updater(graphicsSettings) : updater;
        setGraphicsSettings(newSettings);
        localStorage.setItem('graphicsSettings', JSON.stringify(newSettings));
    };

    const handlePresetChange = (preset) => {
        let newSettings;
        switch (preset) {
            case 'Низькі':
                newSettings = { dpr: 0.5, msaaSamples: 0, reflections: false, shadows: false };
                break;
            case 'Середні':
                newSettings = { dpr: 0.75, msaaSamples: 2, reflections: false, shadows: true };
                break;
            case 'Високі':
                newSettings = { dpr: 1, msaaSamples: 4, reflections: true, shadows: true };
                break;
            case 'Ультра':
                newSettings = { dpr: 1.5, msaaSamples: 8, reflections: true, shadows: true };
                break;
            default:
                newSettings = { dpr: 1, msaaSamples: 4, reflections: true, shadows: true };
        }
        handleGraphicsSettingsChange(newSettings);
    };

    useEffect(() => {
        if (!isWebGLSupported()) { setModalContent({ title: 'Браузер/пристрій не підтримується', message: 'Ваш браузер або пристрій не підтримує WebGL, необхідний для роботи цього додатка. Будь ласка, спробуйте інший браузер або пристрій.', onConfirm: () => navigate('/'), isConfirm: false }); setShowModal(true); }
        setIsMobile(isMobileDevice());
    }, [navigate]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (canUndo) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [canUndo]);

    useEffect(() => {
        if (contextMenu.visible && contextMenu.target) {
            const menuElement = document.getElementById('context-menu-div');
            if (menuElement) {
                const { offsetWidth, offsetHeight } = menuElement;
                const { innerWidth, innerHeight } = window;
                let newX = contextMenu.x;
                let newY = contextMenu.y;

                if (newX + offsetWidth > innerWidth) {
                    newX = innerWidth - offsetWidth - 10;
                }
                if (newY + offsetHeight > innerHeight) {
                    newY = innerHeight - offsetHeight - 10;
                }

                if (newX !== contextMenu.x || newY !== contextMenu.y) {
                    setContextMenu(prev => ({ ...prev, x: newX, y: newY }));
                }
            }
        }
    }, [contextMenu]);


    const resetAllState = useCallback(() => {
        resetHistory({ walls: {}, furniture: {}, floorTiles: {}, userColors: [] });
        setGridSize(INITIAL_GRID_SIZE);
        setHoveredCell(null);
        setIsDragging(false);
        setDraggedType(null);
        setDraggedSubType(null);
        setPhantomObjectPosition(null);
        setPhantomObjectRotation(0);
        setSelectedColor(BASE_COLORS[0]);
        setDraggedItemData(null);
        targetCameraPosition.current.set(...INITIAL_CAMERA_POSITION);
        const tempCamera = new THREE.Camera();
        tempCamera.position.set(...INITIAL_CAMERA_POSITION);
        tempCamera.lookAt(INITIAL_LOOK_AT_TARGET);
        targetCameraQuaternion.current.copy(tempCamera.quaternion);
    }, [resetHistory]);

    const getKey = useCallback((x, z) => `${x},${z}`, []);
    const checkGridExpansion = useCallback((x, z) => { const threshold = gridSize * 0.8; if (Math.abs(x) > threshold || Math.abs(z) > threshold) { setGridSize((prev) => prev * 2); } }, [gridSize]);

    const updateNeighboringWindows = useCallback((x, z, currentFurnitureState) => {
        const updatedFurniture = { ...currentFurnitureState };
        const neighbors = [{ dx: -1, dz: 0 }, { dx: 1, dz: 0 }, { dx: 0, dz: -1 }, { dx: 0, dz: 1 }];
        const currentKey = getKey(x, z);
        if (!updatedFurniture[currentKey] || updatedFurniture[currentKey].type !== 'window') return updatedFurniture;

        const currentRotation = updatedFurniture[currentKey].rotation || 0;
        updatedFurniture[currentKey] = { ...updatedFurniture[currentKey], neighborLeft: false, neighborRight: false, neighborFront: false, neighborBack: false };

        neighbors.forEach(n => {
            const neighborKey = getKey(x + n.dx, z + n.dz);
            if (updatedFurniture[neighborKey] && updatedFurniture[neighborKey].type === 'window') {
                const neighborRotation = updatedFurniture[neighborKey].rotation || 0;
                if ((currentRotation === 0 || currentRotation === Math.PI) && (neighborRotation === 0 || neighborRotation === Math.PI)) {
                    if (n.dx === -1) { updatedFurniture[currentKey].neighborLeft = true; updatedFurniture[neighborKey].neighborRight = true; }
                    if (n.dx === 1) { updatedFurniture[currentKey].neighborRight = true; updatedFurniture[neighborKey].neighborLeft = true; }
                } else if ((currentRotation === Math.PI / 2 || currentRotation === 3 * Math.PI / 2) && (neighborRotation === Math.PI / 2 || neighborRotation === 3 * Math.PI / 2)) {
                    if (n.dz === -1) { updatedFurniture[currentKey].neighborFront = true; updatedFurniture[neighborKey].neighborBack = true; }
                    if (n.dz === 1) { updatedFurniture[currentKey].neighborBack = true; updatedFurniture[neighborKey].neighborFront = true; }
                }
            }
        });
        return updatedFurniture;
    }, [getKey]);

    const paintObject = useCallback((targetKey, color) => {
        if (!targetKey) return;
        updateState(prev => {
            const newState = { ...prev };
            if (newState.furniture[targetKey]) {
                newState.furniture = { ...newState.furniture, [targetKey]: { ...newState.furniture[targetKey], color: color } };
            } else if (newState.walls[targetKey]) {
                newState.walls = { ...newState.walls, [targetKey]: { ...newState.walls[targetKey], color: color } };
            } else if (newState.floorTiles[targetKey]) {
                newState.floorTiles = { ...newState.floorTiles, [targetKey]: color };
            }
            return newState;
        });
    }, [updateState]);

    const handleRotationChange = useCallback((targetKey, angleDegrees) => {
        const angleRadians = THREE.MathUtils.degToRad(angleDegrees);
        updateState(prev => {
            const newState = { ...prev };
            if (newState.furniture[targetKey]) {
                newState.furniture = { ...newState.furniture, [targetKey]: { ...newState.furniture[targetKey], rotation: angleRadians } };
            } else if (newState.walls[targetKey]) {
                newState.walls = { ...newState.walls, [targetKey]: { ...newState.walls[targetKey], rotation: angleRadians } };
            }
            return newState;
        });
    }, [updateState]);

    const rotateObject = useCallback((targetKey = null) => {
        const key = targetKey || (hoveredCell ? getKey(hoveredCell.x, hoveredCell.z) : null);
        if (!key) return;

        if (isDragging && phantomObjectPosition && draggedType === TOOL_TYPES.furniture) {
            setPhantomObjectRotation((prev) => (prev + Math.PI / 2) % (Math.PI * 2));
        } else {
            updateState(prev => {
                const newState = { ...prev };
                const [x, z] = key.split(',').map(Number);

                if (newState.furniture[key]) {
                    const currentFurniture = newState.furniture[key];
                    const newRotation = ((currentFurniture.rotation || 0) + Math.PI / 2) % (Math.PI * 2);
                    const furnitureDimensions = allFurnitureItems.find(item => item.type === currentFurniture.type)?.dimensions;
                    let newOffsetX = 0, newOffsetZ = 0, isSnapped = false;
                    if (currentFurniture.isSnapped && furnitureDimensions) {
                        const snapResult = calculateWallSnapPosition(x, z, newState.walls, newState.floorTiles, getKey, { ...currentFurniture, rotation: newRotation, dimensions: furnitureDimensions });
                        if (snapResult.snapped) { newOffsetX = snapResult.offsetX; newOffsetZ = snapResult.offsetZ; isSnapped = true; }
                    }
                    let updatedFurniture = { ...newState.furniture, [key]: { ...currentFurniture, rotation: newRotation, offsetX: newOffsetX, offsetZ: newOffsetZ, isSnapped: isSnapped } };
                    if (currentFurniture.type === 'window') {
                        updatedFurniture = updateNeighboringWindows(x, z, updatedFurniture);
                        [getKey(x - 1, z), getKey(x + 1, z), getKey(x, z - 1), getKey(x, z + 1)].forEach(nKey => {
                            if (updatedFurniture[nKey]?.type === 'window') updatedFurniture = updateNeighboringWindows(...nKey.split(',').map(Number), updatedFurniture);
                        });
                    }
                    newState.furniture = updatedFurniture;

                    if (['door', 'window', 'narrowDoor', 'narrowWindow'].includes(currentFurniture.type) && newState.walls[key]?.hasOpening) {
                        newState.walls = { ...newState.walls, [key]: { ...newState.walls[key], rotation: newRotation } };
                    }
                } else if (newState.walls[key] && !newState.walls[key].hasOpening) {
                    newState.walls = { ...newState.walls, [key]: { ...newState.walls[key], rotation: ((newState.walls[key].rotation || 0) + Math.PI / 2) % (Math.PI * 2) } };
                }
                return newState;
            });
        }
    }, [hoveredCell, isDragging, phantomObjectPosition, draggedType, getKey, updateState, allFurnitureItems, updateNeighboringWindows]);

    const snapToWall = useCallback((targetKey = null) => {
        const key = targetKey || (hoveredCell ? getKey(hoveredCell.x, hoveredCell.z) : null);
        if (!key) return;

        updateState(prev => {
            const furnitureItem = prev.furniture[key];
            if (!furnitureItem || ['door', 'window', 'narrowDoor', 'narrowWindow'].includes(furnitureItem.type)) return prev;

            const [x, z] = key.split(',').map(Number);
            const furnitureDimensions = allFurnitureItems.find(item => item.type === furnitureItem.type)?.dimensions;
            if (!furnitureDimensions) return prev;

            if (furnitureItem.isSnapped) {
                const newFurniture = { ...prev.furniture, [key]: { ...furnitureItem, offsetX: 0, offsetZ: 0, isSnapped: false } };
                return { ...prev, furniture: newFurniture };
            } else {
                const snapResult = calculateWallSnapPosition(x, z, prev.walls, prev.floorTiles, getKey, { ...furnitureItem, dimensions: furnitureDimensions });
                if (snapResult.snapped) {
                    const newFurniture = { ...prev.furniture, [key]: { ...furnitureItem, offsetX: snapResult.offsetX, offsetZ: snapResult.offsetZ, isSnapped: true } };
                    return { ...prev, furniture: newFurniture };
                }
            }
            return prev;
        });
    }, [hoveredCell, getKey, updateState, allFurnitureItems]);

    const deleteObject = useCallback((targetKey) => {
        updateState(prev => {
            const newState = { ...prev };
            const [x, z] = targetKey.split(',').map(Number);

            if (newState.furniture[targetKey]) {
                const removedType = newState.furniture[targetKey].type;
                const newFurniture = { ...newState.furniture };
                delete newFurniture[targetKey];
                if (removedType === 'window') {
                    [getKey(x - 1, z), getKey(x + 1, z), getKey(x, z - 1), getKey(x, z + 1)].forEach(nKey => {
                        if (newFurniture[nKey]?.type === 'window') Object.assign(newFurniture, updateNeighboringWindows(...nKey.split(',').map(Number), newFurniture));
                    });
                }
                newState.furniture = newFurniture;
                if (['door', 'window', 'narrowDoor', 'narrowWindow'].includes(removedType)) {
                    const newWalls = { ...newState.walls };
                    if (newWalls[targetKey]?.hasOpening) {
                        delete newWalls[targetKey];
                        newState.walls = newWalls;
                    }
                }
            } else if (newState.walls[targetKey]) {
                const newWalls = { ...newState.walls };
                delete newWalls[targetKey];
                newState.walls = newWalls;
            } else if (newState.floorTiles[targetKey]) {
                const newFloorTiles = { ...newState.floorTiles };
                delete newFloorTiles[targetKey];
                newState.floorTiles = newFloorTiles;
            }
            return newState;
        });
    }, [getKey, updateState, updateNeighboringWindows]);

    const handleContextMenu = useCallback((e, x, z) => {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
        const key = getKey(x, z);
        let target = null;
        if (furniture[key]) {
            const itemInfo = allFurnitureItems.find(item => item.type === furniture[key].type);
            target = { type: 'furniture', name: itemInfo?.label || 'Меблі', key, item: furniture[key] };
        } else if (walls[key]) {
            const wallData = walls[key];
            const wallName = wallData.type || TOOL_TYPES.wall;
            target = { type: 'wall', name: wallName, key, item: wallData };
        } else if (floorTiles[key]) {
            target = { type: 'floor', name: 'Підлога', key, item: floorTiles[key] };
        }
        if (target) {
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, target });
            setContextMenuTargetKey(key);
        }
    }, [furniture, walls, floorTiles, getKey, allFurnitureItems]);

    const startMoveObject = useCallback((key) => {
        if (furniture[key]) {
            const itemToDrag = furniture[key];
            const [x, z] = key.split(',').map(Number);

            if ([ 'door', 'window', 'narrowDoor', 'narrowWindow' ].includes(itemToDrag.type)) return;

            setIsDragging(true);
            setDraggedType(TOOL_TYPES.furniture);
            setDraggedSubType(itemToDrag.type);
            setPhantomObjectRotation(itemToDrag.rotation || 0);
            setPhantomObjectPosition({ x, z });
            setDraggedItemData({ ...itemToDrag, originalKey: key });

            updateState(prev => {
                const newFurniture = { ...prev.furniture };
                delete newFurniture[key];
                return { ...prev, furniture: newFurniture };
            });
        }
    }, [furniture, updateState]);

    const handleContextMenuAction = useCallback((action, key) => {
        const HEIGHT_INCREMENT = 0.1;
        switch (action) {
            case 'delete': deleteObject(key); break;
            case 'rotate': rotateObject(key); break;
            case 'snap': snapToWall(key); break;
            case 'move': startMoveObject(key); break;
            case 'raise':
            case 'lower':
                updateState(prev => {
                    if (prev.furniture[key]) {
                        const currentY = prev.furniture[key].y || 0;
                        const newY = action === 'raise' ? currentY + HEIGHT_INCREMENT : Math.max(0, currentY - HEIGHT_INCREMENT);
                        const newFurniture = { ...prev.furniture, [key]: { ...prev.furniture[key], y: newY } };
                        return { ...prev, furniture: newFurniture };
                    }
                    return prev;
                });
                break;
            case 'toggle':
                updateState(prev => {
                    if (prev.furniture[key]) {
                        const newFurniture = { ...prev.furniture, [key]: { ...prev.furniture[key], isOn: !prev.furniture[key].isOn } };
                        return { ...prev, furniture: newFurniture };
                    }
                    return prev;
                });
                break;
            case 'close': break;
            default: break;
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, [deleteObject, rotateObject, snapToWall, startMoveObject, updateState]);

    useEffect(() => {
        const closeMenu = () => {
            setContextMenu(prev => ({ ...prev, visible: false }));
            setContextMenuTargetKey(null);
        };
        if (contextMenu.visible) {
            window.addEventListener('click', closeMenu);
            window.addEventListener('scroll', closeMenu, true);
        }
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
        };
    }, [contextMenu.visible]);

    const generateRoomWithAI = useCallback((roomType, roomSize, style) => {
        setModalContent({
            title: 'Підтвердження',
            message: 'Ви впевнені, що хочете згенерувати нову кімнату? Всі поточні зміни будуть видалені.',
            isConfirm: true,
            onConfirm: () => {
                setShowModal(false);
                setIsLoading(true); // Show preloader

                setTimeout(() => { // Simulate generation time
                    const palettes = {
                        'Сучасний': { wall: '#EAEAEA', floor: '#C0C0C0', furniture: ['#34495E', '#95A5A6'] },
                        'Затишний': { wall: '#F5DEB3', floor: '#A0522D', furniture: ['#D2B48C', '#8B4513'] },
                        'Мінімалізм': { wall: '#FFFFFF', floor: '#F5F5F5', furniture: ['#2C3E50', '#BDC3C7'] }
                    };

                    const furnitureSets = {
                        'Вітальня': ['sofa', 'coffeeTable', 'tv', 'lamp', 'pottedPlant'],
                        'Спальня': ['bed', 'wardrobe', 'nightstand', 'dresser', 'rug'],
                        'Кухня': ['kitchenTable', 'kitchenCabinet', 'diningChair', 'diningChair', 'sink'],
                        'Офіс': ['desk', 'officeChair', 'bookshelf', 'filingCabinet', 'lamp']
                    };

                    const palette = palettes[style];
                    const furnitureSet = furnitureSets[roomType];

                    let width, depth;
                    switch (roomSize) {
                        case 'Маленька': width = 6; depth = 6; break;
                        case 'Велика': width = 12; depth = 10; break;
                        default: width = 8; depth = 10; break;
                    }

                    const newWalls = {};
                    const newFloorTiles = {};
                    const newFurniture = {};

                    const startX = -Math.floor(width / 2);
                    const startZ = -Math.floor(depth / 2);

                    // Create floor and walls
                    for (let x = startX; x < startX + width; x++) {
                        for (let z = startZ; z < startZ + depth; z++) {
                            const key = getKey(x, z);
                            newFloorTiles[key] = palette.floor;
                            if (x === startX || x === startX + width - 1 || z === startZ || z === startZ + depth - 1) {
                                newWalls[key] = { type: TOOL_TYPES.wall, color: palette.wall, hasOpening: false };
                            }
                        }
                    }

                    // Add a door
                    const doorZ = startZ + Math.floor(depth / 2);
                    const doorKey = getKey(startX, doorZ);
                    if(newWalls[doorKey]) {
                        newWalls[doorKey].hasOpening = true;
                        newFurniture[doorKey] = { type: 'door', color: '#8B4513', rotation: Math.PI / 2 };
                    }

                    // Add a window
                    const windowX = startX + Math.floor(width / 2);
                    const windowKey = getKey(windowX, startZ);
                    if(newWalls[windowKey]) {
                        newWalls[windowKey].hasOpening = true;
                        newFurniture[windowKey] = { type: 'window', color: '#A0AEC0', rotation: 0 };
                    }

                    // Place furniture
                    const occupied = new Set([doorKey, windowKey]);
                    furnitureSet.forEach((itemType, index) => {
                        const itemInfo = allFurnitureItems.find(i => i.type === itemType);
                        if (!itemInfo) return;

                        let placed = false;
                        // Try placing against a wall first for large items
                        if (['sofa', 'bed', 'desk', 'wardrobe', 'bookshelf', 'kitchenCabinet', 'tv'].includes(itemType)) {
                            for (let i = 0; i < 50 && !placed; i++) { // 50 attempts
                                const x = startX + 1 + Math.floor(Math.random() * (width - 2));
                                const z = startZ + 1 + Math.floor(Math.random() * (depth - 2));
                                const key = getKey(x,z);
                                if (!occupied.has(key)) {
                                    newFurniture[key] = { type: itemType, color: palette.furniture[index % palette.furniture.length], rotation: [0, Math.PI/2, Math.PI, 3*Math.PI/2][Math.floor(Math.random()*4)] };
                                    occupied.add(key);
                                    placed = true;
                                }
                            }
                        }
                        // Place anywhere else if failed or small item
                        if (!placed) {
                             for (let i = 0; i < 50 && !placed; i++) { // 50 attempts
                                const x = startX + 1 + Math.floor(Math.random() * (width - 2));
                                const z = startZ + 1 + Math.floor(Math.random() * (depth - 2));
                                const key = getKey(x,z);
                                if (!occupied.has(key)) {
                                    newFurniture[key] = { type: itemType, color: palette.furniture[index % palette.furniture.length], rotation: Math.random() * 2 * Math.PI };
                                    occupied.add(key);
                                    placed = true;
                                }
                            }
                        }
                    });

                    resetHistory({ walls: newWalls, furniture: newFurniture, floorTiles: newFloorTiles, userColors: [] });
                    setIsLoading(false);
                }, 1000);
            }
        });
        setShowModal(true);
    }, [resetHistory, getKey, allFurnitureItems]);

    function CanvasContent({
                               getKey, rotateObject, snapToWall, checkGridExpansion, selectedTool, selectedColor, furniture, walls, floorTiles, hoveredCell, setHoveredCell, updateState, isDragging, draggedType, draggedSubType, phantomObjectPosition, setPhantomObjectPosition, phantomObjectRotation, setPhantomObjectRotation, setIsDragging, setDraggedType, setDraggedSubType, handleContextMenu, keyPressed, targetCameraPosition, targetCameraQuaternion, mobileMovementInput, cameraRotationInput, cameraVerticalInput, updateNeighboringWindows, draggedItemData, setDraggedItemData, contextMenuTargetKey, graphicsSettings, isTestDrive
                           }) {
        const { gl, camera } = useThree();
        const PI_2 = Math.PI / 2;
        const bobbingTime = useRef(0);

        useEffect(() => { camera.position.copy(targetCameraPosition.current); camera.quaternion.copy(targetCameraQuaternion.current); }, [camera]);
        
        useEffect(() => {
            const handleKeyDown = (e) => {
                keyPressed.current[e.code] = true;

                if (isTestDrive) return;

                if (e.ctrlKey && e.code === 'KeyZ') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    return;
                }
                
                if (e.code === 'KeyR') { rotateObject(); e.preventDefault(); }
                else if (e.code === 'KeyT') { snapToWall(); e.preventDefault(); }
            };
            const handleKeyUp = (e) => { 
                keyPressed.current[e.code] = false; 
            };
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }, [rotateObject, snapToWall, undo, redo, isTestDrive]);

        useFrame((state, delta) => {
            const moveAmount = MOVEMENT_SPEED * delta * 60; 
            const verticalMoveAmount = VERTICAL_MOVEMENT_SPEED * delta * 60; 
            const rotateAmountYaw = ROTATION_SPEED_KEYBOARD_YAW * delta * 60; 
            const rotateAmountPitch = ROTATION_SPEED_KEYBOARD_PITCH * delta * 60;
            
            let newCameraPosition = camera.position.clone(); 
            const currentQuaternion = camera.quaternion;
            const forward = new Vector3(0, 0, -1).applyQuaternion(currentQuaternion); 
            const right = new Vector3(1, 0, 0).applyQuaternion(currentQuaternion);
            forward.y = 0; 
            right.y = 0; 
            forward.normalize(); 
            right.normalize();

            const isMoving = keyPressed.current['KeyW'] || keyPressed.current['KeyS'] || keyPressed.current['KeyA'] || keyPressed.current['KeyD'];
            
            if (keyPressed.current['KeyW']) newCameraPosition.addScaledVector(forward, moveAmount);
            if (keyPressed.current['KeyS']) newCameraPosition.addScaledVector(forward, -moveAmount);
            if (keyPressed.current['KeyA']) newCameraPosition.addScaledVector(right, -moveAmount);
            if (keyPressed.current['KeyD']) newCameraPosition.addScaledVector(right, moveAmount);
            if (!isTestDrive) {
                if (keyPressed.current['KeyE']) newCameraPosition.y += verticalMoveAmount; 
                if (keyPressed.current['KeyQ']) newCameraPosition.y -= verticalMoveAmount;
            } else {
                bobbingTime.current += delta * BOBBING_FREQUENCY * (isMoving ? 1 : 0);
                const bobbingOffset = Math.sin(bobbingTime.current) * BOBBING_AMPLITUDE;
                newCameraPosition.y = 1.7 + bobbingOffset;
            }
            
            if (mobileMovementInput.current.forward) newCameraPosition.addScaledVector(forward, moveAmount); 
            if (mobileMovementInput.current.backward) newCameraPosition.addScaledVector(forward, -moveAmount); 
            if (mobileMovementInput.current.left) newCameraPosition.addScaledVector(right, -moveAmount); 
            if (mobileMovementInput.current.right) newCameraPosition.addScaledVector(right, moveAmount);
            
            if (!isTestDrive) {
                newCameraPosition.y += cameraVerticalInput.current * verticalMoveAmount;
            }

            targetCameraPosition.current.copy(newCameraPosition); 
            camera.position.lerp(targetCameraPosition.current, LERP_FACTOR);
            
            let currentEuler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
            if (keyPressed.current['ArrowLeft']) currentEuler.y += rotateAmountYaw; 
            if (keyPressed.current['ArrowRight']) currentEuler.y -= rotateAmountYaw; 
            if (keyPressed.current['ArrowDown']) currentEuler.x = Math.max(-PI_2 + 0.01, currentEuler.x - rotateAmountPitch); 
            if (keyPressed.current['ArrowUp']) currentEuler.x = Math.min(PI_2 - 0.01, currentEuler.x + rotateAmountPitch);
            
            currentEuler.y += cameraRotationInput.current.yaw * rotateAmountYaw; 
            currentEuler.x = Math.max(-PI_2 + 0.01, Math.min(PI_2 - 0.01, currentEuler.x + cameraRotationInput.current.pitch * rotateAmountPitch));
            currentEuler.z = 0; 
            
            targetCameraQuaternion.current.setFromEuler(currentEuler); 
            camera.quaternion.slerp(targetCameraQuaternion.current, LERP_FACTOR);
        });
        const getIntersectionPoint = useCallback((event) => { const raycaster = new Raycaster(); const mouse = new THREE.Vector2(); const rect = gl.domElement.getBoundingClientRect(); mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(mouse, camera); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_LEVEL); const intersectionPoint = new Vector3(); raycaster.ray.intersectPlane(plane, intersectionPoint); return intersectionPoint; }, [gl, camera]);
        
        const handlePointerDown = useCallback((e, x, z) => {
            e.stopPropagation();
            if (isTestDrive) return;

            const domEvent = e.nativeEvent || e; if (domEvent.button === 2 || isDragging) return;
            const clickedKey = getKey(x, z);
            const wallTools = [TOOL_TYPES.wall, TOOL_TYPES.narrowWall, TOOL_TYPES.cornerWall];
            if (selectedTool === TOOL_TYPES.floor || wallTools.includes(selectedTool)) {
                setIsDragging(true); setDraggedType(selectedTool); setDraggedSubType(null); setPhantomObjectRotation(0); setDraggedItemData(null);
                return;
            } else if (furniture[clickedKey] && (furniture[clickedKey].type !== 'door' && furniture[clickedKey].type !== 'window')) {
                const itemToDrag = furniture[clickedKey];
                setIsDragging(true);
                setDraggedType(TOOL_TYPES.furniture);
                setDraggedSubType(itemToDrag.type);
                setPhantomObjectRotation(itemToDrag.rotation || 0);
                setPhantomObjectPosition({ x, z });
                setDraggedItemData({ ...itemToDrag, originalKey: clickedKey });
                updateState(prev => {
                    const newFurniture = { ...prev.furniture };
                    delete newFurniture[clickedKey];
                    return { ...prev, furniture: newFurniture };
                });
                return;
            }
        }, [isDragging, selectedTool, furniture, getKey, updateState, setIsDragging, setDraggedType, setDraggedSubType, setPhantomObjectRotation, setDraggedItemData, isTestDrive]);

        const handlePointerMove = useCallback((e) => {
            if (isTestDrive) return;
            e.stopPropagation();
            const domEvent = e.nativeEvent || e; const intersectionPoint = getIntersectionPoint(domEvent);
            if (intersectionPoint) {
                const newHoveredCell = { x: Math.round(intersectionPoint.x), z: Math.round(intersectionPoint.z) };
                if (!hoveredCell || newHoveredCell.x !== hoveredCell.x || newHoveredCell.z !== hoveredCell.z) setHoveredCell(newHoveredCell);
                if (isDragging && draggedType) {
                    const snappedX = Math.round(intersectionPoint.x); const snappedZ = Math.round(intersectionPoint.z);
                    if (!phantomObjectPosition || snappedX !== phantomObjectPosition.x || snappedZ !== phantomObjectPosition.z) setPhantomObjectPosition({ x: snappedX, z: snappedZ });
                }
            } else { if (hoveredCell) setHoveredCell(null); if (isDragging && draggedType && phantomObjectPosition) setPhantomObjectPosition(null); }
        }, [isDragging, draggedType, hoveredCell, phantomObjectPosition, getIntersectionPoint, isTestDrive]);
        
        useEffect(() => {
            const handleGlobalPointerUp = (e) => {
                if (isTestDrive) return;
                if (e.button !== 0 || !isDragging || !draggedType) {
                    if (isDragging && draggedItemData) {
                        const { originalKey, ...item } = draggedItemData;
                        updateState(prev => ({ ...prev, furniture: { ...prev.furniture, [originalKey]: item } }));
                    }
                    setIsDragging(false); setDraggedType(null); setDraggedSubType(null); setPhantomObjectPosition(null); setPhantomObjectRotation(0); setDraggedItemData(null);
                    return;
                }
                if (!phantomObjectPosition) {
                    if (draggedItemData) {
                        const { originalKey, ...item } = draggedItemData;
                        updateState(prev => ({ ...prev, furniture: { ...prev.furniture, [originalKey]: item } }));
                    }
                    setIsDragging(false); setDraggedType(null); setDraggedSubType(null); setPhantomObjectPosition(null); setPhantomObjectRotation(0); setDraggedItemData(null);
                    return;
                };

                updateState(prev => {
                    const newState = { ...prev };
                    const finalX = Math.round(phantomObjectPosition.x);
                    const finalZ = Math.round(phantomObjectPosition.z);
                    const key = getKey(finalX, finalZ);
                    const isPlacementValid = newState.floorTiles[key] && (!newState.furniture[key] || ['door', 'window', 'narrowDoor', 'narrowWindow'].includes(newState.furniture[key]?.type));
                    const wallTools = [TOOL_TYPES.wall, TOOL_TYPES.narrowWall, TOOL_TYPES.cornerWall];

                    if (draggedType === TOOL_TYPES.floor) {
                        newState.floorTiles = { ...newState.floorTiles, [key]: selectedColor };
                        if (newState.walls[key]) {
                            const newWalls = { ...newState.walls };
                            delete newWalls[key];
                            newState.walls = newWalls;
                        }
                        if (newState.furniture[key] && !['door', 'window', 'narrowDoor', 'narrowWindow'].includes(newState.furniture[key].type)) {
                            const newFurniture = { ...newState.furniture };
                            delete newFurniture[key];
                            newState.furniture = newFurniture;
                        }
                        checkGridExpansion(finalX, finalZ);
                    } else if (wallTools.includes(draggedType)) {
                        if (newState.floorTiles[key] && (!newState.furniture[key] || (newState.furniture[key].type !== 'door' && newState.furniture[key].type !== 'window'))) {
                            newState.walls = { ...newState.walls, [key]: { type: draggedType, color: selectedColor, hasOpening: false, rotation: phantomObjectRotation } };
                            checkGridExpansion(finalX, finalZ);
                        }
                    } else if (draggedType === TOOL_TYPES.furniture) {
                        if (isPlacementValid) {
                            const phantomDimensions = allFurnitureItems.find(item => item.type === draggedSubType)?.dimensions;
                            const newFurnitureItem = { type: draggedSubType, color: draggedItemData ? draggedItemData.color : selectedColor, rotation: phantomObjectRotation, offsetX: 0, offsetZ: 0, y: draggedItemData?.y || 0, isSnapped: false, dimensions: phantomDimensions, neighborLeft: false, neighborRight: false, neighborFront: false, neighborBack: false, isOn: true, isOpen: false };
                            let updatedFurniture = { ...newState.furniture, [key]: newFurnitureItem };
                            if (draggedSubType === 'window') {
                                updatedFurniture = updateNeighboringWindows(finalX, finalZ, updatedFurniture);
                                [getKey(finalX - 1, finalZ), getKey(finalX + 1, finalZ), getKey(finalX, finalZ - 1), getKey(finalX, finalZ + 1)].forEach(nKey => {
                                    if (updatedFurniture[nKey]?.type === 'window') updatedFurniture = updateNeighboringWindows(...nKey.split(',').map(Number), updatedFurniture);
                                });
                            }
                            newState.furniture = updatedFurniture;

                            if (['door', 'window'].includes(draggedSubType)) {
                                newState.walls = { ...newState.walls, [key]: { type: TOOL_TYPES.wall, color: selectedColor, hasOpening: true, rotation: phantomObjectRotation } };
                            } else if (['narrowDoor', 'narrowWindow'].includes(draggedSubType)) {
                                newState.walls = { ...newState.walls, [key]: { type: TOOL_TYPES.narrowWall, color: selectedColor, hasOpening: true, rotation: phantomObjectRotation } };
                            } else if (newState.walls[key] && !newState.walls[key].hasOpening) {
                                const newWalls = { ...newState.walls };
                                delete newWalls[key];
                                newState.walls = newWalls;
                            }
                            checkGridExpansion(finalX, finalZ);
                        } else if (draggedItemData) {
                            const { originalKey, ...item } = draggedItemData;
                            newState.furniture = { ...newState.furniture, [originalKey]: item };
                        }
                    }
                    return newState;
                });

                setIsDragging(false); setDraggedType(null); setDraggedSubType(null); setPhantomObjectPosition(null); setPhantomObjectRotation(0); setDraggedItemData(null);
            };
            const currentCanvas = gl.domElement; if (currentCanvas) currentCanvas.addEventListener('pointerup', handleGlobalPointerUp);
            return () => { if (currentCanvas) currentCanvas.removeEventListener('pointerup', handleGlobalPointerUp); };
        }, [isDragging, draggedType, draggedSubType, phantomObjectPosition, getKey, selectedColor, phantomObjectRotation, checkGridExpansion, gl, updateNeighboringWindows, draggedItemData, allFurnitureItems, updateState, isTestDrive]);

        const renderComponent = useCallback((data, isPhantom = false, isPlacementValid = true, isHighlighted = false) => {
            const { type: itemType, color, rotation = 0, neighborLeft, neighborRight, neighborFront, neighborBack, isOn, isOpen } = data;
            const currentPhantomMaterial = isPhantom && !isPlacementValid ? invalidPhantomMaterial : phantomMaterial;
            const Component = FURNITURE_COMPONENTS[itemType];

            if (Component) return <Component color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} neighborLeft={neighborLeft} neighborRight={neighborRight} neighborFront={neighborFront} neighborBack={neighborBack} phantomMaterial={currentPhantomMaterial} isOn={isOn} isOpen={isOpen} graphicsSettings={graphicsSettings} />;
            if (itemType === TOOL_TYPES.floor) return <FloorPhantom />;
            const wallTools = [TOOL_TYPES.wall, TOOL_TYPES.narrowWall, TOOL_TYPES.cornerWall];
            if (wallTools.includes(itemType)) {
                const key = hoveredCell ? getKey(hoveredCell.x, hoveredCell.z) : null;
                const hasOpening = key && furniture[key] && ['door', 'window', 'narrowDoor', 'narrowWindow'].includes(furniture[key].type);
                return <WallPhantom hasOpening={hasOpening} wallType={itemType} />;
            }
            return null;
        }, [hoveredCell, furniture, getKey, graphicsSettings]);

        const gridHelper = useMemo(() => new GridHelper(gridSize * 2, gridSize * 2, '#4B5563', '#4B5563'), [gridSize]);

        const MemoizedFloors = React.memo(({ items, furniture }) => (
            <>
                {Object.entries(items).map(([key, color]) => {
                    const [x, z] = key.split(',').map(Number);
                    return <mesh key={`floor-${key}`} position={[x, FLOOR_LEVEL - 0.05, z]} onPointerDown={(e) => handlePointerDown(e, x, z)} onPointerMove={handlePointerMove} onContextMenu={(e) => handleContextMenu(e, x, z)} castShadow receiveShadow><boxGeometry args={[1, 0.1, 1]} /><meshStandardMaterial color={color} /></mesh>;
                })}
            </>
        ));

        const MemoizedWalls = React.memo(({ items, furniture }) => (
            <>
                {Object.entries(items).map(([key, wallData]) => {
                    const [x, z] = key.split(',').map(Number);
                    const isHighlighted = !isDragging && !isTestDrive && ((hoveredCell && hoveredCell.x === x && hoveredCell.z === z) || contextMenuTargetKey === key);
                    const furnitureInCell = furniture[key];
                    
                    let WallComponent;
                    switch (wallData.type) {
                        case TOOL_TYPES.narrowWall:
                            WallComponent = NarrowWall;
                            break;
                        case TOOL_TYPES.cornerWall:
                            WallComponent = CornerWall;
                            break;
                        case TOOL_TYPES.wall:
                        default:
                            WallComponent = Wall;
                    }

                    return (
                        <group key={`wall-${key}`} position={[x, FLOOR_LEVEL, z]} rotation={[0, wallData.rotation || 0, 0]} onPointerDown={(e) => handlePointerDown(e, x, z)} onPointerMove={handlePointerMove} onContextMenu={(e) => handleContextMenu(e, x, z)}>
                            <WallComponent color={wallData.color} hasOpening={wallData.hasOpening} isHighlighted={isHighlighted} furnitureType={furnitureInCell?.type} />
                        </group>
                    );
                })}
            </>
        ));

        const MemoizedFurniture = React.memo(({ items }) => (
            <>
                {Object.entries(items).map(([key, furnitureData]) => {
                    const [x, z] = key.split(',').map(Number);
                    const isHighlighted = !isDragging && !isTestDrive && ((hoveredCell && hoveredCell.x === x && hoveredCell.z === z) || contextMenuTargetKey === key);
                    const positionX = x + (furnitureData.offsetX || 0);
                    const positionZ = z + (furnitureData.offsetZ || 0);
                    const positionY = FLOOR_LEVEL + (furnitureData.y || 0);
                    return <group key={`furniture-${key}`} position={[positionX, positionY, positionZ]} onPointerDown={(e) => handlePointerDown(e, x, z)} onPointerMove={handlePointerMove} onContextMenu={(e) => handleContextMenu(e, x, z)}>{renderComponent({ ...furnitureData, position: { x: positionX, z: positionZ } }, false, true, isHighlighted)}</group>;
                })}
            </>
        ));

        const isPhantomPlacementValid = useMemo(() => { if (!phantomObjectPosition) return false; const key = getKey(phantomObjectPosition.x, phantomObjectPosition.z); return floorTiles[key] && (!furniture[key] || ['door', 'window', 'narrowDoor', 'narrowWindow'].includes(furniture[key]?.type)); }, [phantomObjectPosition, floorTiles, furniture, getKey]);

        return (<>
            <ambientLight intensity={0.5} />
            <directionalLight position={[20, 30, 20]} intensity={1} castShadow={graphicsSettings.shadows} />
            <primitive object={gridHelper} position={[0, FLOOR_LEVEL + 0.01, 0]} />
            {/* {hoveredCell && !isDragging && (<mesh position={[hoveredCell.x, FLOOR_LEVEL + 0.02, hoveredCell.z]} material={hoverMaterial} castShadow receiveShadow><boxGeometry args={[1, 0.01, 1]} /></mesh>)} */}
            {isDragging && draggedType && phantomObjectPosition && (<group position={[phantomObjectPosition.x, FLOOR_LEVEL, phantomObjectPosition.z]} rotation={[0, phantomObjectRotation, 0]}>{renderComponent({ type: draggedType === TOOL_TYPES.furniture ? draggedSubType : draggedType, color: draggedItemData ? draggedItemData.color : selectedColor, rotation: 0 }, true, isPhantomPlacementValid)}</group>)}
            <mesh position={[0, FLOOR_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={handlePointerMove} onPointerDown={(e) => handlePointerDown(e, Math.round(e.point.x), Math.round(e.point.z))} onContextMenu={(e) => { e.stopPropagation(); if (hoveredCell) handleContextMenu(e, hoveredCell.x, hoveredCell.z); }} visible={!isTestDrive}><planeGeometry args={[gridSize * 2 + 1, gridSize * 2 + 1]} /><meshStandardMaterial transparent opacity={0.0} /></mesh>
            <MemoizedFloors items={floorTiles} />
            <MemoizedWalls items={walls} furniture={furniture} />
            <MemoizedFurniture items={furniture} />
            <Preload all />
        </>);
    }

    const handleFurnitureDragStart = useCallback((type) => { setSelectedTool(TOOL_TYPES.furniture); setIsDragging(true); setDraggedType(TOOL_TYPES.furniture); setDraggedSubType(type); setPhantomObjectRotation(type === 'painting' ? Math.PI : 0); setDraggedItemData(null); }, []);
    const handleToolToggle = useCallback((toolLabel) => { if (selectedTool === toolLabel) setSelectedTool(null); else setSelectedTool(toolLabel); setIsDragging(false); setDraggedType(null); setDraggedSubType(null); setPhantomObjectPosition(null); setPhantomObjectRotation(0); setDraggedItemData(null); }, [selectedTool]);
    
    useEffect(() => {
        const loadRoomState = () => {
            if (isNaN(roomId)) { setModalContent({ title: 'Помилка завантаження', message: 'Недійсний ідентифікатор кімнати. Перенаправлення на головну сторінку.', onConfirm: () => navigate('/'), isConfirm: false }); setShowModal(true); return; }
            try {
                const userJson = localStorage.getItem('user'); let currentUser = null;
                if (userJson) { try { currentUser = JSON.parse(userJson); } catch (e) { currentUser = null; } }
                if (!currentUser || !Array.isArray(currentUser.rooms)) { resetAllState(); return; }
                const roomToLoad = currentUser.rooms.find(room => room.id === roomId);
                if (roomToLoad) {
                    setRoomName(roomToLoad.name || `Кімната ${roomId}`);
                    setGridSize(roomToLoad.gridSize || INITIAL_GRID_SIZE);
                    resetHistory({
                        walls: roomToLoad.walls || {},
                        furniture: roomToLoad.furniture || {},
                        floorTiles: roomToLoad.floorTiles || {},
                        userColors: roomToLoad.userColors || []
                    });
                    setSelectedColor(roomToLoad.selectedColor || BASE_COLORS[0]);
                    if (roomToLoad.cameraPosition && roomToLoad.cameraQuaternion) { targetCameraPosition.current.set(...roomToLoad.cameraPosition); targetCameraQuaternion.current.set(...roomToLoad.cameraQuaternion); }
                    else { targetCameraPosition.current.set(...INITIAL_CAMERA_POSITION); const tempCamera = new THREE.Camera(); tempCamera.position.set(...INITIAL_CAMERA_POSITION); tempCamera.lookAt(INITIAL_LOOK_AT_TARGET); targetCameraQuaternion.current.copy(tempCamera.quaternion); }
                } else { setModalContent({ title: 'Кімнату не знайдено', message: 'Кімнату не знайдено. Був ініційований новий проект.', onConfirm: () => setShowModal(false), isConfirm: false }); setShowModal(true); resetAllState(); }
            } catch (error) { setModalContent({ title: 'Помилка завантаження', message: 'Помилка під час завантаження стану кімнати. Перевірте консоль для деталей.', onConfirm: () => setShowModal(false), isConfirm: false }); setShowModal(true); resetAllState(); }
        };
        loadRoomState();
        if (!localStorage.getItem('hasSeenTutorial')) setShowTutorial(true);
    }, [roomId, navigate, id, resetAllState, resetHistory]);
    
    const deleteRoom = useCallback(() => {
        setModalContent({
            title: 'Видалити кімнату', message: `Ви впевнені, що хочете видалити кімнату "${roomName}"? Цю дію не можна скасувати.`,
            onConfirm: () => {
                try {
                    const userJson = localStorage.getItem('user'); let currentUser = null;
                    if (userJson) { try { currentUser = JSON.parse(userJson); } catch (e) { setModalContent({ title: 'Помилка', message: 'Дані користувача пошкоджені. Видалення неможливе.', onConfirm: () => setShowModal(false), isConfirm: false }); setShowModal(true); return; } }
                    if (!currentUser || !Array.isArray(currentUser.rooms)) { setModalContent({ title: 'Помилка', message: 'Немає даних користувача. Видалення неможливе.', onConfirm: () => setShowModal(false), isConfirm: false }); setShowModal(true); return; }
                    const initialRoomCount = currentUser.rooms.length; const updatedRooms = currentUser.rooms.filter(room => room.id !== roomId);
                    if (updatedRooms.length < initialRoomCount) {
                        currentUser.rooms = updatedRooms; localStorage.setItem('user', JSON.stringify(currentUser));
                        setModalContent({ title: 'Кімнату видалено', message: `Кімнату "${roomName}" успішно видалено.`, onConfirm: () => { setShowModal(false); navigate('/'); }, isConfirm: false }); setShowModal(true);
                    } else { setModalContent({ title: 'Помилка видалення', message: 'Кімнату з таким ID не знайдено.', onConfirm: () => setShowModal(false), isConfirm: false }); setShowModal(true); }
                } catch (error) { setModalContent({ title: 'Помилка видалення', message: 'Помилка під час видалення кімнати. Перевірте консоль для деталей.', onConfirm: () => setShowModal(false), isConfirm: false }); setShowModal(true); }
            }, isConfirm: true
        });
        setShowModal(true);
    }, [roomId, roomName, navigate]);

    const addUserColor = useCallback(() => {
        if (customColor && !userColors.includes(customColor.toUpperCase()) && !BASE_COLORS.find(c => c.toUpperCase() === customColor.toUpperCase())) {
            updateState(prev => ({ ...prev, userColors: [...prev.userColors, customColor] }));
        }
    }, [customColor, userColors, updateState]);

    const handleSaveAndExit = useCallback(() => {
        if (isNaN(roomId)) {
            console.error("Invalid room ID, cannot save.");
            navigate('/');
            return;
        }
        try {
            const userJson = localStorage.getItem('user');
            if (userJson) {
                const currentUser = JSON.parse(userJson);
                if (currentUser && Array.isArray(currentUser.rooms)) {
                    const roomIndex = currentUser.rooms.findIndex(room => room.id === roomId);
                    if (roomIndex !== -1) {
                        currentUser.rooms[roomIndex] = {
                            ...currentUser.rooms[roomIndex],
                            name: roomName,
                            gridSize,
                            ...state,
                            selectedColor,
                            cameraPosition: targetCameraPosition.current.toArray(),
                            cameraQuaternion: targetCameraQuaternion.current.toArray()
                        };
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                }
            }
        } catch (error) {
            console.error('Save on exit failed:', error);
        }
        navigate('/');
    }, [roomId, roomName, gridSize, state, selectedColor, navigate]);

    const toggleTestDrive = () => {
        setIsTestDriveLoading(true);
        setTimeout(() => {
            setIsTestDrive(prev => {
                const entering = !prev;
                if (entering) {
                    targetCameraPosition.current.y = 1.7;
                } else {
                    if (targetCameraPosition.current.y < 5) {
                        targetCameraPosition.current.y = 15;
                    }
                }
                return entering;
            });
            setIsTestDriveLoading(false);
        }, 1000);
    };

    return (
        <div id="root" style={{ ...styles.root, display: 'flex', flexDirection: 'column', height: '100vh', background: '#1F2937' }}>
            <style>{`
                .inventory-panel::-webkit-scrollbar {
                    display: none;
                }
                .inventory-panel {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            <GpuDetector onDetect={handleGpuDetect} />

            {(isLoading || isTestDriveLoading) && <Preloader text={isTestDriveLoading ? "Завантаження..." : "Завантаження сцени..."} />}

            <div ref={canvasRef} style={{ flex: 1, position: 'relative', visibility: (isLoading || isTestDriveLoading) ? 'hidden' : 'visible' }}>
                {isGpuReady && (
                    <Canvas
                        shadows={graphicsSettings.shadows}
                        dpr={graphicsSettings.dpr}
                        gl={{ antialias: true, powerPreference: 'high-performance', physicallyCorrectLights: true }}
                        camera={{ position: INITIAL_CAMERA_POSITION, fov: 60 }}
                        onContextMenu={(e) => e.preventDefault()}
                        key={JSON.stringify(graphicsSettings)}
                    >
                        <CanvasContent
                            getKey={getKey} rotateObject={rotateObject} snapToWall={snapToWall} checkGridExpansion={checkGridExpansion} selectedTool={selectedTool} selectedColor={selectedColor} furniture={furniture} walls={walls} floorTiles={floorTiles} hoveredCell={hoveredCell} setHoveredCell={setHoveredCell} canvasRef={canvasRef} updateState={updateState} isDragging={isDragging} draggedType={draggedType} draggedSubType={draggedSubType} phantomObjectPosition={phantomObjectPosition} setPhantomObjectPosition={setPhantomObjectPosition} phantomObjectRotation={phantomObjectRotation} setPhantomObjectRotation={setPhantomObjectRotation} setIsDragging={setIsDragging} setDraggedType={setDraggedType} setDraggedSubType={setDraggedSubType} handleContextMenu={handleContextMenu} keyPressed={keyPressed} targetCameraPosition={targetCameraPosition} targetCameraQuaternion={targetCameraQuaternion} mobileMovementInput={mobileMovementInput} cameraRotationInput={cameraRotationInput} cameraVerticalInput={cameraVerticalInput} updateNeighboringWindows={updateNeighboringWindows} draggedItemData={draggedItemData} setDraggedItemData={setDraggedItemData} contextMenuTargetKey={contextMenuTargetKey}
                            graphicsSettings={graphicsSettings}
                            isTestDrive={isTestDrive}
                        />
                        <FpsStabilizer onStable={() => setIsLoading(false)} />
                    </Canvas>
                )}
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
                    <HoverButton onClick={toggleTestDrive} style={{ ...styles.buttonBase, ...styles.saveButton, padding: '10px 20px', fontSize: '1em' }} hoverStyle={styles.saveButtonHover}>{isTestDrive ? 'Вийти з Тест Драйву' : 'Тест Драйв'}</HoverButton>
                    {!isTestDrive && (
                        <>
                            <HoverButton onClick={() => setShowAiModal(true)} style={{ ...styles.buttonBase, background: '#9b59b6', padding: '10px 20px', fontSize: '1em' }} hoverStyle={{ background: '#8e44ad' }}>🤖 RMC AI</HoverButton>
                            <HoverButton onClick={() => setShowGraphicsSettings(true)} style={{ ...styles.buttonBase, ...styles.tutorialButton, padding: '10px 20px', fontSize: '1em', background: '#6c757d' }} hoverStyle={{ ...styles.tutorialButtonHover, background: '#5a6268' }}>⚙️ Графіка</HoverButton>
                            <HoverButton onClick={() => setShowTutorial(true)} style={{ ...styles.buttonBase, ...styles.tutorialButton, padding: '10px 20px', fontSize: '1em' }} hoverStyle={styles.tutorialButtonHover}>🎓 Туторіал</HoverButton>
                            <HoverButton onClick={resetAllState} style={{ ...styles.buttonBase, ...styles.clearButton, padding: '10px 20px', fontSize: '1em' }} hoverStyle={styles.clearButtonHover}>🗑️ Очистити</HoverButton>
                        </>
                    )}
                    <HoverButton onClick={handleSaveAndExit} style={{ ...styles.buttonBase, ...styles.exitButton, padding: '10px 20px', fontSize: '1em' }} hoverStyle={styles.exitButtonHover}>🚪 Вийти</HoverButton>
                </div>
                
                {isMobile && !isTestDrive && (<>
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gridTemplateRows: 'repeat(3, 40px)', gap: '5px', zIndex: 1000 }}>
                        <button onTouchStart={() => mobileMovementInput.current.forward = 1} onTouchEnd={() => mobileMovementInput.current.forward = 0} style={{ gridColumn: '2 / 3', gridRow: '1 / 2', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>↑</button>
                        <button onTouchStart={() => mobileMovementInput.current.left = 1} onTouchEnd={() => mobileMovementInput.current.left = 0} style={{ gridColumn: '1 / 2', gridRow: '2 / 3', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>←</button>
                        <button onTouchStart={() => mobileMovementInput.current.right = 1} onTouchEnd={() => mobileMovementInput.current.right = 0} style={{ gridColumn: '3 / 4', gridRow: '2 / 3', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>→</button>
                        <button onTouchStart={() => mobileMovementInput.current.backward = 1} onTouchEnd={() => mobileMovementInput.current.backward = 0} style={{ gridColumn: '2 / 3', gridRow: '3 / 4', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>↓</button>
                    </div>
                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gridTemplateRows: 'repeat(3, 40px)', gap: '5px', zIndex: 1000 }}>
                        <button onTouchStart={() => cameraRotationInput.current.pitch = 1} onTouchEnd={() => cameraRotationInput.current.pitch = 0} style={{ gridColumn: '2 / 3', gridRow: '1 / 2', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>▲</button>
                        <button onTouchStart={() => cameraRotationInput.current.yaw = 1} onTouchEnd={() => cameraRotationInput.current.yaw = 0} style={{ gridColumn: '1 / 2', gridRow: '2 / 3', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>◀</button>
                        <button onTouchStart={() => cameraRotationInput.current.yaw = -1} onTouchEnd={() => cameraRotationInput.current.yaw = 0} style={{ gridColumn: '3 / 4', gridRow: '2 / 3', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>▶</button>
                        <button onTouchStart={() => cameraRotationInput.current.pitch = -1} onTouchEnd={() => cameraRotationInput.current.pitch = 0} style={{ gridColumn: '2 / 3', gridRow: '3 / 4', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>▼</button>
                    </div>
                    <div style={{ position: 'absolute', bottom: '150px', right: '20px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 1000 }}>
                        <button onTouchStart={() => cameraVerticalInput.current = 1} onTouchEnd={() => cameraVerticalInput.current = 0} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>Вгору</button>
                        <button onTouchStart={() => cameraVerticalInput.current = -1} onTouchEnd={() => cameraVerticalInput.current = 0} style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>Вниз</button>
                    </div>
                </>)}
            </div>
            {!isTestDrive && (
                <div className="inventory-panel" style={{...styles.inventoryPanel, visibility: (isLoading || isTestDriveLoading) ? 'hidden' : 'visible' }}>
                    <div style={styles.inventorySection}>
                        <h3 style={styles.inventoryTitle}>Інструменти</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(TOOL_TYPES).filter(([, label]) => label !== 'Меблі').map(([key, label]) => (<HoverButton key={label} onClick={() => handleToolToggle(label)} style={{ ...styles.buttonBase, ...(selectedTool === label ? styles.toolButtonActive : styles.toolButtonInactive), padding: '10px 15px', fontSize: '1em' }} hoverStyle={selectedTool === label ? styles.toolButtonActiveHover : styles.toolButtonInactiveHover}>{label}</HoverButton>))}
                        </div>
                    </div>
                    <div style={{ ...styles.inventorySection, minWidth: '300px', flex: '2 1 auto', overflowY: 'auto', maxHeight: 'calc(100vh - 450px)' }}>
                        <h3 style={styles.inventoryTitle}>Інвентар меблів</h3>
                        <input
                            type="text"
                            placeholder="Пошук меблів..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(filteredFurnitureCategories).map(([category, items]) => (
                                <div key={category}>
                                    <h4 style={styles.inventoryCategoryTitle}>{category}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {items.map(({ type, label }) => (
                                            <HoverDiv
                                                key={type}
                                                onMouseDown={() => handleFurnitureDragStart(type)}
                                                style={styles.furnitureItem}
                                                hoverStyle={styles.furnitureItemHover}
                                                title={`Перетягніть для розміщення: ${label}`}
                                            >
                                                {label}
                                            </HoverDiv>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ ...styles.inventorySection, minWidth: '150px', flex: '0 0 auto', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
                            <HoverButton onClick={undo} disabled={!canUndo} style={{ ...styles.buttonBase, padding: '10px 20px', fontSize: '1em', ...(!canUndo ? styles.toolButtonInactive : styles.toolButtonActive) }} hoverStyle={styles.toolButtonActiveHover}>↩️ Назад</HoverButton>
                            <HoverButton onClick={redo} disabled={!canRedo} style={{ ...styles.buttonBase, padding: '10px 20px', fontSize: '1em', ...(!canRedo ? styles.toolButtonInactive : styles.toolButtonActive) }} hoverStyle={styles.toolButtonActiveHover}>↪️ Вперед</HoverButton>
                        </div>
                    </div>
                </div>
            )}
            <Tutorial show={showTutorial} onClose={() => setShowTutorial(false)} />
            <GraphicsSettingsModal show={showGraphicsSettings} onClose={() => setShowGraphicsSettings(false)} settings={graphicsSettings} onSettingsChange={handleGraphicsSettingsChange} onPresetChange={handlePresetChange} />
            <RmcAiModal show={showAiModal} onClose={() => setShowAiModal(false)} onGenerate={generateRoomWithAI} />
            <Modal show={showModal} title={modalContent.title} message={modalContent.message} onClose={() => setShowModal(false)} onConfirm={modalContent.onConfirm} isConfirm={modalContent.isConfirm} />
            {!isTestDrive && (
                <ContextMenu
                    menuState={contextMenu}
                    onAction={handleContextMenuAction}
                    onColorSelect={paintObject}
                    baseColors={BASE_COLORS}
                    userColors={userColors}
                    customColor={customColor}
                    setCustomColor={setCustomColor}
                    addUserColor={addUserColor}
                    onRotationChange={handleRotationChange}
                    furniture={furniture}
                    walls={walls}
                />
            )}
        </div>
    );
}
