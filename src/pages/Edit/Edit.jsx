import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import { GridHelper, Vector3, MeshStandardMaterial, Raycaster, Plane, Euler, Quaternion, PointLight, SpotLight, TextureLoader } from 'three';
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
        background: 'rgba(31, 41, 55, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: 'var(--text-color-light)',
        padding: '15px',
        display: 'flex',
        flexWrap: 'nowrap', // Изменено с 'wrap' на 'nowrap'
        gap: '20px',
        overflowX: 'auto', // Изменено с 'hidden' на 'auto' для прокрутки
        overflowY: 'hidden', // Изменено с 'auto' на 'hidden'
        maxHeight: '280px',
        borderTop: '1px solid rgba(75, 85, 99, 0.5)',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
        borderRadius: '15px 15px 0 0',
        position: 'relative',
        zIndex: 999,
        transition: 'transform 0.3s ease-out',
    },
    inventorySection: {
        background: 'var(--primary-darker)',
        padding: '12px',
        borderRadius: '10px',
        minWidth: '150px',
        flex: '1 1 auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    inventoryTitle: {
        margin: '0 0 10px 0',
        color: '#E1E6F0',
        fontSize: '1.2em',
        fontWeight: '700',
    },
    inventorySubTitle: {
        margin: '0 0 6px 0',
        color: 'var(--text-color-muted)',
        fontSize: '1em',
        fontWeight: '600',
        borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
        paddingBottom: '4px',
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
    colorInput: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: '2px solid #4B5563',
        overflow: 'hidden',
        background: 'transparent',
        padding: 0,
        boxSizing: 'content-box',
        transition: 'border-color 0.2s ease',
    },
    colorSwatch: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'border 0.2s ease, transform 0.2s',
    },
    colorSwatchSelected: {
        border: '3px solid #F59E0B',
        boxShadow: '0 0 0 1px #F59E0B',
    },
    furnitureItem: {
        padding: '8px 12px',
        background: 'rgba(31, 41, 55, 0.8)',
        color: '#FFFFFF',
        borderRadius: '8px',
        cursor: 'grab',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        userSelect: 'none',
        fontSize: '0.9em',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    furnitureItemHover: {
        backgroundColor: 'rgba(45, 156, 219, 0.3)',
        transform: 'translateY(-2px)',
    },
    roomNameInput: {
        background: '#4B5563',
        color: 'var(--text-color-light)',
        border: '1px solid #6B7280',
        borderRadius: '5px',
        padding: '8px 12px',
        fontSize: '1em',
        outline: 'none',
        width: 'calc(100% - 24px)',
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
    }
};


const HoverButton = ({ children, style, hoverStyle, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    const mergedStyle = {
        ...style,
        ...(isHovered ? hoverStyle : {}),
    };

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={mergedStyle}
        >
            {children}
        </button>
    );
};

const HoverDiv = ({ children, style, hoverStyle, onMouseDown, title }) => {
    const [isHovered, setIsHovered] = useState(false);

    const mergedStyle = {
        ...style,
        ...(isHovered ? hoverStyle : {}),
    };

    return (
        <div
            onMouseDown={onMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={mergedStyle}
            title={title}
        >
            {children}
        </div>
    );
};


const CELL_SIZE = 1;
const WALL_HEIGHT = 3;
const INITIAL_GRID_SIZE = 16;
const FLOOR_LEVEL = 0;

const INITIAL_CAMERA_POSITION = [20, 24, 20];
const INITIAL_LOOK_AT_TARGET = new Vector3(0, 0, 0);

const MOVEMENT_SPEED = 0.5;
const VERTICAL_MOVEMENT_SPEED = 0.3;
const ROTATION_SPEED_KEYBOARD_YAW = 0.1;
const ROTATION_SPEED_KEYBOARD_PITCH = 0.1;

const LERP_FACTOR = 0.2;

const TOOL_TYPES = {
    wall: '🧱 Стіна',
    floor: '⬜ Підлога',
    paint: '🎨 Фарба',
    furniture: 'Меблі',
};

const BASE_COLORS = ['#E1E6F0', '#2C3A59', '#2D9CDB', '#FFA94D', '#228B22'];

const hoverMaterial = new MeshStandardMaterial({ color: "#ADD8E6", transparent: true, opacity: 0.3 });
const phantomMaterial = new MeshStandardMaterial({ color: "#2D9CDB", transparent: true, opacity: 0.5 });
const invalidPhantomMaterial = new MeshStandardMaterial({ color: "#FF0000", transparent: true, opacity: 0.5 });


const FURNITURE_CATEGORIES = {
    '🛋️ Меблі': [
        { type: 'sofa', label: 'Диван', dimensions: { width: 1.6, depth: 0.8, height: 0.8 } },
        { type: 'chair', label: 'Стілець', dimensions: { width: 0.6, depth: 0.6, height: 0.8 } },
        { type: 'table', label: 'Стіл', dimensions: { width: 1.0, depth: 0.8, height: 0.8 } },
        { type: 'coffeeTable', label: 'Журнальний стіл', dimensions: { width: 0.8, depth: 0.5, height: 0.4 } },
        { type: 'bookshelf', label: 'Книжкова шафа', dimensions: { width: 1.0, depth: 0.3, height: 1.8 } },
        { type: 'armchair', label: 'Крісло', dimensions: { width: 0.8, depth: 0.8, height: 0.9 } },
        { type: 'fireplace', label: 'Камін', dimensions: { width: 1.5, depth: 0.5, height: 1.2 } },
    ],
    '🚪 Двері та вікна': [
        { type: 'door', label: 'Двері', dimensions: { width: 0.9, depth: 0.05, height: WALL_HEIGHT } },
        { type: 'window', label: 'Вікно', dimensions: { width: 0.9, depth: 0.05, height: WALL_HEIGHT } },
    ],
    '🧑‍🍳 Кухня': [
        { type: 'kitchenTable', label: 'Кухонний стіл', dimensions: { width: 1.2, depth: 0.7, height: 0.8 } },
        { type: 'kitchenCabinet', label: 'Кухонна шафа', dimensions: { width: 1.0, depth: 0.5, height: 1.0 } },
    ],
    '🌳 Вулиця': [
        { type: 'outdoorChair', label: 'Вуличний стілець', dimensions: { width: 0.6, depth: 0.6, height: 0.5 } },
        { type: 'outdoorTable', label: 'Вуличний стіл', dimensions: { width: 1.0, depth: 1.0, height: 0.75 } },
        { type: 'grill', label: 'Гриль', dimensions: { width: 0.7, depth: 0.5, height: 1.0 } },
        { type: 'gardenBench', label: 'Садова лавка', dimensions: { width: 1.5, depth: 0.5, height: 0.6 } },
    ],
    '🛏️ Спальня': [
        { type: 'bed', label: 'Ліжко', dimensions: { width: 1.9, depth: 1.3, height: 0.5 } },
        { type: 'lamp', label: 'Торшер', dimensions: { width: 0.3, depth: 0.3, height: 1.1 } },
        { type: 'cabinet', label: 'Шафа', dimensions: { width: 1.0, depth: 0.5, height: 2.0 } },
        { type: 'dresser', label: 'Комод', dimensions: { width: 1.2, depth: 0.5, height: 0.9 } },
        { type: 'nightstand', label: 'Тумбочка', dimensions: { width: 0.5, depth: 0.4, height: 0.6 } },
        { type: 'wardrobe', label: 'Шафа для одягу', dimensions: { width: 1.5, depth: 0.6, height: 2.2 } },
    ],
    '💻 Техніка': [
        { type: 'tv', label: 'Телевізор', dimensions: { width: 1.6, depth: 0.6, height: 1.0 } },
        { type: 'console', label: 'Консоль', dimensions: { width: 0.4, depth: 0.1, height: 0.6 } },
        { type: 'computerSetup', label: 'Комп’ютер', dimensions: { width: 1.6, depth: 0.7, height: 1.0 } },
    ],
    '💡 Освітлення': [
        { type: 'ceilingLamp', label: 'Стельова лампа', dimensions: { width: 0.6, depth: 0.6, height: 0.6 } },
        { type: 'rgbStrip', label: 'RGB-підсвітка', dimensions: { width: 1.0, depth: 0.05, height: 0.02 } },
        { type: 'spotlight', label: 'Прожектор', dimensions: { width: 0.3, depth: 0.3, height: 0.3 } },
    ],
    '🌱 Рослини': [
        { type: 'pottedPlant', label: 'Кімнатна рослина', dimensions: { width: 0.4, depth: 0.4, height: 0.8 } },
        { type: 'tallPlant', label: 'Висока рослина', dimensions: { width: 0.5, depth: 0.5, height: 1.5 } },
    ],
    '🚿 Ванна кімната': [
        { type: 'toilet', label: 'Унітаз', dimensions: { width: 0.4, depth: 0.7, height: 0.7 } },
        { type: 'sink', label: 'Раковина', dimensions: { width: 0.6, depth: 0.5, height: 0.8 } },
        { type: 'bathtub', label: 'Ванна', dimensions: { width: 1.7, depth: 0.8, height: 0.6 } },
        { type: 'shower', label: 'Душ', dimensions: { width: 0.9, depth: 0.9, height: 2.0 } },
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

const isWebGLSupported = () => {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
};

const isMobileDevice = () => {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('Mobi') !== -1);
};

const calculateWallSnapPosition = (x, z, walls, floorTiles, getKey, furnitureItem) => {
    if (!furnitureItem || !furnitureItem.dimensions) {
        return { x: x, z: z, snapped: false, offsetX: 0, offsetZ: 0 };
    }

    const { width, depth } = furnitureItem.dimensions;
    const rotation = furnitureItem.rotation || 0;

    const halfEffectiveWidth = (Math.abs(Math.cos(rotation)) * width + Math.abs(Math.sin(rotation)) * depth) / 2;
    const halfEffectiveDepth = (Math.abs(Math.sin(rotation)) * width + Math.abs(Math.cos(rotation)) * depth) / 2;

    const baseKey = getKey(x, z);
    if (!floorTiles[baseKey]) {
        return { x: x, z: z, snapped: false, offsetX: 0, offsetZ: 0 };
    }

    const potentialSnaps = [
        { wallX: x - 1, wallZ: z, offsetX: -0.5 + halfEffectiveWidth, offsetZ: 0, direction: 'left' },
        { wallX: x + 1, wallZ: z, offsetX: 0.5 - halfEffectiveWidth, offsetZ: 0, direction: 'right' },
        { wallX: x, wallZ: z - 1, offsetX: 0, offsetZ: -0.5 + halfEffectiveDepth, direction: 'front' },
        { wallX: x, wallZ: z + 1, offsetX: 0, offsetZ: 0.5 - halfEffectiveDepth, direction: 'back' },
    ];

    let bestSnap = { x: x, z: z, snapped: false, offsetX: 0, offsetZ: 0 };
    let minDistance = Infinity;

    for (const snap of potentialSnaps) {
        const wallKey = getKey(snap.wallX, snap.wallZ);
        if (walls[wallKey] && !walls[wallKey].hasOpening) {
            const distance = Math.sqrt(
                Math.pow(snap.offsetX, 2) +
                Math.pow(snap.offsetZ, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                bestSnap = {
                    x: x,
                    z: z,
                    snapped: true,
                    offsetX: snap.offsetX,
                    offsetZ: snap.offsetZ,
                    direction: snap.direction
                };
            }
        }
    }
    return bestSnap;
};

const Modal = ({ show, title, message, onClose, onConfirm, isConfirm = false }) => {
    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
        }}>
            <div style={{
                background: styles.tutorialContent.background,
                padding: styles.tutorialContent.padding,
                borderRadius: styles.tutorialContent.borderRadius,
                boxShadow: styles.tutorialContent.boxShadow,
                color: styles.tutorialContent.color,
                maxWidth: '400px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h2 style={{ color: styles.tutorialTitle.color, margin: 0 }}>{title}</h2>
                <p style={{ lineHeight: 1.6, color: styles.tutorialText.color }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: isConfirm ? 'space-between' : 'center', marginTop: '20px' }}>
                    {isConfirm && (
                        <HoverButton
                            onClick={onClose}
                            style={{
                                ...styles.buttonBase,
                                ...styles.tutorialSkipButton,
                                padding: '10px 20px',
                                fontSize: '16px',
                                opacity: 0.9,
                            }}
                            hoverStyle={styles.tutorialSkipButtonHover}
                        >
                            Скасувати
                        </HoverButton>
                    )}
                    <HoverButton
                        onClick={onConfirm || onClose}
                        style={{
                            ...styles.buttonBase,
                            ...styles.tutorialNextButton,
                            padding: '10px 20px',
                            fontSize: '16px',
                            marginLeft: isConfirm ? 'auto' : '0',
                        }}
                        hoverStyle={styles.tutorialNextButtonHover}
                    >
                        {isConfirm ? 'Підтвердити' : 'ОК'}
                    </HoverButton>
                </div>
            </div>
        </div>
    );
};

const Chair = React.memo(({ color = '#A0522D', rotation, isHighlighted, isPhantom }) => {
    const seatMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 });

    const frameMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color: '#2C3A59', roughness: 0.6 });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.3, 0]} material={seatMaterial}>
                <boxGeometry args={[0.5, 0.08, 0.5]} />
            </mesh>
            <mesh position={[0, 0.58, -0.22]} material={seatMaterial}>
                <boxGeometry args={[0.5, 0.5, 0.08]} />
            </mesh>
            {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.13, z]} material={frameMaterial}>
                    <cylinderGeometry args={[0.025, 0.025, 0.26, 12]} />
                </mesh>
            ))}
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});


const OutdoorChair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.2, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.6, 0.05, 0.6]} />
        </mesh>
        <mesh position={[0, 0.45, -0.25]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
        </mesh>
        {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.1, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
                <cylinderGeometry args={[0.04, 0.04, 0.2]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Table = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1, 0.05, 0.8]} />
        </mesh>
        {[[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.375, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const CoffeeTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.38, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.8, 0.04, 0.5]} />
        </mesh>
        {[[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.19, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.05, 0.38, 0.05]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Bookshelf = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.9, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.0, 1.8, 0.3]} />
        </mesh>
        {[0.4, 0, -0.4].map((y, i) => (
            <mesh key={i} position={[0, 0.9 + y, 0.13]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.9, 0.05, 0.2]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Armchair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const baseMaterial = new MeshStandardMaterial({ color: "#2C3A59" });
    const seatMaterial = new MeshStandardMaterial({ color });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.2, 0]} material={isPhantom ? phantomMaterial : baseMaterial}>
                <boxGeometry args={[0.8, 0.3, 0.8]} />
            </mesh>
            <mesh position={[0, 0.35, 0]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[0.7, 0.15, 0.7]} />
            </mesh>
            <mesh position={[0, 0.6, -0.3]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[0.7, 0.4, 0.1]} />
            </mesh>
            <mesh position={[-0.35, 0.45, 0]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[0.1, 0.4, 0.7]} />
            </mesh>
            <mesh position={[0.35, 0.45, 0]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[0.1, 0.4, 0.7]} />
            </mesh>
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Fireplace = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.6, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.5, 1.2, 0.5]} />
        </mesh>
        <mesh position={[0, 0.4, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#111111" })}>
            <boxGeometry args={[0.8, 0.8, 0.05]} />
        </mesh>
        <mesh position={[0, 0.1, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#8B4513" })}>
            <boxGeometry args={[0.8, 0.2, 0.05]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const DiningTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.8, 0.05, 0.9]} />
        </mesh>
        {[[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.375, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.07, 0.75, 0.07]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const DiningChair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const seatMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 });

    const frameMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color: '#2C3A59', roughness: 0.6 });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.4, 0]} material={seatMaterial}>
                <boxGeometry args={[0.5, 0.08, 0.5]} />
            </mesh>
            <mesh position={[0, 0.7, -0.22]} material={seatMaterial}>
                <boxGeometry args={[0.5, 0.6, 0.08]} />
            </mesh>
            {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.18, z]} material={frameMaterial}>
                    <cylinderGeometry args={[0.025, 0.025, 0.36, 12]} />
                </mesh>
            ))}
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const OutdoorTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.7, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
        </mesh>
        <mesh position={[0, 0.35, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
            <cylinderGeometry args={[0.05, 0.1, 0.7, 16]} />
        </mesh>
        <mesh position={[0, 0.05, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Grill = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.8, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#333333" })}>
            <boxGeometry args={[0.7, 0.2, 0.5]} />
        </mesh>
        <mesh position={[0, 0.95, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#555555" })}>
            <boxGeometry args={[0.7, 0.05, 0.5]} />
        </mesh>
        <mesh position={[0, 0.6, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#444444" })}>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 16]} />
        </mesh>
        {[[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.05, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#222222" })}>
                <cylinderGeometry args={[0.03, 0.03, 0.1, 12]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const GardenBench = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.5, 0.1, 0.5]} />
        </mesh>
        <mesh position={[0, 0.45, -0.2]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.5, 0.4, 0.1]} />
        </mesh>
        {[[-0.7, 0.05, -0.2], [0.7, 0.05, -0.2], [-0.7, 0.05, 0.2], [0.7, 0.05, 0.2]].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
                <boxGeometry args={[0.05, 0.5, 0.05]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Sofa = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const baseMaterial = new MeshStandardMaterial({ color: "#2C3A59" });
    const seatMaterial = new MeshStandardMaterial({ color });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.2, 0]} material={isPhantom ? phantomMaterial : baseMaterial}>
                <boxGeometry args={[1.6, 0.3, 0.8]} />
            </mesh>
            <mesh position={[0, 0.35, 0]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[1.5, 0.15, 0.7]} />
            </mesh>
            <mesh position={[0, 0.6, -0.3]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[1.5, 0.4, 0.1]} />
            </mesh>
            <mesh position={[-0.8, 0.45, 0]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[0.1, 0.4, 0.7]} />
            </mesh>
            <mesh position={[0.8, 0.45, 0]} material={isPhantom ? phantomMaterial : seatMaterial}>
                <boxGeometry args={[0.1, 0.4, 0.7]} />
            </mesh>
            {[[-0.75, 0.05, -0.3], [0.75, 0.05, -0.3], [-0.75, 0.05, 0.3], [0.75, 0.05, 0.3]].map(([x, y, z], i) => (
                <mesh key={i} position={[x, y, z]} material={isPhantom ? phantomMaterial : baseMaterial}>
                    <cylinderGeometry args={[0.03, 0.03, 0.1, 16]} />
                </mesh>
            ))}
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Bed = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const frameMaterial = new MeshStandardMaterial({ color: "#2C3A59" });
    const mattressMaterial = new MeshStandardMaterial({ color });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.2, 0]} material={isPhantom ? phantomMaterial : frameMaterial}>
                <boxGeometry args={[1.9, 0.3, 1.3]} />
            </mesh>

            <mesh position={[0, 0.4, 0]} material={isPhantom ? phantomMaterial : mattressMaterial}>
                <boxGeometry args={[1.8, 0.2, 1.2]} />
            </mesh>

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Lamp = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const baseMaterial = new MeshStandardMaterial({ color: "#3A3A3A" });
    const poleMaterial = new MeshStandardMaterial({ color: "#5A5A5A" });
    const shadeMaterial = new MeshStandardMaterial({ color: color, side: THREE.DoubleSide, roughness: 0.8 });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.05, 0]} material={isPhantom ? phantomMaterial : baseMaterial}>
                <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
            </mesh>

            <mesh position={[0, 0.5, 0]} material={isPhantom ? phantomMaterial : poleMaterial}>
                <cylinderGeometry args={[0.03, 0.03, 0.9, 16]} />
            </mesh>

            <mesh position={[0, 1.05, 0]} rotation={[Math.PI, 0, 0]} material={isPhantom ? phantomMaterial : shadeMaterial}>
                <coneGeometry args={[0.25, 0.3, 32]} />
            </mesh>

            {!isPhantom && (
                <pointLight
                    intensity={10}
                    distance={10}
                    color={color}
                    position={[0, WALL_HEIGHT + 0.5, 0]}
                    decay={2}
                />
            )}

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Dresser = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.45, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.2, 0.9, 0.5]} />
        </mesh>
        {[0.25, -0.25].map((x, i) => (
            <mesh key={i} position={[x, 0.45, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.5, 0.8, 0.05]} />
            </mesh>
        ))}
        {[0.15, -0.15].map((y, i) => (
            <mesh key={i} position={[0, 0.6 + y, 0.28]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
                <boxGeometry args={[0.1, 0.02, 0.05]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Nightstand = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.5, 0.6, 0.4]} />
        </mesh>
        <mesh position={[0, 0.45, 0.21]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
            <boxGeometry args={[0.4, 0.2, 0.02]} />
        </mesh>
        <mesh position={[0, 0.15, 0.21]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
            <boxGeometry args={[0.4, 0.2, 0.02]} />
        </mesh>
        <mesh position={[0, 0.45, 0.22]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
            <boxGeometry args={[0.1, 0.02, 0.02]} />
        </mesh>
        <mesh position={[0, 0.15, 0.22]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
            <boxGeometry args={[0.1, 0.02, 0.02]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Wardrobe = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 1.1, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.5, 2.2, 0.6]} />
        </mesh>
        {[-0.35, 0.35].map((x, i) => (
            <mesh key={i} position={[x, 1.1, 0.31]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.7, 2.0, 0.05]} />
            </mesh>
        ))}
        {[[-0.6, 1.1, 0.33], [0.6, 1.1, 0.33]].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Cabinet = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 1, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1, 2, 0.5]} />
        </mesh>
        <mesh position={[-0.25, 1, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.48, 1.8, 0.05]} />
        </mesh>
        <mesh position={[0.25, 1, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.48, 1.8, 0.05]} />
        </mesh>
        {[-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 1, 0.28]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
            </mesh>
        ))}
        {[0.5, 1.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
                <boxGeometry args={[0.9, 0.05, 0.4]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const KitchenCabinet = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.5, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1, 1, 0.5]} />
        </mesh>
        <mesh position={[-0.25, 0.5, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.48, 0.8, 0.05]} />
        </mesh>
        <mesh position={[0.25, 0.5, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.48, 0.8, 0.05]} />
        </mesh>
        {[-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 0.5, 0.28]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
            </mesh>
        ))}
        <mesh position={[0, 1.025, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#6B7280" })}>
            <boxGeometry args={[1, 0.05, 0.5]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const KitchenTable = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.2, 0.05, 0.7]} />
        </mesh>
        {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.375, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.07, 0.75, 0.07]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Toilet = React.memo(({ color = "#ffffff", rotation = 0, isHighlighted, isPhantom }) => {
    const material = isPhantom
        ? phantomMaterial
        : new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0 });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.25, 0]} material={material}>
                <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
            </mesh>

            <mesh position={[0, 0.65, 0]} rotation={[-0.1, 0, 0]} material={material}>
                <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
            </mesh>

            <mesh position={[0, 0.9, -0.3]} material={material}>
                <boxGeometry args={[0.5, 0.4, 0.15]} />
            </mesh>

            <mesh position={[0, 1.1, -0.3]} material={material}>
                <boxGeometry args={[0.5, 0.05, 0.15]} />
            </mesh>



            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});


const Sink = React.memo(({ color = "#ffffff", rotation = 0, isHighlighted, isPhantom }) => {
    const sinkMaterial = isPhantom
        ? phantomMaterial
        : new THREE.MeshStandardMaterial({
            color,
            roughness: 0.3,
            metalness: 0,
        });

    const innerMaterial = isPhantom
        ? phantomMaterial
        : new THREE.MeshStandardMaterial({
            color: "#e6f0f7",
            roughness: 0.2,
            metalness: 0,
            transparent: true,
            opacity: 0.85,
        });

    const faucetMaterial = isPhantom
        ? phantomMaterial
        : new THREE.MeshStandardMaterial({ color: "#888888", metalness: 1, roughness: 0.25 });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.4, 0]} material={sinkMaterial}>
                <boxGeometry args={[0.7, 0.35, 0.5]} />
            </mesh>
            <mesh position={[0, 0.45, 0]} material={innerMaterial}>
                <boxGeometry args={[0.55, 0.15, 0.35]} />
            </mesh>
            <group position={[0.2, 0.65, 0]}>
                <mesh material={faucetMaterial}>
                    <cylinderGeometry args={[0.05, 0.05, 0.25, 32]} />
                </mesh>
                <mesh position={[0, 0.125, 0.1]} rotation={[-Math.PI / 2, 0, 0]} material={faucetMaterial}>
                    <torusGeometry args={[0.07, 0.02, 16, 100, Math.PI * 0.8]} />
                </mesh>
            </group>
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});


const Bathtub = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.7, 0.6, 0.8]} />
        </mesh>
        <mesh position={[0, 0.35, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#ADD8E6", transparent: true, opacity: 0.7 })}>
            <boxGeometry args={[1.6, 0.5, 0.7]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Shower = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, WALL_HEIGHT / 2, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#ADD8E6", transparent: true, opacity: 0.3 })}>
            <boxGeometry args={[0.9, WALL_HEIGHT, 0.9]} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.1, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.2, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 16]} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT - 0.3, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#AAAAAA" })}>
            <sphereGeometry args={[0.05, 16, 16]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Desk = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.73, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[1.4, 0.04, 0.7]} />
        </mesh>
        <mesh position={[-0.6, 0.375, -0.25]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
            <boxGeometry args={[0.05, 0.75, 0.4]} />
        </mesh>
        <mesh position={[0.6, 0.375, -0.25]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
            <boxGeometry args={[0.05, 0.75, 0.4]} />
        </mesh>
        <mesh position={[-0.3, 0.5, 0.25]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.5, 0.4, 0.4]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const OfficeChair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.45, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
        </mesh>
        <mesh position={[0, 0.7, -0.2]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#4B5563" })}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
        </mesh>
        <mesh position={[0, 0.05, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 5]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const FilingCabinet = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.75, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.5, 1.5, 0.5]} />
        </mesh>
        {[0.4, 0, -0.4].map((y, i) => (
            <mesh key={i} position={[0, 0.75 + y, 0.26]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[0.45, 0.4, 0.05]} />
            </mesh>
        ))}
        {[0.4, 0, -0.4].map((y, i) => (
            <mesh key={i} position={[0, 0.75 + y, 0.28]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
                <boxGeometry args={[0.1, 0.02, 0.05]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Painting = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const paintingMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color: new THREE.Color(color) });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, WALL_HEIGHT / 2, -0.49]} material={paintingMaterial}>
                <boxGeometry args={[1.0, 0.8, 0.02]} />
            </mesh>
            <mesh position={[0, WALL_HEIGHT / 2, -0.48]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <boxGeometry args={[1.05, 0.85, 0.01]} />
            </mesh>
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});


const Door = React.memo(({ color = '#5A2D0C', rotation = 0, isHighlighted, isPhantom }) => {
    const doorMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({
            color,
            roughness: 0.3,
            metalness: 0.1,
        });

    const frameMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({
            color: '#3B2A1A',
            roughness: 0.4,
        });

    const handleMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({
            color: '#FFD700',
            metalness: 1,
            roughness: 0.15,
        });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, WALL_HEIGHT / 2, 0]} material={doorMaterial}>
                <boxGeometry args={[0.85, WALL_HEIGHT - 0.2, 0.05]} />
            </mesh>



            <mesh position={[0, WALL_HEIGHT - 0.04, -0.03]} material={frameMaterial}>
                <boxGeometry args={[1.0, 0.1, 0.06]} />
            </mesh>

            <mesh position={[-0.48, WALL_HEIGHT / 2, -0.03]} material={frameMaterial}>
                <boxGeometry args={[0.06, WALL_HEIGHT, 0.06]} />
            </mesh>

            <mesh position={[0.48, WALL_HEIGHT / 2, -0.03]} material={frameMaterial}>
                <boxGeometry args={[0.06, WALL_HEIGHT, 0.06]} />
            </mesh>

            <mesh position={[0.37, WALL_HEIGHT / 2, 0.035]} material={handleMaterial}>
                <boxGeometry args={[0.15, 0.04, 0.025]} />
            </mesh>

            <mesh position={[0.37, WALL_HEIGHT / 2, -0.035]} material={handleMaterial}>
                <boxGeometry args={[0.15, 0.04, 0.025]} />
            </mesh>

            {isHighlighted && (
                <Outlines thickness={0.02} color="#FFFF00" opacity={1} />
            )}
        </group>
    );
});


const Window = React.memo(({ color, rotation, isHighlighted, isPhantom, neighborLeft, neighborRight, neighborFront, neighborBack }) => {
    const material = new MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
        metalness: 0.2,
    });

    const frameMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({
            color: '#3B2A1A',
            roughness: 0.4,
        });

    const windowWidth = 0.9;
    const frameThickness = 0.05;

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, WALL_HEIGHT / 2, 0]} material={isPhantom ? phantomMaterial : material}>
                <boxGeometry args={[windowWidth, WALL_HEIGHT, 0.01]} />
            </mesh>

            <mesh position={[0, WALL_HEIGHT - frameThickness / 2, 0]} material={isPhantom ? phantomMaterial : frameMaterial}>
                <boxGeometry args={[windowWidth + frameThickness, frameThickness, frameThickness]} />
            </mesh>

            <mesh position={[0, frameThickness / 2, 0]} material={isPhantom ? phantomMaterial : frameMaterial}>
                <boxGeometry args={[windowWidth + frameThickness, frameThickness, frameThickness]} />
            </mesh>

            {!(rotation === 0 && neighborLeft) && !(rotation === Math.PI && neighborRight) && !(rotation === Math.PI / 2 && neighborFront) && !(rotation === 3 * Math.PI / 2 && neighborBack) && (
                <mesh position={[-(windowWidth / 2 + frameThickness / 2), WALL_HEIGHT / 2, 0]} material={isPhantom ? phantomMaterial : frameMaterial}>
                    <boxGeometry args={[frameThickness, WALL_HEIGHT, frameThickness]} />
                </mesh>
            )}
            {!(rotation === 0 && neighborRight) && !(rotation === Math.PI && neighborLeft) && !(rotation === Math.PI / 2 && neighborBack) && !(rotation === 3 * Math.PI / 2 && neighborFront) && (
                <mesh position={[(windowWidth / 2 + frameThickness / 2), WALL_HEIGHT / 2, 0]} material={isPhantom ? phantomMaterial : frameMaterial}>
                    <boxGeometry args={[frameThickness, WALL_HEIGHT, frameThickness]} />
                </mesh>
            )}

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});


const TV = React.memo(({ color = '#8B5E3C', rotation = 0, isHighlighted, isPhantom, standColor = '#1E1E1E' }) => {
    const frameMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color: "#2C3A59", roughness: 0.3, metalness: 0.4 });

    const screenMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color: "#000000", roughness: 0.1, metalness: 0.9, envMapIntensity: 0.7 });

    const standMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color: standColor, roughness: 0.5, metalness: 0.6 });

    const cabinetMaterial = isPhantom
        ? phantomMaterial
        : new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.25, 0]} material={cabinetMaterial}>
                <boxGeometry args={[1.6, 0.5, 0.6]} />
            </mesh>

            <mesh position={[0, 0.85, 0]} material={frameMaterial}>
                <boxGeometry args={[1.25, 0.75, 0.06]} />
            </mesh>

            <mesh position={[0, 0.85, 0.035]} material={screenMaterial}>
                <boxGeometry args={[1.15, 0.65, 0.015]} />
            </mesh>

            <mesh position={[0, 0.55, 0]} material={standMaterial}>
                <boxGeometry args={[0.12, 0.25, 0.12]} />
            </mesh>

            <mesh position={[0, 0.43, 0]} material={standMaterial}>
                <boxGeometry args={[0.5, 0.025, 0.3]} />
            </mesh>

            {[-0.18, 0.18].map((x) => (
                <mesh key={x} position={[x, 0.35, 0.1]} material={standMaterial}>
                    <boxGeometry args={[0.1, 0.15, 0.05]} />
                </mesh>
            ))}

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Console = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.1, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
            <boxGeometry args={[0.4, 0.1, 0.6]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const ComputerSetup = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const baseMat = useMemo(() => new MeshStandardMaterial({ color }), [color]);
    const darkMat = useMemo(() => new MeshStandardMaterial({ color: "#2C3A59" }), []);
    const blackMat = useMemo(() => new MeshStandardMaterial({ color: "#111111" }), []);
    const grayMat = useMemo(() => new MeshStandardMaterial({ color: "#4B5563" }), []);
    const rgbMat = useMemo(() => new MeshStandardMaterial({
        color: "#000000",
        emissive: new THREE.Color(0.0, 0.8, 1.0),
        emissiveIntensity: 1.5,
        toneMapped: false,
    }), []);

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.4, 0]} material={isPhantom ? phantomMaterial : baseMat}>
                <boxGeometry args={[1.6, 0.05, 0.7]} />
            </mesh>

            {[[-0.75, 0.35], [0.75, 0.35], [-0.75, -0.35], [0.75, -0.35]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.2, z]} material={isPhantom ? phantomMaterial : darkMat}>
                    <boxGeometry args={[0.05, 0.4, 0.05]} />
                </mesh>
            ))}

            <mesh position={[0, 0.8, -0.25]} material={isPhantom ? phantomMaterial : darkMat}>
                <boxGeometry args={[0.7, 0.4, 0.05]} />
            </mesh>
            <mesh position={[0, 0.78, -0.24]} material={isPhantom ? phantomMaterial : blackMat}>
                <boxGeometry args={[0.65, 0.35, 0.01]} />
            </mesh>

            <mesh position={[0, 0.6, -0.25]} material={isPhantom ? phantomMaterial : grayMat}>
                <cylinderGeometry args={[0.03, 0.03, 0.2, 16]} />
            </mesh>

            <mesh position={[-0.55, 0.6, 0.25]} material={isPhantom ? phantomMaterial : darkMat}>
                <boxGeometry args={[0.25, 0.9, 0.45]} />
            </mesh>

            <mesh position={[0.2, 0.43, 0.15]} material={isPhantom ? phantomMaterial : grayMat}>
                <boxGeometry args={[0.5, 0.02, 0.15]} />
            </mesh>

            <mesh position={[0.6, 0.43, 0.2]} material={isPhantom ? phantomMaterial : blackMat}>
                <boxGeometry args={[0.1, 0.02, 0.07]} />
            </mesh>

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const CeilingLamp = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const lampMaterial = new MeshStandardMaterial({ color, transparent: true, opacity: 0.7 });
    const holderMaterial = new MeshStandardMaterial({ color: "#4B5563" });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, WALL_HEIGHT + 0.9, 0]} material={isPhantom ? phantomMaterial : holderMaterial}>
                <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            </mesh>

            <mesh position={[0, WALL_HEIGHT + 0.7, 0]} material={isPhantom ? phantomMaterial : holderMaterial}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            </mesh>

            <mesh position={[0, WALL_HEIGHT + 0.5, 0]} material={isPhantom ? phantomMaterial : lampMaterial}>
                <sphereGeometry args={[0.3, 16, 16]} />
            </mesh>

            {!isPhantom && (
                <pointLight
                    intensity={10}
                    distance={10}
                    color={color}
                    position={[0, WALL_HEIGHT + 0.5, 0]}
                    decay={2}
                />
            )}

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const Spotlight = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, WALL_HEIGHT - 0.2, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
            <cylinderGeometry args={[0.1, 0.2, 0.3]} />
        </mesh>
        {!isPhantom && <spotLight position={[0, WALL_HEIGHT - 0.2, 0]} target-position={[0, 0, 0]} angle={Math.PI / 6} penumbra={0.5} intensity={50} distance={10} color={color} castShadow />}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const RgbStrip = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const [rgbColor, setRgbColor] = useState(new THREE.Color(color));

    useEffect(() => {
        if (!isPhantom) {
            const interval = setInterval(() => {
                setRgbColor(new THREE.Color(Math.random() * 0xffffff));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isPhantom]);

    const stripMaterial = useMemo(() => new MeshStandardMaterial({ color: isPhantom ? phantomMaterial.color : rgbColor, emissive: isPhantom ? new THREE.Color(0x000000) : rgbColor, emissiveIntensity: isPhantom ? 0 : 0.5 }), [isPhantom, rgbColor]);

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.05, 0]} material={stripMaterial}>
                <boxGeometry args={[1, 0.02, 0.05]} />
            </mesh>
            {!isPhantom && <pointLight intensity={5} distance={2} color={rgbColor} />}
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const PottedPlant = React.memo(({ color = "#2E8B57", rotation = 0, isHighlighted, isPhantom }) => {
    const potMaterial = useMemo(() =>
        new MeshStandardMaterial({
            color: "#8B4513",
            roughness: 0.6,
            metalness: 0.3
        }), []);

    const plantMaterial = useMemo(() =>
        new MeshStandardMaterial({
            color,
            roughness: 0.8,
            metalness: 0,
        }), [color]);

    const leafMaterial = useMemo(() =>
        new MeshStandardMaterial({
            color,
            roughness: 0.7,
            metalness: 0,
        }), [color]);

    const Leaf = ({ position, rotation }) => (
        <>
            <mesh position={position} rotation={rotation} material={isPhantom ? phantomMaterial : leafMaterial}>
                <planeGeometry args={[0.15, 0.3]} />
            </mesh>
            <mesh
                position={position}
                rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]}
                material={isPhantom ? phantomMaterial : leafMaterial}
            >
                <planeGeometry args={[0.15, 0.3]} />
            </mesh>
        </>
    );

    return (
        <group rotation={[0, rotation, 0]} position={[0, 0, 0]}>
            <mesh position={[0, 0.15, 0]} material={isPhantom ? phantomMaterial : potMaterial}>
                <cylinderGeometry args={[0.2, 0.25, 0.3, 32, 1, true]} />
            </mesh>
            <mesh position={[0, 0.3, 0]} material={isPhantom ? phantomMaterial : potMaterial}>
                <circleGeometry args={[0.2, 32]} />
            </mesh>

            <mesh position={[0, 0.5, 0]} material={isPhantom ? phantomMaterial : plantMaterial}>
                <cylinderGeometry args={[0.04, 0.05, 0.4, 12]} />
            </mesh>

            <Leaf position={[0.1, 0.75, 0]} rotation={[0, 0, Math.PI / 6]} />
            <Leaf position={[-0.1, 0.7, 0.05]} rotation={[0, Math.PI / 8, -Math.PI / 4]} />
            <Leaf position={[0.05, 0.85, -0.1]} rotation={[Math.PI / 6, 0, Math.PI / 5]} />
            <Leaf position={[-0.08, 0.9, 0]} rotation={[0, 0, -Math.PI / 8]} />

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const TallPlant = React.memo(({ color = "#3CB371", rotation = 0, isHighlighted, isPhantom }) => {
    const potMaterial = useMemo(() =>
        new MeshStandardMaterial({
            color: "#696969",
            roughness: 0.6,
            metalness: 0.2
        }), []);

    const stemMaterial = useMemo(() =>
        new MeshStandardMaterial({
            color: "#556B2F",
            roughness: 0.8,
            metalness: 0
        }), []);

    const leafMaterial = useMemo(() =>
        new MeshStandardMaterial({
            color,
            roughness: 0.7,
            metalness: 0
        }), [color]);

    const Leaf = ({ position, rotation, size }) => (
        <>
            <mesh position={position} rotation={rotation} material={isPhantom ? phantomMaterial : leafMaterial}>
                <planeGeometry args={size} />
            </mesh>
            <mesh
                position={position}
                rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]}
                material={isPhantom ? phantomMaterial : leafMaterial}
            >
                <planeGeometry args={size} />
            </mesh>
        </>
    );

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.1, 0]} material={isPhantom ? phantomMaterial : potMaterial}>
                <cylinderGeometry args={[0.2, 0.25, 0.2, 16]} />
            </mesh>

            <mesh position={[0, 0.7, 0]} material={isPhantom ? phantomMaterial : stemMaterial}>
                <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
            </mesh>

            <Leaf position={[0.2, 1.2, 0]} rotation={[0, 0, Math.PI / 4]} size={[0.1, 0.6]} />
            <Leaf position={[-0.1, 1.0, 0.1]} rotation={[0, 0, -Math.PI / 6]} size={[0.1, 0.5]} />
            <Leaf position={[0, 0.9, -0.2]} rotation={[Math.PI / 6, 0, 0]} size={[0.4, 0.1]} />

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const WallPhantom = React.memo(({ hasOpening }) => {
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
    return (
        <mesh position={[0, WALL_HEIGHT / 2, 0]} material={phantomMaterial}>
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
        </mesh>
    );
});

const Wall = React.memo(({ color, hasOpening, isHighlighted }) => {
    if (hasOpening) {
        return (
            <group>
                <mesh position={[-0.45, WALL_HEIGHT / 2, 0]} material={new MeshStandardMaterial({ color: color })}>
                    <boxGeometry args={[0.1, WALL_HEIGHT, CELL_SIZE]} />
                </mesh>
                <mesh position={[0.45, WALL_HEIGHT / 2, 0]} material={new MeshStandardMaterial({ color: color })}>
                    <boxGeometry args={[0.1, WALL_HEIGHT, CELL_SIZE]} />
                </mesh>
                <mesh position={[0, WALL_HEIGHT - 0.05 / 2, 0]} material={new MeshStandardMaterial({ color: color })}>
                    <boxGeometry args={[CELL_SIZE, 0.05, CELL_SIZE]} />
                </mesh>
                {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
            </group>
        );
    }
    return (
        <mesh position={[0, WALL_HEIGHT / 2, 0]} material={new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </mesh>
    );
});

const FloorPhantom = React.memo(() => (
    <mesh material={phantomMaterial}>
        <boxGeometry args={[1, 0.1, 1]} />
    </mesh>
));

const Tutorial = ({ show, onClose }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: 'Ласкаво просимо до RoomCraft редактор!',
            text: 'Давайте швидко освоїмо основи. Натисніть "Далі", щоб почати.'
        },
        {
            title: 'Інструменти та Кольори',
            text: `У нижній частині екрана ви бачите панель інструментів (🧱, ⬜, 🎨) та кольорів. Виберіть інструмент і колір, щоб почати будівництво.`
        },
        {
            title: 'Створення Підлоги',
            text: `Виберіть інструмент "⬜ Підлога". Клацніть **ЛІВОЮ** кнопкою миші на сітці у 3D-вікні, щоб почати перетягування плитки підлоги. Відпустіть, щоб розмістити.`
        },
        {
            title: 'Розміщення Стін',
            text: `Виберіть інструмент "🧱 Стіна". Клацніть **ЛІВОЮ** кнопкою миші на існуючій плитці підлоги, щоб почати перетягування стіни. Відпустіть, щоб розмістити.`
        },
        {
            title: 'Розміщення Меблів (Перетягування)',
            text: 'Клацніть **ЛІВОЮ** кнопкою миші на іконці предмета в інвентарі (знизу) і, не відпускаючи, перетягніть його на потрібну плитку підлоги. Відпустіть кнопку миші, щоб розмістити предмет.'
        },
        {
            title: 'Фарбування Об\'єктів (Перетягування)',
            text: `Виберіть інструмент "🎨 Фарба" та новий колір. Клацніть **ЛІВОЮ** кнопкою миші на плитці підлоги або на меблях і, не відпускаючи, перетягуйте курсор, щоб пофарбувати їх.`
        },
        {
            title: 'Видалення Об\'єктів (Правий Клік)',
            text: 'Ви можете видалити будь-який об\'єкт (підлогу, стіну, меблі), клацнувши по ньому **ПРАВОЮ** кнопкою миші.'
        },
        {
            title: 'Обертання Об\'єктів',
            text: 'Щоб **обернути** об\'єкт (фантомний під час перетягування або вже розміщений), наведіть на нього курсор і натисніть **"R"** на клавіатурі.'
        },
        {
            title: 'Прив\'язка до Стіни (Нова функція!)',
            text: 'Щоб **прив\'язати** меблі до краю блоку (до стіни), наведіть на об\'єкт і натисніть **"T"**. Об\'єкт переміститься до найближчої стіни замість центру блоку.'
        },
        {
            title: 'Зберегти Проект',
            text: 'Використовуйте кнопку "Зберегти" у нижній панелі, щоб зберегти поточний стан вашої кімнати. Це дозволить вам повернутися до нього пізніше.'
        },
        {
            title: 'Скинути Проект',
            text: 'Якщо ви хочете почати все заново, скористайтеся кнопкою "Очистити все" у нижній панелі.'
        },
        {
            title: 'Керування Камерою (Клавіатура)',
            text: 'Використовуйте клавіші **WASD** для переміщення вперед/назад/вбік. \nВикористовуйте **E** для руху вгору та **Q** для руху вниз.\nВикористовуйте **стрілки вліво/вправо** для повороту камери.\nВикористовуйте **стрілки вгору/вниз** для нахилу камери вгору/вниз.'
        },
        {
            title: 'Готово!',
            text: 'Ви освоїли основи! Насолоджуйтесь створенням свого дизайну!'
        }
    ];

    if (!show) return null;

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
            setStep(0);
            localStorage.setItem('hasSeenTutorial', 'true');
        };
    };

    const handleSkip = () => {
        onClose();
        setStep(0);
        localStorage.setItem('hasSeenTutorial', 'true');
    };

    return (
        <div style={styles.tutorialModal}>
            <div style={styles.tutorialContent}>
                <h2 style={styles.tutorialTitle}>{steps[step].title}</h2>
                <p style={styles.tutorialText}>{steps[step].text}</p>
                <div style={styles.tutorialButtonContainer}>
                    {step < steps.length - 1 ? (
                        <HoverButton
                            onClick={handleSkip}
                            style={{ ...styles.buttonBase, ...styles.tutorialSkipButton }}
                            hoverStyle={styles.tutorialSkipButtonHover}
                        >
                            Пропустити
                        </HoverButton>
                    ) : (
                        <div />
                    )}
                    <HoverButton
                        onClick={handleNext}
                        style={{
                            ...styles.buttonBase,
                            ...styles.tutorialNextButton,
                            marginLeft: step < steps.length - 1 ? 'auto' : '0',
                        }}
                        hoverStyle={styles.tutorialNextButtonHover}
                    >
                        {step < steps.length - 1 ? 'Далі' : 'Почати'}
                    </HoverButton>
                </div>
            </div>
        </div>
    );
};


export default function Edit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const roomId = useMemo(() => parseFloat(id), [id]);

    useEffect(() => {
        document.title = "RoomCraft | Редактор"
    })

    const [gridSize, setGridSize] = useState(INITIAL_GRID_SIZE);
    const [walls, setWalls] = useState({});
    const [furniture, setFurniture] = useState({});
    const [floorTiles, setFloorTiles] = useState({});
    const [selectedTool, setSelectedTool] = useState(TOOL_TYPES.floor);
    const [selectedColor, setSelectedColor] = useState(BASE_COLORS[0]);
    const [userColors, setUserColors] = useState([]);
    const [roomName, setRoomName] = useState('');

    const [hoveredCell, setHoveredCell] = useState(null);

    const [isDragging, setIsDragging] = useState(false);
    const [draggedType, setDraggedType] = useState(null);
    const [draggedSubType, setDraggedSubType] = useState(null);
    const [phantomObjectPosition, setPhantomObjectPosition] = useState(null);
    const [phantomObjectRotation, setPhantomObjectRotation] = useState(0);
    const [originalDraggedItemKey, setOriginalDraggedItemKey] = useState(null);


    const canvasRef = useRef();

    const [showTutorial, setShowTutorial] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', onConfirm: null, isConfirm: false });

    const [isMobile, setIsMobile] = useState(false);
    const mobileMovementInput = useRef({ forward: 0, backward: 0, left: 0, right: 0 });
    const cameraRotationInput = useRef({ yaw: 0, pitch: 0 });
    const cameraVerticalInput = useRef(0);

    const keyPressed = useRef({});

    const initialCameraQuaternion = useMemo(() => {
        const tempCamera = new THREE.Camera();
        tempCamera.position.set(...INITIAL_CAMERA_POSITION);
        tempCamera.lookAt(INITIAL_LOOK_AT_TARGET);
        return tempCamera.quaternion.clone();
    }, []);

    const targetCameraPosition = useRef(new Vector3(...INITIAL_CAMERA_POSITION));
    const targetCameraQuaternion = useRef(initialCameraQuaternion);

    useEffect(() => {
        if (!isWebGLSupported()) {
            setModalContent({
                title: 'Браузер/пристрій не підтримується',
                message: 'Ваш браузер або пристрій не підтримує WebGL, необхідний для роботи цього додатка. Будь ласка, спробуйте інший браузер або пристрій.',
                onConfirm: () => navigate('/'),
                isConfirm: false
            });
            setShowModal(true);
        }

        setIsMobile(isMobileDevice());

    }, [navigate]);

    const resetAllState = useCallback(() => {
        console.log('Скидання всіх станів...');
        setWalls({});
        setFurniture({});
        setFloorTiles({});
        setGridSize(INITIAL_GRID_SIZE);
        setHoveredCell(null);
        setIsDragging(false);
        setDraggedType(null);
        setDraggedSubType(null);
        setPhantomObjectPosition(null);
        setPhantomObjectRotation(0);
        setUserColors([]);
        setSelectedColor(BASE_COLORS[0]);
        setOriginalDraggedItemKey(null);

        targetCameraPosition.current.set(...INITIAL_CAMERA_POSITION);
        const tempCamera = new THREE.Camera();
        tempCamera.position.set(...INITIAL_CAMERA_POSITION);
        tempCamera.lookAt(INITIAL_LOOK_AT_TARGET);
        targetCameraQuaternion.current.copy(tempCamera.quaternion);
    }, []);

    const getKey = useCallback((x, z) => `${x},${z}`, []);

    const checkGridExpansion = useCallback((x, z) => {
        const threshold = gridSize * 0.8;
        if (Math.abs(x) > threshold || Math.abs(z) > threshold) {
            setGridSize((prev) => prev * 2);
        }
    }, [gridSize]);

    const updateNeighboringWindows = useCallback((x, z, currentFurnitureState) => {
        const updatedFurniture = { ...currentFurnitureState };
        const neighbors = [
            { dx: -1, dz: 0, side: 'left' },
            { dx: 1, dz: 0, side: 'right' },
            { dx: 0, dz: -1, side: 'front' },
            { dx: 0, dz: 1, side: 'back' },
        ];

        const currentKey = getKey(x, z);
        const currentRotation = updatedFurniture[currentKey]?.rotation || 0;

        updatedFurniture[currentKey] = {
            ...updatedFurniture[currentKey],
            neighborLeft: false,
            neighborRight: false,
            neighborFront: false,
            neighborBack: false,
        };

        neighbors.forEach(n => {
            const neighborX = x + n.dx;
            const neighborZ = z + n.dz;
            const neighborKey = getKey(neighborX, neighborZ);

            if (updatedFurniture[neighborKey] && updatedFurniture[neighborKey].type === 'window') {
                const neighborRotation = updatedFurniture[neighborKey].rotation || 0;

                if (currentRotation === 0 || currentRotation === Math.PI) {
                    if (n.dx === -1 && (neighborRotation === 0 || neighborRotation === Math.PI)) {
                        updatedFurniture[currentKey].neighborLeft = true;
                        updatedFurniture[neighborKey].neighborRight = true;
                    } else if (n.dx === 1 && (neighborRotation === 0 || neighborRotation === Math.PI)) {
                        updatedFurniture[currentKey].neighborRight = true;
                        updatedFurniture[neighborKey].neighborLeft = true;
                    }
                } else if (currentRotation === Math.PI / 2 || currentRotation === 3 * Math.PI / 2) {
                    if (n.dz === -1 && (neighborRotation === Math.PI / 2 || neighborRotation === 3 * Math.PI / 2)) {
                        updatedFurniture[currentKey].neighborFront = true;
                        updatedFurniture[neighborKey].neighborBack = true;
                    } else if (n.dz === 1 && (neighborRotation === Math.PI / 2 || neighborRotation === 3 * Math.PI / 2)) {
                        updatedFurniture[currentKey].neighborBack = true;
                        updatedFurniture[neighborKey].neighborFront = true;
                    }
                }
            }
        });

        return updatedFurniture;
    }, [getKey]);


    const rotateObject = useCallback(() => {
        if (isDragging && phantomObjectPosition && draggedType === TOOL_TYPES.furniture) {
            setPhantomObjectRotation((prev) => (prev + Math.PI / 2) % (Math.PI * 2));
        } else if (hoveredCell) {
            const key = getKey(hoveredCell.x, hoveredCell.z);
            if (furniture[key]) {
                const currentFurniture = furniture[key];
                const newRotation = ((currentFurniture.rotation || 0) + Math.PI / 2) % (Math.PI * 2);

                let furnitureDimensions = null;
                for (const category in FURNITURE_CATEGORIES) {
                    const found = FURNITURE_CATEGORIES[category].find(item => item.type === currentFurniture.type);
                    if (found) {
                        furnitureDimensions = found.dimensions;
                        break;
                    }
                }

                let newOffsetX = 0;
                let newOffsetZ = 0;
                let isSnapped = false;

                if (currentFurniture.isSnapped && furnitureDimensions) {
                    const tempItem = { ...currentFurniture, rotation: newRotation, dimensions: furnitureDimensions };
                    const snapResult = calculateWallSnapPosition(hoveredCell.x, hoveredCell.z, walls, floorTiles, getKey, tempItem);
                    if (snapResult.snapped) {
                        newOffsetX = snapResult.offsetX;
                        newOffsetZ = snapResult.offsetZ;
                        isSnapped = true;
                    }
                }

                setFurniture((prev) => {
                    let updated = {
                        ...prev,
                        [key]: { ...prev[key], rotation: newRotation, offsetX: newOffsetX, offsetZ: newOffsetZ, isSnapped: isSnapped },
                    };

                    if (currentFurniture.type === 'window') {
                        updated = updateNeighboringWindows(hoveredCell.x, hoveredCell.z, updated);
                        const neighborsToRecheck = [
                            getKey(hoveredCell.x - 1, hoveredCell.z),
                            getKey(hoveredCell.x + 1, hoveredCell.z),
                            getKey(hoveredCell.x, hoveredCell.z - 1),
                            getKey(hoveredCell.x, hoveredCell.z + 1),
                        ];
                        neighborsToRecheck.forEach(nKey => {
                            if (updated[nKey] && updated[nKey].type === 'window') {
                                updated = updateNeighboringWindows(parseInt(nKey.split(',')[0]), parseInt(nKey.split(',')[1]), updated);
                            }
                        });
                    }
                    return updated;
                });

                if (currentFurniture.type === 'door' || currentFurniture.type === 'window') {
                    setWalls((prev) => {
                        if (prev[key] && prev[key].hasOpening) {
                            return {
                                ...prev,
                                [key]: { ...prev[key], rotation: newRotation },
                            };
                        }
                        return prev;
                    });
                }
            } else if (walls[key] && !walls[key].hasOpening) {
                setWalls((prev) => ({
                    ...prev,
                    [key]: { ...prev[key], rotation: ((prev[key].rotation || 0) + Math.PI / 2) % (Math.PI * 2) },
                }));
            }
        }
    }, [furniture, walls, getKey, hoveredCell, isDragging, phantomObjectPosition, draggedType, floorTiles, updateNeighboringWindows]);

    const snapToWall = useCallback(() => {
        if (hoveredCell) {
            const key = getKey(hoveredCell.x, hoveredCell.z);
            const furnitureItem = furniture[key];

            if (furnitureItem && furnitureItem.type !== 'door' && furnitureItem.type !== 'window') {
                let furnitureDimensions = null;
                for (const category in FURNITURE_CATEGORIES) {
                    const found = FURNITURE_CATEGORIES[category].find(item => item.type === furnitureItem.type);
                    if (found) {
                        furnitureDimensions = found.dimensions;
                        break;
                    }
                }

                if (furnitureDimensions) {
                    const currentItemWithDims = { ...furnitureItem, dimensions: furnitureDimensions };
                    const snapResult = calculateWallSnapPosition(hoveredCell.x, hoveredCell.z, walls, floorTiles, getKey, currentItemWithDims);

                    if (snapResult.snapped && !furnitureItem.isSnapped) {
                        setFurniture((prev) => ({
                            ...prev,
                            [key]: {
                                ...prev[key],
                                offsetX: snapResult.offsetX,
                                offsetZ: snapResult.offsetZ,
                                isSnapped: true
                            },
                        }));
                    } else if (furnitureItem.isSnapped) {
                        setFurniture((prev) => ({
                            ...prev,
                            [key]: {
                                ...prev[key],
                                offsetX: 0,
                                offsetZ: 0,
                                isSnapped: false
                            },
                        }));
                    }
                }
            }
        }
    }, [hoveredCell, furniture, walls, floorTiles, getKey]);

    const deleteObject = useCallback((x, z) => {
        const key = getKey(x, z);
        console.log(`Спроба видалити об'єкт за адресою ${key}`);

        if (furniture[key]) {
            const removedFurnitureType = furniture[key].type;
            setFurniture((prev) => {
                const copy = { ...prev };
                delete copy[key];

                if (removedFurnitureType === 'window') {
                    const neighborsToRecheck = [
                        getKey(x - 1, z), getKey(x + 1, z),
                        getKey(x, z - 1), getKey(x, z + 1),
                    ];
                    neighborsToRecheck.forEach(nKey => {
                        if (copy[nKey] && copy[nKey].type === 'window') {
                            const tempUpdatedFurniture = { ...copy, [key]: { type: 'window', rotation: furniture[key].rotation } };
                            const rechecked = updateNeighboringWindows(parseInt(nKey.split(',')[0]), parseInt(nKey.split(',')[1]), tempUpdatedFurniture);
                            Object.assign(copy, rechecked);
                            delete copy[key];
                        }
                    });
                }
                console.log(`Меблі видалено за адресою ${key}. Новий стан меблів:`, copy);
                return copy;
            });

            if (removedFurnitureType === 'door' || removedFurnitureType === 'window') {
                setWalls((prev) => {
                    const copy = { ...prev };
                    if (copy[key] && copy[key].hasOpening) {
                        delete copy[key];
                        console.log(`Видалено пов'язану стіну з отвором за адресою ${key}. Новий стан стін:`, copy);
                    }
                    return copy;
                });
            }
        } else if (walls[key]) {
            setWalls((prev) => {
                const copy = { ...prev };
                delete copy[key];
                console.log(`Стіну видалено за адресою ${key}. Новий стан стін:`, copy);
                return copy;
            });
        } else if (floorTiles[key]) {
            setFloorTiles((prev) => {
                const copy = { ...prev };
                delete copy[key];
                console.log(`Плитку підлоги видалено за адресою ${key}. Новий стан підлоги:`, copy);
                return copy;
            });
        }
    }, [furniture, walls, floorTiles, getKey, updateNeighboringWindows]);

    const handleRightClick = useCallback((e, x, z) => {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
        deleteObject(x, z);
    }, [deleteObject]);

    function CanvasContent({
                               getKey,
                               rotateObject,
                               snapToWall,
                               deleteObject,
                               checkGridExpansion,
                               selectedTool,
                               selectedColor,
                               furniture,
                               walls,
                               floorTiles,
                               hoveredCell,
                               setHoveredCell,
                               setFloorTiles,
                               setWalls,
                               setFurniture,
                               isDragging,
                               draggedType,
                               draggedSubType,
                               phantomObjectPosition,
                               setPhantomObjectPosition,
                               phantomObjectRotation,
                               setPhantomObjectRotation,
                               setIsDragging,
                               setDraggedType,
                               setDraggedSubType,
                               handleRightClick,
                               keyPressed,
                               targetCameraPosition,
                               targetCameraQuaternion,
                               mobileMovementInput,
                               cameraRotationInput,
                               cameraVerticalInput,
                               updateNeighboringWindows,
                               setOriginalDraggedItemKey,
                               originalDraggedItemKey
                           }) {
        const { gl, camera } = useThree();
        const PI_2 = Math.PI / 2;

        useEffect(() => {
            camera.position.copy(targetCameraPosition.current);
            camera.quaternion.copy(targetCameraQuaternion.current);
        }, [camera]);

        useEffect(() => {
            const handleKeyDown = (e) => {
                const key = e.key.toLowerCase();
                keyPressed.current[key] = true;
                if (key === 'r') {
                    rotateObject();
                    e.preventDefault();
                } else if (key === 't') {
                    snapToWall();
                    e.preventDefault();
                }
            };
            const handleKeyUp = (e) => {
                const key = e.key.toLowerCase();
                keyPressed.current[key] = false;
            };

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }, [rotateObject, snapToWall, keyPressed]);

        useFrame((_, delta) => {
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

            if (keyPressed.current['w']) {
                newCameraPosition.addScaledVector(forward, moveAmount);
            }
            if (keyPressed.current['s']) {
                newCameraPosition.addScaledVector(forward, -moveAmount);
            }
            if (keyPressed.current['a']) {
                newCameraPosition.addScaledVector(right, -moveAmount);
            }
            if (keyPressed.current['d']) {
                newCameraPosition.addScaledVector(right, moveAmount);
            }

            if (keyPressed.current['e']) {
                newCameraPosition.y += verticalMoveAmount;
            }
            if (keyPressed.current['q']) {
                newCameraPosition.y -= verticalMoveAmount;
            }

            if (mobileMovementInput.current.forward) {
                newCameraPosition.addScaledVector(forward, moveAmount);
            }
            if (mobileMovementInput.current.backward) {
                newCameraPosition.addScaledVector(forward, -moveAmount);
            }
            if (mobileMovementInput.current.left) {
                newCameraPosition.addScaledVector(right, -moveAmount);
            }
            if (mobileMovementInput.current.right) {
                newCameraPosition.addScaledVector(right, moveAmount);
            }

            newCameraPosition.y += cameraVerticalInput.current * verticalMoveAmount;


            targetCameraPosition.current.copy(newCameraPosition);
            camera.position.lerp(targetCameraPosition.current, LERP_FACTOR);

            let currentEuler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');

            if (keyPressed.current['arrowleft']) {
                currentEuler.y += rotateAmountYaw;
            }
            if (keyPressed.current['arrowright']) {
                currentEuler.y -= rotateAmountYaw;
            }
            if (keyPressed.current['arrowdown']) {
                currentEuler.x = Math.max(-PI_2 + 0.01, currentEuler.x - rotateAmountPitch);
            }
            if (keyPressed.current['arrowup']) {
                currentEuler.x = Math.min(PI_2 - 0.01, currentEuler.x + rotateAmountPitch);
            }

            currentEuler.y += cameraRotationInput.current.yaw * rotateAmountYaw;
            currentEuler.x = Math.max(-PI_2 + 0.01, Math.min(PI_2 - 0.01, currentEuler.x + cameraRotationInput.current.pitch * rotateAmountPitch));


            currentEuler.z = 0;

            targetCameraQuaternion.current.setFromEuler(currentEuler);
            camera.quaternion.slerp(targetCameraQuaternion.current, LERP_FACTOR);
        });

        const getIntersectionPoint = useCallback((event) => {
            const raycaster = new Raycaster();
            const mouse = new THREE.Vector2();

            const rect = gl.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_LEVEL);
            const intersectionPoint = new Vector3();
            raycaster.ray.intersectPlane(plane, intersectionPoint);
            return intersectionPoint;
        }, [gl, camera]);

        const handlePointerDown = useCallback((e) => {
            const domEvent = e.nativeEvent || e;
            if (domEvent.button === 2) {
                domEvent.preventDefault();
                return;
            }

            if (isDragging) {
                return;
            }

            const intersectionPoint = getIntersectionPoint(domEvent);
            if (!intersectionPoint) return;

            const clickedX = Math.round(intersectionPoint.x);
            const clickedZ = Math.round(intersectionPoint.z);
            const clickedKey = getKey(clickedX, clickedZ);

            if (selectedTool === TOOL_TYPES.floor || selectedTool === TOOL_TYPES.wall || selectedTool === TOOL_TYPES.paint) {
                setIsDragging(true);
                setDraggedType(selectedTool);
                setDraggedSubType(null);
                setPhantomObjectRotation(0);
                setOriginalDraggedItemKey(null);

                if (selectedTool === TOOL_TYPES.paint && hoveredCell) {
                    const key = getKey(hoveredCell.x, hoveredCell.z);
                    const targetFurniture = furniture[key];

                    if (targetFurniture) {
                        if (targetFurniture.color !== selectedColor) {
                            setFurniture((prev) => ({ ...prev, [key]: { ...prev[key], color: selectedColor } }));
                        }
                    } else if (floorTiles[key]) {
                        if (floorTiles[key] !== selectedColor) {
                            setFloorTiles((prev) => ({ ...prev, [key]: selectedColor }));
                        }
                    }
                }
                domEvent.stopPropagation();
                return;
            } else if (furniture[clickedKey] && (furniture[clickedKey].type !== 'door' && furniture[clickedKey].type !== 'window')) {
                const itemToDrag = furniture[clickedKey];
                setIsDragging(true);
                setDraggedType(TOOL_TYPES.furniture);
                setDraggedSubType(itemToDrag.type);
                setPhantomObjectRotation(itemToDrag.rotation || 0);
                setPhantomObjectPosition({ x: clickedX, z: clickedZ });
                setOriginalDraggedItemKey(clickedKey);

                setFurniture((prev) => {
                    const newFurniture = { ...prev };
                    delete newFurniture[clickedKey];
                    return newFurniture;
                });
                domEvent.stopPropagation();
                return;
            }
        }, [isDragging, selectedTool, setIsDragging, setDraggedType, setDraggedSubType, setPhantomObjectRotation, hoveredCell, floorTiles, furniture, selectedColor, getKey, setFloorTiles, setFurniture, getIntersectionPoint, setOriginalDraggedItemKey]);

        const handlePointerMove = useCallback((e) => {
            const domEvent = e.nativeEvent || e;
            const intersectionPoint = getIntersectionPoint(domEvent);

            if (intersectionPoint) {
                const newHoveredCell = { x: Math.round(intersectionPoint.x), z: Math.round(intersectionPoint.z) };
                if (!hoveredCell || newHoveredCell.x !== hoveredCell.x || newHoveredCell.z !== hoveredCell.z) {
                    setHoveredCell(newHoveredCell);
                }

                if (isDragging && draggedType) {
                    const snappedX = Math.round(intersectionPoint.x);
                    const snappedZ = Math.round(intersectionPoint.z);
                    if (!phantomObjectPosition || snappedX !== phantomObjectPosition.x || snappedZ !== phantomObjectPosition.z) {
                        setPhantomObjectPosition({ x: snappedX, z: snappedZ });
                    }

                    if (draggedType === TOOL_TYPES.paint) {
                        const key = getKey(newHoveredCell.x, newHoveredCell.z);
                        const targetFurniture = furniture[key];

                        if (targetFurniture) {
                            if (targetFurniture.color !== selectedColor) {
                                setFurniture((prev) => ({ ...prev, [key]: { ...prev[key], color: selectedColor } }));
                            }
                        } else if (floorTiles[key]) {
                            if (floorTiles[key] !== selectedColor) {
                                setFloorTiles((prev) => ({ ...prev, [key]: selectedColor }));
                            }
                        }
                    }
                }
            } else {
                if (hoveredCell) {
                    setHoveredCell(null);
                }
                if (isDragging && draggedType && phantomObjectPosition) {
                    setPhantomObjectPosition(null);
                }
            }
            domEvent.stopPropagation();
        }, [isDragging, draggedType, hoveredCell, phantomObjectPosition, floorTiles, furniture, selectedColor, getKey, setFloorTiles, setFurniture, getIntersectionPoint]);

        useEffect(() => {
            const handleGlobalPointerUp = (e) => {
                if (e.button === 0 && isDragging && draggedType && phantomObjectPosition) {
                    const finalX = Math.round(phantomObjectPosition.x);
                    const finalZ = Math.round(phantomObjectPosition.z);
                    const key = getKey(finalX, finalZ);

                    const isPlacementValid = floorTiles[key] &&
                        (!furniture[key] || (furniture[key].type === 'door' || furniture[key].type === 'window'));

                    if (draggedType === TOOL_TYPES.floor) {
                        setFloorTiles((prev) => ({ ...prev, [key]: selectedColor }));

                        setWalls((prev) => { const copy = { ...prev }; delete copy[key]; return copy; });
                        setFurniture((prev) => {
                            const copy = { ...prev };
                            if (copy[key] && (copy[key].type === 'door' || copy[key].type === 'window')) {
                            } else {
                                delete copy[key];
                            }
                            return copy;
                        });
                        checkGridExpansion(finalX, finalZ);
                    } else if (draggedType === TOOL_TYPES.wall) {
                        if (floorTiles[key]) {
                            if (!furniture[key] || (furniture[key].type !== 'door' && furniture[key].type !== 'window')) {
                                setWalls((prev) => ({ ...prev, [key]: { color: selectedColor, hasOpening: false, rotation: phantomObjectRotation } }));
                                checkGridExpansion(finalX, finalZ);
                            }
                        }
                    } else if (draggedType === TOOL_TYPES.furniture) {
                        if (isPlacementValid) {
                            let phantomDimensions = null;
                            for (const category in FURNITURE_CATEGORIES) {
                                const found = FURNITURE_CATEGORIES[category].find(item => item.type === draggedSubType);
                                if (found) {
                                    phantomDimensions = found.dimensions;
                                    break;
                                }
                            }

                            const newFurniture = {
                                type: draggedSubType,
                                color: selectedColor,
                                rotation: phantomObjectRotation,
                                offsetX: 0,
                                offsetZ: 0,
                                isSnapped: false,
                                dimensions: phantomDimensions,
                                neighborLeft: false,
                                neighborRight: false,
                                neighborFront: false,
                                neighborBack: false,
                            };

                            setFurniture((prev) => {
                                let updated = { ...prev, [key]: newFurniture };
                                if (draggedSubType === 'window') {
                                    updated = updateNeighboringWindows(finalX, finalZ, updated);
                                    const neighborsToRecheck = [
                                        getKey(finalX - 1, finalZ), getKey(finalX + 1, finalZ),
                                        getKey(finalX, finalZ - 1), getKey(finalX, finalZ + 1),
                                    ];
                                    neighborsToRecheck.forEach(nKey => {
                                        if (updated[nKey] && updated[nKey].type === 'window') {
                                            updated = updateNeighboringWindows(parseInt(nKey.split(',')[0]), parseInt(nKey.split(',')[1]), updated);
                                        }
                                    });
                                }
                                return updated;
                            });

                            if (draggedSubType === 'door' || draggedSubType === 'window') {
                                setWalls((prev) => ({ ...prev, [key]: { color: selectedColor, hasOpening: true, rotation: phantomObjectRotation } }));
                            } else {
                                setWalls((prev) => {
                                    const copy = { ...prev };
                                    if (copy[key] && !copy[key].hasOpening) {
                                        delete copy[key];
                                    }
                                    return copy;
                                });
                            }
                            checkGridExpansion(finalX, finalZ);
                        } else {
                            if (originalDraggedItemKey && furniture[originalDraggedItemKey] === undefined) {
                                setFurniture((prev) => ({ ...prev, [originalDraggedItemKey]: {
                                        type: draggedSubType,
                                        color: selectedColor,
                                        rotation: phantomObjectRotation,
                                        offsetX: 0,
                                        offsetZ: 0,
                                        isSnapped: false,
                                        dimensions: FURNITURE_CATEGORIES[Object.keys(FURNITURE_CATEGORIES).find(cat => FURNITURE_CATEGORIES[cat].some(item => item.type === draggedSubType))].find(item => item.type === draggedSubType).dimensions,
                                        neighborLeft: false,
                                        neighborRight: false,
                                        neighborFront: false,
                                        neighborBack: false,
                                    }}));
                            }
                            console.warn(`Неможливо розмістити меблі за адресою ${key}.`);
                        }
                    }
                } else if (originalDraggedItemKey && furniture[originalDraggedItemKey] === undefined) {
                    setFurniture((prev) => ({ ...prev, [originalDraggedItemKey]: {
                            type: draggedSubType,
                            color: selectedColor,
                            rotation: phantomObjectRotation,
                            offsetX: 0,
                            offsetZ: 0,
                            isSnapped: false,
                            dimensions: FURNITURE_CATEGORIES[Object.keys(FURNITURE_CATEGORIES).find(cat => FURNITURE_CATEGORIES[cat].some(item => item.type === draggedSubType))].find(item => item.type === draggedSubType).dimensions,
                            neighborLeft: false,
                            neighborRight: false,
                            neighborFront: false,
                            neighborBack: false,
                        }}));
                }


                setIsDragging(false);
                setDraggedType(null);
                setDraggedSubType(null);
                setPhantomObjectPosition(null);
                setPhantomObjectRotation(0);
                setOriginalDraggedItemKey(null);
            };

            const currentCanvas = gl.domElement;
            if (currentCanvas) {
                currentCanvas.addEventListener('pointerup', handleGlobalPointerUp);
            }
            return () => {
                if (currentCanvas) {
                    currentCanvas.removeEventListener('pointerup', handleGlobalPointerUp);
                }
            };
        }, [isDragging, draggedType, draggedSubType, phantomObjectPosition, getKey, floorTiles, furniture, walls, setFurniture, setWalls, setFloorTiles, selectedColor, phantomObjectRotation, setIsDragging, setDraggedType, setDraggedSubType, setPhantomObjectPosition, setPhantomObjectRotation, checkGridExpansion, gl, updateNeighboringWindows, originalDraggedItemKey]);

        const renderComponent = useCallback((data, isPhantom = false, isPlacementValid = true) => {
            const { type: itemType, color, rotation = 0, neighborLeft, neighborRight, neighborFront, neighborBack } = data;
            const isHighlighted = !isPhantom && hoveredCell &&
                Math.round(data.position.x) === hoveredCell.x &&
                Math.round(data.position.z) === hoveredCell.z;

            const currentPhantomMaterial = isPhantom && !isPlacementValid ? invalidPhantomMaterial : phantomMaterial;

            switch (itemType) {
                case 'sofa': return <Sofa color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'chair': return <Chair color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'table': return <Table color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'coffeeTable': return <CoffeeTable color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'bookshelf': return <Bookshelf color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'armchair': return <Armchair color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'fireplace': return <Fireplace color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'door': return <Door color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'window': return <Window color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} neighborLeft={neighborLeft} neighborRight={neighborRight} neighborFront={neighborFront} neighborBack={neighborBack} phantomMaterial={currentPhantomMaterial} />;
                case 'kitchenTable': return <KitchenTable color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'kitchenCabinet': return <KitchenCabinet color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'outdoorChair': return <OutdoorChair color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'outdoorTable': return <OutdoorTable color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'grill': return <Grill color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'gardenBench': return <GardenBench color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'bed': return <Bed color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'lamp': return <Lamp color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'cabinet': return <Cabinet color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'dresser': return <Dresser color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'nightstand': return <Nightstand color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'wardrobe': return <Wardrobe color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'tv': return <TV color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'console': return <Console color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'computerSetup': return <ComputerSetup color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'ceilingLamp': return <CeilingLamp color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'spotlight': return <Spotlight color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'rgbStrip': return <RgbStrip color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'pottedPlant': return <PottedPlant color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'tallPlant': return <TallPlant color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'toilet': return <Toilet color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'sink': return <Sink color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'bathtub': return <Bathtub color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'shower': return <Shower color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'desk': return <Desk color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'officeChair': return <OfficeChair color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'filingCabinet': return <FilingCabinet color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'diningTable': return <DiningTable color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case 'diningChair': return <DiningChair color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} phantomMaterial={currentPhantomMaterial} />;
                case TOOL_TYPES.floor: return <FloorPhantom phantomMaterial={currentPhantomMaterial} />;
                case TOOL_TYPES.wall:
                    const potentialOpening = hoveredCell && furniture[getKey(hoveredCell.x, hoveredCell.z)] &&
                        (furniture[getKey(hoveredCell.x, hoveredCell.z)].type === 'door' ||
                            furniture[getKey(hoveredCell.x, hoveredCell.z)].type === 'window');
                    return <WallPhantom hasOpening={potentialOpening} phantomMaterial={currentPhantomMaterial} />;
                default: return null;
            }
        }, [hoveredCell, furniture, getKey]);

        const gridHelper = useMemo(() => {
            return new GridHelper(gridSize * 2, gridSize * 2, '#4B5563', '#4B5563');
        }, [gridSize]);

        const renderGridObjects = useCallback(() => {
            const items = [];
            for (let z = -gridSize; z <= gridSize; z++) {
                for (let x = -gridSize; x <= gridSize; x++) {
                    const key = getKey(x, z);
                    const floorData = floorTiles[key];
                    const wallData = walls[key];
                    const furnitureData = furniture[key];

                    if (floorData) {
                        items.push(
                            <mesh
                                key={`floor-${x}-${z}`}
                                position={[x, FLOOR_LEVEL, z]}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onContextMenu={(e) => handleRightClick(e, x, z)}
                                castShadow
                                receiveShadow
                            >
                                <boxGeometry args={[1, 0.1, 1]} />
                                <meshStandardMaterial color={floorData} />
                            </mesh>
                        );
                    }

                    if (wallData) {
                        items.push(
                            <group
                                key={`wall-${x}-${z}`}
                                position={[x, FLOOR_LEVEL, z]}
                                rotation={[0, wallData.rotation || 0, 0]}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onContextMenu={(e) => handleRightClick(e, x, z)}
                            >
                                <Wall
                                    color={wallData.color}
                                    hasOpening={wallData.hasOpening}
                                    isHighlighted={hoveredCell && hoveredCell.x === x && hoveredCell.z === z}
                                />
                            </group>
                        );
                    }

                    if (furnitureData) {
                        if (originalDraggedItemKey !== key) {
                            const positionX = x + (furnitureData.offsetX || 0);
                            const positionZ = z + (furnitureData.offsetZ || 0);

                            items.push(
                                <group
                                    key={`furniture-${x}-${z}`}
                                    position={[positionX, FLOOR_LEVEL, positionZ]}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onContextMenu={(e) => handleRightClick(e, x, z)}
                                >
                                    {renderComponent({ ...furnitureData, position: { x: positionX, z: positionZ } })}
                                </group>
                            );
                        }
                    }
                }
            }
            return items;
        }, [
            gridSize, getKey, floorTiles, walls, furniture, renderComponent, hoveredCell, handlePointerDown, handlePointerMove, handleRightClick, originalDraggedItemKey
        ]);

        const isPhantomPlacementValid = useMemo(() => {
            if (!phantomObjectPosition) return false;
            const key = getKey(phantomObjectPosition.x, phantomObjectPosition.z);
            return floorTiles[key] &&
                (!furniture[key] || (furniture[key].type === 'door' || furniture[key].type === 'window'));
        }, [phantomObjectPosition, floorTiles, furniture, getKey]);


        return (
            <>
                <ambientLight intensity={0.5} />
                <directionalLight position={[20, 30, 20]} intensity={1} castShadow />

                <primitive object={gridHelper} position={[0, FLOOR_LEVEL + 0.01, 0]} />

                {hoveredCell && !isDragging && (
                    <mesh position={[hoveredCell.x, FLOOR_LEVEL + 0.02, hoveredCell.z]} material={hoverMaterial} castShadow receiveShadow>
                        <boxGeometry args={[1, 0.01, 1]} />
                    </mesh>
                )}
                {isDragging && draggedType && phantomObjectPosition && draggedType !== TOOL_TYPES.paint && (
                    <group position={[phantomObjectPosition.x, FLOOR_LEVEL, phantomObjectPosition.z]}>
                        {renderComponent({ type: draggedType === TOOL_TYPES.furniture ? draggedSubType : draggedType, color: selectedColor, rotation: phantomObjectRotation }, true, isPhantomPlacementValid)}
                    </group>
                )}

                <mesh
                    position={[0, FLOOR_LEVEL, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    onPointerMove={handlePointerMove}
                    onPointerDown={handlePointerDown}
                    onContextMenu={(e) => {
                        e.nativeEvent.preventDefault();
                        if (hoveredCell) {
                            handleRightClick(e, hoveredCell.x, hoveredCell.z);
                        }
                    }}
                    visible={true}
                >
                    <planeGeometry args={[gridSize * 2 + 1, gridSize * 2 + 1]} />
                    <meshStandardMaterial transparent opacity={0.0} />
                </mesh>

                {renderGridObjects()}
            </>
        );
    }

    const handleFurnitureDragStart = useCallback((type) => {
        setSelectedTool(TOOL_TYPES.furniture);
        setIsDragging(true);
        setDraggedType(TOOL_TYPES.furniture);
        setDraggedSubType(type);
        setPhantomObjectRotation(type === 'painting' ? Math.PI : 0);
        setOriginalDraggedItemKey(null);
    }, []);

    const handleToolToggle = useCallback((toolLabel) => {
        if (selectedTool === toolLabel) {
            setSelectedTool(null);
        } else {
            setSelectedTool(toolLabel);
        }
        setIsDragging(false);
        setDraggedType(null);
        setDraggedSubType(null);
        setPhantomObjectPosition(null);
        setPhantomObjectRotation(0);
        setOriginalDraggedItemKey(null);
    }, [selectedTool]);

    const handleColorInput = useCallback((e) => {
        setSelectedColor(e.target.value);
    }, []);

    const handleColorMouseUp = useCallback(() => {
        if (![...BASE_COLORS, ...userColors].includes(selectedColor)) {
            setUserColors((prev) => [...prev, selectedColor]);
        }
    }, [selectedColor, userColors]);

    const saveRoomState = useCallback(() => {
        if (isNaN(roomId)) {
            console.error("Помилка збереження: Недійсний ID кімнати. Неможливо зберегти.");
            setModalContent({
                title: 'Помилка збереження',
                message: 'Недійсний ідентифікатор кімнати. Збереження неможливе.',
                onConfirm: () => setShowModal(false),
                isConfirm: false
            });
            setShowModal(true);
            return;
        }

        try {
            const userJson = localStorage.getItem('user');
            let currentUser = null;

            if (userJson) {
                try {
                    currentUser = JSON.parse(userJson);
                } catch (e) {
                    console.error("Помилка парсингу користувача з localStorage під час збереження, скидаємо дані користувача:", e);
                    currentUser = null;
                }
            }

            if (!currentUser || !Array.isArray(currentUser.rooms)) {
                console.error("Недійсні або відсутні дані користувача в localStorage. Збереження неможливе.");
                setModalContent({
                    title: 'Помилка збереження',
                    message: 'Немає даних користувача для збереження кімнати. Увійдіть або зареєструйтесь.',
                    onConfirm: () => setShowModal(false),
                    isConfirm: false
                });
                setShowModal(true);
                return;
            }

            const roomIndex = currentUser.rooms.findIndex(room => room.id === roomId);

            if (roomIndex !== -1) {
                currentUser.rooms[roomIndex] = {
                    ...currentUser.rooms[roomIndex],
                    name: roomName,
                    gridSize,
                    walls,
                    furniture,
                    floorTiles,
                    userColors,
                    selectedColor,
                    cameraPosition: targetCameraPosition.current.toArray(),
                    cameraQuaternion: targetCameraQuaternion.current.toArray(),
                };
                localStorage.setItem('user', JSON.stringify(currentUser));
                console.log('Стан кімнати успішно збережено для ID:', roomId, currentUser.rooms[roomIndex]);
                setModalContent({
                    title: 'Збережено',
                    message: `Стан кімнати "${roomName}" успішно збережено!`,
                    onConfirm: () => { setShowModal(false); navigate('/'); },
                    isConfirm: false
                });
                setShowModal(true);
            } else {
                console.warn(`Кімнату з ID ${roomId} не знайдено у списку кімнат користувача. Збереження не відбулося.`);
                setModalContent({
                    title: 'Помилка збереження',
                    message: 'Кімнату з таким ID не знайдено для оновлення. Переконайтеся, що вона існує.',
                    onConfirm: () => setShowModal(false),
                    isConfirm: false
                });
                setShowModal(true);
            }
        } catch (error) {
            console.error("Помилка збереження стану кімнати:", error);
            setModalContent({
                title: 'Помилка збереження',
                message: 'Помилка під час збереження стану кімнати. Перевірте консоль для деталей.',
                onConfirm: () => setShowModal(false),
                isConfirm: false
            });
            setShowModal(true);
        }
    }, [roomId, gridSize, walls, furniture, floorTiles, userColors, selectedColor, targetCameraPosition, targetCameraQuaternion, navigate, roomName]);

    useEffect(() => {
        const loadRoomState = () => {
            if (isNaN(roomId)) {
                console.error("Помилка завантаження: Недійсний ID кімнати. Перенаправлення на головну сторінку.");
                setModalContent({
                    title: 'Помилка завантаження',
                    message: 'Недійсний ідентифікатор кімнати. Перенаправлення на головну сторінку.',
                    onConfirm: () => navigate('/'),
                    isConfirm: false
                });
                setShowModal(true);
                return;
            }

            try {
                const userJson = localStorage.getItem('user');
                let currentUser = null;

                if (userJson) {
                    try {
                        currentUser = JSON.parse(userJson);
                    } catch (e) {
                        console.error("Помилка парсингу користувача з localStorage під час завантаження, скидаємо дані користувача:", e);
                        currentUser = null;
                    }
                }

                if (!currentUser || !Array.isArray(currentUser.rooms)) {
                    console.warn("Недійсні або відсутні дані користувача в localStorage. Скидання стану.");
                    resetAllState();
                    return;
                }

                const roomToLoad = currentUser.rooms.find(room => room.id === roomId);

                if (roomToLoad) {
                    console.log('Завантаження стану кімнати для ID:', roomId, roomToLoad);
                    setRoomName(roomToLoad.name || `Кімната ${roomId}`);
                    setGridSize(roomToLoad.gridSize || INITIAL_GRID_SIZE);
                    setWalls(roomToLoad.walls || {});
                    setFurniture(roomToLoad.furniture || {});
                    setFloorTiles(roomToLoad.floorTiles || {});
                    setUserColors(roomToLoad.userColors || []);
                    setSelectedColor(roomToLoad.selectedColor || BASE_COLORS[0]);
                    if (roomToLoad.cameraPosition && roomToLoad.cameraQuaternion) {
                        targetCameraPosition.current.set(...roomToLoad.cameraPosition);
                        targetCameraQuaternion.current.set(...roomToLoad.cameraQuaternion);
                    } else {
                        targetCameraPosition.current.set(...INITIAL_CAMERA_POSITION);
                        const tempCamera = new THREE.Camera();
                        tempCamera.position.set(...INITIAL_CAMERA_POSITION);
                        tempCamera.lookAt(INITIAL_LOOK_AT_TARGET);
                        targetCameraQuaternion.current.copy(tempCamera.quaternion);
                    }
                } else {
                    console.warn(`Кімнату з ID ${roomId} не знайдено у списку кімнат користувача. Ініціалізація нового стану кімнати.`);
                    setModalContent({
                        title: 'Кімнату не знайдено',
                        message: 'Кімнату не знайдено. Був ініційований новий проект.',
                        onConfirm: () => setShowModal(false),
                        isConfirm: false
                    });
                    setShowModal(true);
                    resetAllState();
                }
            } catch (error) {
                console.error("Помилка завантаження стану кімнати:", error);
                setModalContent({
                    title: 'Помилка завантаження',
                    message: 'Помилка під час завантаження стану кімнати. Перевірте консоль для деталей.',
                    onConfirm: () => setShowModal(false),
                    isConfirm: false
                });
                setShowModal(true);
                resetAllState();
            }
        };

        loadRoomState();

        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            setShowTutorial(true);
        }
    }, [roomId, navigate, id, resetAllState]);

    const deleteRoom = useCallback(() => {
        setModalContent({
            title: 'Видалити кімнату',
            message: `Ви впевнені, що хочете видалити кімнату "${roomName}"? Цю дію не можна скасувати.`,
            onConfirm: () => {
                try {
                    const userJson = localStorage.getItem('user');
                    let currentUser = null;

                    if (userJson) {
                        try {
                            currentUser = JSON.parse(userJson);
                        } catch (e) {
                            console.error("Помилка парсингу користувача з localStorage під час видалення кімнати:", e);
                            setModalContent({
                                title: 'Помилка',
                                message: 'Дані користувача пошкоджені. Видалення неможливе.',
                                onConfirm: () => setShowModal(false),
                                isConfirm: false
                            });
                            setShowModal(true);
                            return;
                        }
                    }

                    if (!currentUser || !Array.isArray(currentUser.rooms)) {
                        console.error("Недійсні або відсутні дані користувача в localStorage. Видалення неможливе.");
                        setModalContent({
                            title: 'Помилка',
                            message: 'Немає даних користувача. Видалення неможливе.',
                            onConfirm: () => setShowModal(false),
                            isConfirm: false
                        });
                        setShowModal(true);
                        return;
                    }

                    const initialRoomCount = currentUser.rooms.length;
                    const updatedRooms = currentUser.rooms.filter(room => room.id !== roomId);

                    if (updatedRooms.length < initialRoomCount) {
                        currentUser.rooms = updatedRooms;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        setModalContent({
                            title: 'Кімнату видалено',
                            message: `Кімнату "${roomName}" успішно видалено.`,
                            onConfirm: () => { setShowModal(false); navigate('/'); },
                            isConfirm: false
                        });
                        setShowModal(true);
                        console.log(`Кімнату з ID ${roomId} успішно видалено.`);
                    } else {
                        setModalContent({
                            title: 'Помилка видалення',
                            message: 'Кімнату з таким ID не знайдено.',
                            onConfirm: () => setShowModal(false),
                            isConfirm: false
                        });
                        setShowModal(true);
                        console.warn(`Кімнату з ID ${roomId} не знайдено для видалення.`);
                    }
                } catch (error) {
                    console.error("Помилка видалення кімнати:", error);
                    setModalContent({
                        title: 'Помилка видалення',
                        message: 'Помилка під час видалення кімнати. Перевірте консоль для деталей.',
                        onConfirm: () => setShowModal(false),
                        isConfirm: false
                    });
                    setShowModal(true);
                }
            },
            isConfirm: true
        });
        setShowModal(true);
    }, [roomId, roomName, navigate]);


    return (
        <div id="root" style={{ ...styles.root, display: 'flex', flexDirection: 'column', height: '100vh', background: '#1F2937' }}>
            <div ref={canvasRef} style={{ flex: 1, position: 'relative' }}>
                <Canvas
                    shadows
                    camera={{ position: INITIAL_CAMERA_POSITION, fov: 60 }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <CanvasContent
                        getKey={getKey}
                        rotateObject={rotateObject}
                        snapToWall={snapToWall}
                        deleteObject={deleteObject}
                        checkGridExpansion={checkGridExpansion}
                        selectedTool={selectedTool}
                        selectedColor={selectedColor}
                        furniture={furniture}
                        walls={walls}
                        floorTiles={floorTiles}
                        hoveredCell={hoveredCell}
                        setHoveredCell={setHoveredCell}
                        canvasRef={canvasRef}
                        setFloorTiles={setFloorTiles}
                        setWalls={setWalls}
                        setFurniture={setFurniture}
                        isDragging={isDragging}
                        draggedType={draggedType}
                        draggedSubType={draggedSubType}
                        phantomObjectPosition={phantomObjectPosition}
                        setPhantomObjectPosition={setPhantomObjectPosition}
                        phantomObjectRotation={phantomObjectRotation}
                        setPhantomObjectRotation={setPhantomObjectRotation}
                        setIsDragging={setIsDragging}
                        setDraggedType={setDraggedType}
                        setDraggedSubType={setDraggedSubType}
                        handleRightClick={handleRightClick}
                        keyPressed={keyPressed}
                        targetCameraPosition={targetCameraPosition}
                        targetCameraQuaternion={targetCameraQuaternion}
                        mobileMovementInput={mobileMovementInput}
                        cameraRotationInput={cameraRotationInput}
                        cameraVerticalInput={cameraVerticalInput}
                        updateNeighboringWindows={updateNeighboringWindows}
                        setOriginalDraggedItemKey={setOriginalDraggedItemKey}
                        originalDraggedItemKey={originalDraggedItemKey}
                    />
                </Canvas>
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                }}>
                    <HoverButton
                        onClick={() => setShowTutorial(true)}
                        style={{ ...styles.buttonBase, ...styles.tutorialButton, padding: '10px 20px', fontSize: '1em' }}
                        hoverStyle={styles.tutorialButtonHover}
                    >
                        Показати туторіал
                    </HoverButton>
                </div>

                {isMobile && (
                    <>
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 40px)',
                            gridTemplateRows: 'repeat(3, 40px)',
                            gap: '5px',
                            zIndex: 1000,
                        }}>
                            <button
                                onTouchStart={() => mobileMovementInput.current.forward = 1}
                                onTouchEnd={() => mobileMovementInput.current.forward = 0}
                                style={{
                                    gridColumn: '2 / 3',
                                    gridRow: '1 / 2',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                ↑
                            </button>
                            <button
                                onTouchStart={() => mobileMovementInput.current.left = 1}
                                onTouchEnd={() => mobileMovementInput.current.left = 0}
                                style={{
                                    gridColumn: '1 / 2',
                                    gridRow: '2 / 3',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                ←
                            </button>
                            <button
                                onTouchStart={() => mobileMovementInput.current.right = 1}
                                onTouchEnd={() => mobileMovementInput.current.right = 0}
                                style={{
                                    gridColumn: '3 / 4',
                                    gridRow: '2 / 3',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                →
                            </button>
                            <button
                                onTouchStart={() => mobileMovementInput.current.backward = 1}
                                onTouchEnd={() => mobileMovementInput.current.backward = 0}
                                style={{
                                    gridColumn: '2 / 3',
                                    gridRow: '3 / 4',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                ↓
                            </button>
                        </div>

                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            right: '20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 40px)',
                            gridTemplateRows: 'repeat(3, 40px)',
                            gap: '5px',
                            zIndex: 1000,
                        }}>
                            <button
                                onTouchStart={() => cameraRotationInput.current.pitch = 1}
                                onTouchEnd={() => cameraRotationInput.current.pitch = 0}
                                style={{
                                    gridColumn: '2 / 3',
                                    gridRow: '1 / 2',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                ▲
                            </button>
                            <button
                                onTouchStart={() => cameraRotationInput.current.yaw = 1}
                                onTouchEnd={() => cameraRotationInput.current.yaw = 0}
                                style={{
                                    gridColumn: '1 / 2',
                                    gridRow: '2 / 3',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                ◀
                            </button>
                            <button
                                onTouchStart={() => cameraRotationInput.current.yaw = -1}
                                onTouchEnd={() => cameraRotationInput.current.yaw = 0}
                                style={{
                                    gridColumn: '3 / 4',
                                    gridRow: '2 / 3',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                ▶
                            </button>
                            <button
                                onTouchStart={() => cameraRotationInput.current.pitch = -1}
                                onTouchEnd={() => cameraRotationInput.current.pitch = 0}
                                style={{
                                    gridColumn: '2 / 3',
                                    gridRow: '3 / 4',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                ▼
                            </button>
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: '150px',
                            right: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            zIndex: 1000,
                        }}>
                            <button
                                onTouchStart={() => cameraVerticalInput.current = 1}
                                onTouchEnd={() => cameraVerticalInput.current = 0}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                Вгору
                            </button>
                            <button
                                onTouchStart={() => cameraVerticalInput.current = -1}
                                onTouchEnd={() => cameraVerticalInput.current = 0}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                }}
                            >
                                Вниз
                            </button>
                        </div>
                    </>
                )}
            </div>
            <div
                style={styles.inventoryPanel}
            >
                <div style={styles.inventorySection}>
                    <h3 style={styles.inventoryTitle}>Інструменти</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(TOOL_TYPES).filter(([, label]) => label !== 'Меблі').map(([key, label]) => (
                            <HoverButton
                                key={label}
                                onClick={() => handleToolToggle(label)}
                                style={{
                                    ...styles.buttonBase,
                                    ...(selectedTool === label ? styles.toolButtonActive : styles.toolButtonInactive),
                                    padding: '10px 15px',
                                    fontSize: '1em',
                                }}
                                hoverStyle={selectedTool === label ? styles.toolButtonActiveHover : styles.toolButtonInactiveHover}
                            >
                                {label}
                            </HoverButton>
                        ))}
                    </div>
                </div>

                <div style={{ ...styles.inventorySection, maxWidth: '500px' }}>
                    <h3 style={styles.inventoryTitle}>Кольори</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="color"
                            value={selectedColor}
                            onInput={handleColorInput}
                            onMouseUp={handleColorMouseUp}
                            onChange={() => { }}
                            style={styles.colorInput}
                        />
                        {[...BASE_COLORS, ...userColors].map((color) => (
                            <div
                                key={color}
                                onClick={() => { setSelectedColor(color); }}
                                style={{
                                    ...styles.colorSwatch,
                                    background: color,
                                    ...(selectedColor === color ? styles.colorSwatchSelected : {}),
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div style={{
                    ...styles.inventorySection,
                    minWidth: '300px',
                    flex: '2 1 auto',
                    overflowY: 'auto',
                    maxHeight: '230px',
                }}>
                    <h3 style={styles.inventoryTitle}>Інвентар меблів</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={styles.inventorySubTitle}>Назва кімнати:</h4>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Введіть назву кімнати"
                            style={styles.roomNameInput}
                        />
                    </div>
                    {FURNITURE_CATEGORIES && Object.entries(FURNITURE_CATEGORIES).map(([category, items]) => (
                        <div key={category} style={{ marginBottom: '8px' }}>
                            <h4 style={styles.inventorySubTitle}>{category}</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {items && items.map(({ type, label }) => (
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

                <div style={{
                    ...styles.inventorySection,
                    minWidth: '150px',
                    flex: '0 0 auto',
                }}>
                    <HoverButton
                        onClick={saveRoomState}
                        style={{ ...styles.buttonBase, ...styles.saveButton }}
                        hoverStyle={styles.saveButtonHover}
                    >
                        Зберегти
                    </HoverButton>
                    <HoverButton
                        onClick={resetAllState}
                        style={{ ...styles.buttonBase, ...styles.clearButton }}
                        hoverStyle={styles.clearButtonHover}
                    >
                        Очистити все
                    </HoverButton>
                    <HoverButton
                        onClick={() => {
                            setModalContent({
                                title: 'Вийти без збереження',
                                message: 'Ваші зміни не збережено. Ви впевнені, що хочете вийти?',
                                onConfirm: () => { setShowModal(false); document.location.href = "/"; },
                                isConfirm: true
                            });
                            setShowModal(true);
                        }}
                        style={{ ...styles.buttonBase, ...styles.exitButton }}
                        hoverStyle={styles.exitButtonHover}
                    >
                        Вийти без збереження
                    </HoverButton>
                </div>
            </div>
            <Tutorial show={showTutorial} onClose={() => setShowTutorial(false)} />
            <Modal
                show={showModal}
                title={modalContent.title}
                message={modalContent.message}
                onClose={() => setShowModal(false)}
                onConfirm={modalContent.onConfirm}
                isConfirm={modalContent.isConfirm}
            />
        </div>
    );
}
