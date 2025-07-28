import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import { GridHelper, Vector3, MeshStandardMaterial, Raycaster, Plane, Euler, Quaternion, PointLight, SpotLight } from 'three';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';

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
    wall: '🧱 Стена',
    floor: '⬜ Пол',
    paint: '🎨 Краска',
    furniture: 'Мебель',
};

const BASE_COLORS = ['#E1E6F0', '#2C3A59', '#2D9CDB', '#FFA94D', '#228B22'];

const hoverMaterial = new MeshStandardMaterial({ color: "#ADD8E6", transparent: true, opacity: 0.3 });
const phantomMaterial = new MeshStandardMaterial({ color: "#2D9CDB", transparent: true, opacity: 0.5 });

const FURNITURE_CATEGORIES = {
    '🛋️ Гостиная': [
        { type: 'sofa', label: 'Диван', dimensions: { width: 1.6, depth: 0.8, height: 0.8 } },
        { type: 'chair', label: 'Кресло', dimensions: { width: 0.6, depth: 0.6, height: 0.8 } },
        { type: 'table', label: 'Стол', dimensions: { width: 1.0, depth: 0.8, height: 0.8 } },
    ],
    '🚪 Проёмы': [
        { type: 'door', label: 'Дверь', dimensions: { width: 0.9, depth: 0.05, height: WALL_HEIGHT } },
        { type: 'window', label: 'Окно', dimensions: { width: 0.9, depth: 0.05, height: WALL_HEIGHT } },
    ],
    '🧑‍🍳 Кухня': [
        { type: 'kitchenTable', label: 'Кухонный стол', dimensions: { width: 1.2, depth: 0.7, height: 0.8 } },
        { type: 'kitchenCabinet', label: 'Кухонный шкаф', dimensions: { width: 1.0, depth: 0.5, height: 1.0 } },
    ],
    '🌳 Сад': [
        { type: 'outdoorChair', label: 'Уличный стул', dimensions: { width: 0.6, depth: 0.6, height: 0.5 } },
        { type: 'outdoorTable', label: 'Уличный стол', dimensions: { width: 1.0, depth: 1.0, height: 0.75 } },
    ],
    '🛏️ Спальня': [
        { type: 'bed', label: 'Кровать', dimensions: { width: 1.9, depth: 1.3, height: 0.5 } },
        { type: 'lamp', label: 'Лампа', dimensions: { width: 0.3, depth: 0.3, height: 1.1 } },
        { type: 'cabinet', label: 'Шкаф', dimensions: { width: 1.0, depth: 0.5, height: 2.0 } },
    ],
    '💻 Электроника': [
        { type: 'tv', label: 'Телевизор', dimensions: { width: 1.6, depth: 0.6, height: 1.0 } },
        { type: 'console', label: 'Игровая приставка', dimensions: { width: 0.4, depth: 0.6, height: 0.1 } },
        { type: 'computerSetup', label: 'Компьютерный сетап', dimensions: { width: 1.6, depth: 0.7, height: 1.0 } },
    ],
    '💡 Освещение': [
        { type: 'ceilingLamp', label: 'Потолочная лампа', dimensions: { width: 0.6, depth: 0.6, height: 0.6 } },
        { type: 'rgbStrip', label: 'RGB лента', dimensions: { width: 1.0, depth: 0.05, height: 0.02 } },
    ],
    '🌱 Растения': [
        { type: 'pottedPlant', label: 'Горшечное растение', dimensions: { width: 0.4, depth: 0.4, height: 0.8 } },
        { type: 'tallPlant', label: 'Высокое растение', dimensions: { width: 0.5, depth: 0.5, height: 1.5 } },
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
                background: '#374151',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                color: '#E5E7EB',
                maxWidth: '400px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h2 style={{ color: '#3B82F6', margin: 0 }}>{title}</h2>
                <p style={{ lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: isConfirm ? 'space-between' : 'center', marginTop: '20px' }}>
                    {isConfirm && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: '#DC2626',
                                color: '#E5E7EB',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                opacity: 0.8,
                            }}
                        >
                            Отмена
                        </button>
                    )}
                    <button
                        onClick={onConfirm || onClose}
                        style={{
                            padding: '10px 20px',
                            background: '#3B82F6',
                            color: '#E5E7EB',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginLeft: isConfirm ? 'auto' : '0',
                        }}
                    >
                        {isConfirm ? 'Подтвердить' : 'ОК'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Chair = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.25, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
        </mesh>
        <mesh position={[0, 0.5, -0.2]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
        </mesh>
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.125, z]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#2C3A59" })}>
                <cylinderGeometry args={[0.03, 0.03, 0.25]} />
            </mesh>
        ))}
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

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

const Door = React.memo(({ color, rotation, isHighlighted, isPhantom }) => (
    <group rotation={[0, rotation, 0]}>
        <mesh position={[0, WALL_HEIGHT / 2, 0]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: color })}>
            <boxGeometry args={[0.9, WALL_HEIGHT, 0.05]} />
        </mesh>
        <mesh position={[0.4, WALL_HEIGHT / 2 - 0.5, 0.03]} material={isPhantom ? phantomMaterial : new MeshStandardMaterial({ color: "#FFD700" })}>
            <sphereGeometry args={[0.05, 16, 16]} />
        </mesh>
        {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
    </group>
));

const Window = React.memo(({ color, rotation, isHighlighted, isPhantom, width = 0.9 }) => {
    const material = new MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
        metalness: 0.2,
    });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, WALL_HEIGHT / 2, 0]} material={isPhantom ? phantomMaterial : material}>
                <boxGeometry args={[width, WALL_HEIGHT, 0.01]} />
            </mesh>

            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const TV = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const frameMaterial = new MeshStandardMaterial({ color: "#2C3A59" });
    const screenMaterial = new MeshStandardMaterial({ color: "#000000" });
    const standMaterial = new MeshStandardMaterial({ color: "#1E1E1E" });
    const cabinetMaterial = new MeshStandardMaterial({ color: "#8B5E3C" });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.25, 0]} material={isPhantom ? phantomMaterial : cabinetMaterial}>
                <boxGeometry args={[1.6, 0.5, 0.6]} />
            </mesh>
            <mesh position={[0, 0.8, 0]} material={isPhantom ? phantomMaterial : frameMaterial}>
                <boxGeometry args={[1.2, 0.7, 0.05]} />
            </mesh>
            <mesh position={[0, 0.8, 0.03]} material={isPhantom ? phantomMaterial : screenMaterial}>
                <boxGeometry args={[1.1, 0.6, 0.01]} />
            </mesh>
            <mesh position={[0, 0.55, 0]} material={isPhantom ? phantomMaterial : standMaterial}>
                <boxGeometry args={[0.1, 0.2, 0.1]} />
            </mesh>
            <mesh position={[0, 0.45, 0]} material={isPhantom ? phantomMaterial : standMaterial}>
                <boxGeometry args={[0.4, 0.02, 0.25]} />
            </mesh>
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

const PottedPlant = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const potMaterial = new MeshStandardMaterial({ color: "#8B4513" });
    const plantMaterial = new MeshStandardMaterial({ color: "#228B22" });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.15, 0]} material={isPhantom ? phantomMaterial : potMaterial}>
                <cylinderGeometry args={[0.15, 0.2, 0.3, 16]} />
            </mesh>
            <mesh position={[0, 0.45, 0]} material={isPhantom ? phantomMaterial : plantMaterial}>
                <sphereGeometry args={[0.2, 16, 16]} />
            </mesh>
            <mesh position={[0.1, 0.55, 0.1]} material={isPhantom ? phantomMaterial : plantMaterial}>
                <boxGeometry args={[0.1, 0.3, 0.1]} />
            </mesh>
            <mesh position={[-0.1, 0.5, -0.1]} material={isPhantom ? phantomMaterial : plantMaterial}>
                <boxGeometry args={[0.1, 0.2, 0.1]} />
            </mesh>
            {isHighlighted && <Outlines thickness={0.02} color="#FFFF00" opacity={1} />}
        </group>
    );
});

const TallPlant = React.memo(({ color, rotation, isHighlighted, isPhantom }) => {
    const potMaterial = new MeshStandardMaterial({ color: "#696969" });
    const stemMaterial = new MeshStandardMaterial({ color: "#556B2F" });
    const leafMaterial = new MeshStandardMaterial({ color: "#3CB371" });

    return (
        <group rotation={[0, rotation, 0]}>
            <mesh position={[0, 0.1, 0]} material={isPhantom ? phantomMaterial : potMaterial}>
                <cylinderGeometry args={[0.2, 0.25, 0.2, 16]} />
            </mesh>
            <mesh position={[0, 0.7, 0]} material={isPhantom ? phantomMaterial : stemMaterial}>
                <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
            </mesh>
            <mesh position={[0.2, 1.2, 0]} rotation={[0, 0, Math.PI / 4]} material={isPhantom ? phantomMaterial : leafMaterial}>
                <boxGeometry args={[0.1, 0.6, 0.02]} />
            </mesh>
            <mesh position={[-0.2, 1.0, 0.1]} rotation={[0, 0, -Math.PI / 6]} material={isPhantom ? phantomMaterial : leafMaterial}>
                <boxGeometry args={[0.1, 0.5, 0.02]} />
            </mesh>
            <mesh position={[0, 0.9, -0.2]} rotation={[Math.PI / 6, 0, 0]} material={isPhantom ? phantomMaterial : leafMaterial}>
                <boxGeometry args={[0.02, 0.4, 0.1]} />
            </mesh>
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
            title: 'Добро пожаловать в Room Designer!',
            text: 'Давайте быстро освоим основы. Нажмите "Далее", чтобы начать.'
        },
        {
            title: 'Инструменты и Цвета',
            text: `В нижней части экрана вы видите панель инструментов (🧱, ⬜, 🎨) и цветов. Выберите инструмент и цвет, чтобы начать строительство.`
        },
        {
            title: 'Создание Пола',
            text: `Выберите инструмент "⬜ Пол". Щелкните **ЛЕВОЙ** кнопкой мыши на сетке в 3D-окне, чтобы начать перетаскивание плитки пола. Отпустите, чтобы разместить.`
        },
        {
            title: 'Размещение Стен',
            text: `Выберите инструмент "🧱 Стена". Щелкните **ЛЕВОЙ** кнопкой мыши на существующей плитке пола, чтобы начать перетаскивание стены. Отпустите, чтобы разместить.`
        },
        {
            title: 'Размещение Мебели (Перетаскивание)',
            text: 'Щелкните **ЛЕВОЙ** кнопкой мыши на иконке предмета в инвентаре (снизу) и, не отпуская, перетащите его на нужную плитку пола. Отпустите кнопку мыши, чтобы разместить предмет.'
        },
        {
            title: 'Окрашивание Объектов (Перетаскивание)',
            text: `Выберите инструмент "🎨 Краска" и новый цвет. Щелкните **ЛЕВОЙ** кнопкой мыши на плитке пола или на мебели и, не отпуская, перетаскивайте курсор, чтобы покрасить их.`
        },
        {
            title: 'Удаление Объектов (Правый Клик)',
            text: 'Вы можете удалить любой объект (пол, стену, мебель), щелкнув по нему **ПРАВОЙ** кнопкой мыши.'
        },
        {
            title: 'Поворот Объектов',
            text: 'Чтобы **повернуть** объект (фантомный во время перетаскивания или уже размещенный), наведите на него курсор и нажмите **"R"** на клавиатуре.'
        },
        {
            title: 'Привязка к Стене (Новая функция!)',
            text: 'Чтобы **привязать** мебель к краю блока (к стене), наведите на объект и нажмите **"T"**. Объект переместится к ближайшей стене вместо центра блока.'
        },
        {
            title: 'Сохранить Проект',
            text: 'Используйте кнопку "Сохранить" в нижней панели, чтобы сохранить текущее состояние вашей комнаты. Это позволит вам вернуться к нему позже.'
        },
        {
            title: 'Сбросить Проект',
            text: 'Если вы хотите начать все заново, воспользуйтесь кнопкой "Очистить все" в нижней панели.'
        },
        {
            title: 'Управление Камерой (Клавиатура)',
            text: 'Используйте клавиши **WASD** для перемeщения вперед/назад/вбок. \nИспользуйте **E** для движения вверх и **Q** для движения вниз.\nИспользуйте **стрелки влево/вправо** для поворота камеры.\nИспользуйте **стрелки вверх/вниз** для наклона камеры вверх/вниз.'
        },
        {
            title: 'Готово!',
            text: 'Вы освоили основы! Наслаждайтесь созданием своего дизайна!'
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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#121924',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
        }}>
            <div style={{
                background: '#374151',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                color: '#E5E7EB',
                maxWidth: '600px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h2 style={{ color: '#3B82F6', margin: 0 }}>{steps[step].title}</h2>
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{steps[step].text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    {step < steps.length - 1 ? (
                        <button
                            onClick={handleSkip}
                            style={{
                                padding: '10px 20px',
                                background: '#DC2626',
                                color: '#E5E7EB',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                opacity: 0.8,
                            }}
                        >
                            Пропустить
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        onClick={handleNext}
                        style={{
                            padding: '10px 20px',
                            background: '#3B82F6',
                            color: '#E5E7EB',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginLeft: step < steps.length - 1 ? 'auto' : '0',
                        }}
                    >
                        {step < steps.length - 1 ? 'Далее' : 'Начать'}
                    </button>
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
                title: 'Неподдерживаемый браузер/устройство',
                message: 'Ваш браузер или устройство не поддерживает WebGL, необходимый для работы этого приложения. Пожалуйста, попробуйте другой браузер или устройство.',
                onConfirm: () => navigate('/'),
                isConfirm: false
            });
            setShowModal(true);
        }

        setIsMobile(isMobileDevice());

        return () => {
        };
    }, [navigate]);

    const resetAllState = useCallback(() => {
        console.log('Сброс всех состояний...');
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

                setFurniture((prev) => ({
                    ...prev,
                    [key]: { ...prev[key], rotation: newRotation, offsetX: newOffsetX, offsetZ: newOffsetZ, isSnapped: isSnapped },
                }));

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
    }, [furniture, walls, getKey, hoveredCell, isDragging, phantomObjectPosition, draggedType, floorTiles]);

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
        console.log(`Попытка удалить объект по адресу ${key}`);

        if (furniture[key]) {
            const removedFurnitureType = furniture[key].type;
            setFurniture((prev) => {
                const copy = { ...prev };
                delete copy[key];
                console.log(`Мебель удалена по адресу ${key}. Новое состояние мебели:`, copy);
                return copy;
            });

            if (removedFurnitureType === 'door' || removedFurnitureType === 'window') {
                setWalls((prev) => {
                    const copy = { ...prev };
                    if (copy[key] && copy[key].hasOpening) {
                        delete copy[key];
                        console.log(`Удалена связанная стена с проемом по адресу ${key}. Новое состояние стен:`, copy);
                    }
                    return copy;
                });
            }
        } else if (walls[key]) {
            setWalls((prev) => {
                const copy = { ...prev };
                delete copy[key];
                console.log(`Стена удалена по адресу ${key}. Новое состояние стен:`, copy);
                return copy;
            });
        } else if (floorTiles[key]) {
            setFloorTiles((prev) => {
                const copy = { ...prev };
                delete copy[key];
                console.log(`Плитка пола удалена по адресу ${key}. Новое состояние пола:`, copy);
                return copy;
            });
        }
    }, [furniture, walls, floorTiles, getKey]);

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
                               cameraVerticalInput
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

            if (selectedTool === TOOL_TYPES.floor || selectedTool === TOOL_TYPES.wall || selectedTool === TOOL_TYPES.paint) {
                setIsDragging(true);
                setDraggedType(selectedTool);
                setDraggedSubType(null);
                setPhantomObjectRotation(0);

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
            }
        }, [isDragging, selectedTool, setIsDragging, setDraggedType, setDraggedSubType, setPhantomObjectRotation, hoveredCell, floorTiles, furniture, selectedColor, getKey, setFloorTiles, setFurniture]);

        const handlePointerMove = useCallback((e) => {
            const domEvent = e.nativeEvent || e;
            const intersectionPoint = getIntersectionPoint(domEvent);

            if (intersectionPoint) {
                const newHoveredCell = { x: Math.round(intersectionPoint.x), z: Math.round(intersectionPoint.z) };
                setHoveredCell(newHoveredCell);

                if (isDragging && draggedType) {
                    const snappedX = Math.round(intersectionPoint.x);
                    const snappedZ = Math.round(intersectionPoint.z);
                    setPhantomObjectPosition({ x: snappedX, z: snappedZ });

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
                setHoveredCell(null);
                if (isDragging && draggedType) {
                    setPhantomObjectPosition(null);
                }
            }
            domEvent.stopPropagation();
        }, [isDragging, draggedType, setHoveredCell, setPhantomObjectPosition, floorTiles, furniture, selectedColor, getKey, setFloorTiles, setFurniture, getIntersectionPoint]);

        useEffect(() => {
            const handleGlobalPointerUp = (e) => {
                if (e.button === 0 && isDragging && draggedType && phantomObjectPosition) {
                    const finalX = Math.round(phantomObjectPosition.x);
                    const finalZ = Math.round(phantomObjectPosition.z);
                    const key = getKey(finalX, finalZ);

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
                        if (floorTiles[key]) {
                            const existingFurniture = furniture[key];
                            let phantomDimensions = null;
                            for (const category in FURNITURE_CATEGORIES) {
                                const found = FURNITURE_CATEGORIES[category].find(item => item.type === draggedSubType);
                                if (found) {
                                    phantomDimensions = found.dimensions;
                                    break;
                                }
                            }

                            if (existingFurniture && existingFurniture.type !== 'door' && existingFurniture.type !== 'window') {
                                console.warn(`Невозможно разместить мебель, другая мебель существует по адресу ${key}`);
                            } else {
                                const newFurniture = {
                                    type: draggedSubType,
                                    color: selectedColor,
                                    rotation: phantomObjectRotation,
                                    offsetX: 0,
                                    offsetZ: 0,
                                    isSnapped: false,
                                    dimensions: phantomDimensions
                                };
                                setFurniture((prev) => ({ ...prev, [key]: newFurniture }));

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
                            }
                        }
                    }
                }

                setIsDragging(false);
                setDraggedType(null);
                setDraggedSubType(null);
                setPhantomObjectPosition(null);
                setPhantomObjectRotation(0);
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
        }, [isDragging, draggedType, draggedSubType, phantomObjectPosition, getKey, floorTiles, furniture, walls, setFurniture, setWalls, setFloorTiles, selectedColor, phantomObjectRotation, setIsDragging, setDraggedType, setDraggedSubType, setPhantomObjectPosition, setPhantomObjectRotation, checkGridExpansion, gl]);

        const renderComponent = useCallback((data, isPhantom = false) => {
            const { type: itemType, color, rotation = 0 } = data;
            const isHighlighted = !isPhantom && hoveredCell &&
                Math.round(data.position.x) === hoveredCell.x &&
                Math.round(data.position.z) === hoveredCell.z;

            switch (itemType) {
                case 'chair': return <Chair color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'outdoorChair': return <OutdoorChair color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'table': return <Table color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'kitchenTable': return <KitchenTable color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'outdoorTable': return <OutdoorTable color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'sofa': return <Sofa color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'bed': return <Bed color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'lamp': return <Lamp color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'cabinet': return <Cabinet color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'kitchenCabinet': return <KitchenCabinet color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'door': return <Door color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'window': return <Window color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'tv': return <TV color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'console': return <Console color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'computerSetup': return <ComputerSetup color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'ceilingLamp': return <CeilingLamp color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'spotlight': return <Spotlight color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'rgbStrip': return <RgbStrip color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'pottedPlant': return <PottedPlant color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case 'tallPlant': return <TallPlant color={color} rotation={rotation} isHighlighted={isHighlighted} isPhantom={isPhantom} />;
                case TOOL_TYPES.floor: return <FloorPhantom />;
                case TOOL_TYPES.wall:
                    const potentialOpening = hoveredCell && furniture[getKey(hoveredCell.x, hoveredCell.z)] &&
                        (furniture[getKey(hoveredCell.x, hoveredCell.z)].type === 'door' ||
                            furniture[getKey(hoveredCell.x, hoveredCell.z)].type === 'window');
                    return <WallPhantom hasOpening={potentialOpening} />;
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
            return items;
        }, [
            gridSize, getKey, floorTiles, walls, furniture, renderComponent, hoveredCell, handlePointerDown, handlePointerMove, handleRightClick
        ]);

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
                        {renderComponent({ type: draggedType === TOOL_TYPES.furniture ? draggedSubType : draggedType, color: selectedColor, rotation: phantomObjectRotation }, true)}
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
        setPhantomObjectRotation(0);
    }, []);

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
            console.error("Ошибка сохранения: Недействительный ID комнаты. Невозможно сохранить.");
            setModalContent({
                title: 'Ошибка сохранения',
                message: 'Недействительный идентификатор комнаты. Сохранение невозможно.',
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
                    console.error("Ошибка парсинга пользователя из localStorage при сохранении, сбрасываем данные пользователя:", e);
                    currentUser = null;
                }
            }

            if (!currentUser || !Array.isArray(currentUser.rooms)) {
                console.error("Недействительные или отсутствующие данные пользователя в localStorage. Сохранение невозможно.");
                setModalContent({
                    title: 'Ошибка сохранения',
                    message: 'Нет данных пользователя для сохранения комнаты. Войдите или зарегистрируйтесь.',
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
                console.log('Состояние комнаты успешно сохранено для ID:', roomId, currentUser.rooms[roomIndex]);
                setModalContent({
                    title: 'Сохранено',
                    message: `Состояние комнаты "${roomName}" успешно сохранено!`,
                    onConfirm: () => { setShowModal(false); navigate('/'); },
                    isConfirm: false
                });
                setShowModal(true);
            } else {
                console.warn(`Комната с ID ${roomId} не найдена в списке комнат пользователя. Сохранение не произошло.`);
                setModalContent({
                    title: 'Ошибка сохранения',
                    message: 'Комната с таким ID не найдена для обновления. Убедитесь, что она существует.',
                    onConfirm: () => setShowModal(false),
                    isConfirm: false
                });
                setShowModal(true);
            }
        } catch (error) {
            console.error("Ошибка сохранения состояния комнаты:", error);
            setModalContent({
                title: 'Ошибка сохранения',
                message: 'Ошибка при сохранении состояния комнаты. Проверьте консоль для деталей.',
                onConfirm: () => setShowModal(false),
                isConfirm: false
            });
            setShowModal(true);
        }
    }, [roomId, gridSize, walls, furniture, floorTiles, userColors, selectedColor, targetCameraPosition, targetCameraQuaternion, navigate, roomName]);

    useEffect(() => {
        const loadRoomState = () => {
            if (isNaN(roomId)) {
                console.error("Ошибка загрузки: Недействительный ID комнаты. Перенаправление на главную страницу.");
                setModalContent({
                    title: 'Ошибка загрузки',
                    message: 'Неверный идентификатор комнаты. Перенаправление на главную страницу.',
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
                        console.error("Ошибка парсинга пользователя из localStorage при загрузке, сбрасываем данные пользователя:", e);
                        currentUser = null;
                    }
                }

                if (!currentUser || !Array.isArray(currentUser.rooms)) {
                    console.warn("Недействительные или отсутствующие данные пользователя в localStorage. Сброс состояния.");
                    resetAllState();
                    return;
                }

                const roomToLoad = currentUser.rooms.find(room => room.id === roomId);

                if (roomToLoad) {
                    console.log('Загрузка состояния комнаты для ID:', roomId, roomToLoad);
                    setRoomName(roomToLoad.name || `Комната ${roomId}`);
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
                    console.warn(`Комната с ID ${roomId} не найдена в списке комнат пользователя. Инициализация нового состояния комнаты.`);
                    setModalContent({
                        title: 'Комната не найдена',
                        message: 'Комната не найдена. Был инициализирован новый проект.',
                        onConfirm: () => setShowModal(false),
                        isConfirm: false
                    });
                    setShowModal(true);
                    resetAllState();
                }
            } catch (error) {
                console.error("Ошибка загрузки состояния комнаты:", error);
                setModalContent({
                    title: 'Ошибка загрузки',
                    message: 'Ошибка при загрузке состояния комнаты. Проверьте консоль для деталей.',
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
            title: 'Удалить комнату',
            message: `Вы уверены, что хотите удалить комнату "${roomName}"? Это действие нельзя отменить.`,
            onConfirm: () => {
                try {
                    const userJson = localStorage.getItem('user');
                    let currentUser = null;

                    if (userJson) {
                        try {
                            currentUser = JSON.parse(userJson);
                        } catch (e) {
                            console.error("Ошибка парсинга пользователя из localStorage при удалении комнаты:", e);
                            setModalContent({
                                title: 'Ошибка',
                                message: 'Данные пользователя повреждены. Удаление невозможно.',
                                onConfirm: () => setShowModal(false),
                                isConfirm: false
                            });
                            setShowModal(true);
                            return;
                        }
                    }

                    if (!currentUser || !Array.isArray(currentUser.rooms)) {
                        console.error("Недействительные или отсутствующие данные пользователя в localStorage. Удаление невозможно.");
                        setModalContent({
                            title: 'Ошибка',
                            message: 'Нет данных пользователя. Удаление невозможно.',
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
                            title: 'Комната удалена',
                            message: `Комната "${roomName}" успешно удалена.`,
                            onConfirm: () => { setShowModal(false); navigate('/'); },
                            isConfirm: false
                        });
                        setShowModal(true);
                        console.log(`Комната с ID ${roomId} успешно удалена.`);
                    } else {
                        setModalContent({
                            title: 'Ошибка удаления',
                            message: 'Комната с таким ID не найдена.',
                            onConfirm: () => setShowModal(false),
                            isConfirm: false
                        });
                        setShowModal(true);
                        console.warn(`Комната с ID ${roomId} не найдена для удаления.`);
                    }
                } catch (error) {
                    console.error("Ошибка удаления комнаты:", error);
                    setModalContent({
                        title: 'Ошибка удаления',
                        message: 'Ошибка при удалении комнаты. Проверьте консоль для деталей.',
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
        <div id="root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1F2937' }}>
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
                    />
                </Canvas>
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
                                Вверх
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
            <div style={{
                background: 'rgba(31, 41, 55, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#E1E6F0',
                padding: '15px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                overflowX: 'hidden',
                overflowY: 'auto',
                maxHeight: '280px',
                borderTop: '1px solid rgba(75, 85, 99, 0.5)',
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
                borderRadius: '15px 15px 0 0',
                position: 'relative',
                zIndex: 999,
            }}>
                <div style={{
                    background: 'rgba(55,65,81,0.6)',
                    padding: '12px',
                    borderRadius: '10px',
                    minWidth: '150px',
                    flex: '1 1 auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#2D9CDB', fontSize: '1.2em', fontWeight: '700' }}>Инструменты</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(TOOL_TYPES).filter(([, label]) => label !== 'Мебель').map(([key, label]) => (
                            <button
                                key={label}
                                onClick={() => {
                                    setSelectedTool(label);
                                    setIsDragging(false);
                                    setDraggedType(null);
                                    setDraggedSubType(null);
                                    setPhantomObjectPosition(null);
                                    setPhantomObjectRotation(0);
                                }}
                                style={{
                                    padding: '10px 15px',
                                    background: selectedTool === label ? '#1B74E4' : 'rgba(75,85,99,0.7)',
                                    color: selectedTool === label ? '#E1E6F0' : '#E1E6F0',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1em',
                                    fontWeight: '600',
                                    transition: 'background-color 0.3s ease, transform 0.2s, box-shadow 0.3s ease',
                                    boxShadow: selectedTool === label ? '0 4px 12px rgba(27, 116, 228, 0.4)' : 'none',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{
                    background: 'rgba(55,65,81,0.6)',
                    padding: '12px',
                    borderRadius: '10px',
                    maxWidth: '500px',
                    flex: '1 1 auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#2D9CDB', fontSize: '1.2em', fontWeight: '700' }}>Цвета</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="color"
                            value={selectedColor}
                            onInput={handleColorInput}
                            onMouseUp={handleColorMouseUp}
                            onChange={() => { }}
                            style={{
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
                            }}
                        />
                        {[...BASE_COLORS, ...userColors].map((color) => (
                            <div
                                key={color}
                                onClick={() => { setSelectedColor(color); }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    background: color,
                                    borderRadius: '8px',
                                    border: selectedColor === color ? '3px solid #F59E0B' : '2px solid transparent',
                                    boxShadow: selectedColor === color ? '0 0 0 1px #F59E0B' : 'none',
                                    cursor: 'pointer',
                                    transition: 'border 0.2s ease, transform 0.2s',
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div style={{
                    background: 'rgba(55,65,81,0.6)',
                    padding: '12px',
                    borderRadius: '10px',
                    minWidth: '300px',
                    flex: '2 1 auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    overflowY: 'auto',
                    maxHeight: '230px',
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#2D9CDB', fontSize: '1.2em', fontWeight: '700' }}>Инвентарь мебели</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{
                            margin: '0 0 6px 0',
                            color: '#9CA3AF',
                            fontSize: '1em',
                            fontWeight: '600',
                            borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
                            paddingBottom: '4px',
                        }}>Название комнаты:</h4>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Введите название комнаты"
                            style={{
                                background: '#4B5563',
                                color: '#E1E6F0',
                                border: '1px solid #6B7280',
                                borderRadius: '5px',
                                padding: '8px 12px',
                                fontSize: '1em',
                                outline: 'none',
                                width: 'calc(100% - 24px)',
                            }}
                        />
                    </div>
                    {FURNITURE_CATEGORIES && Object.entries(FURNITURE_CATEGORIES).map(([category, items]) => (
                        <div key={category} style={{ marginBottom: '8px' }}>
                            <h4 style={{
                                margin: '0 0 6px 0',
                                color: '#9CA3AF',
                                fontSize: '1em',
                                fontWeight: '600',
                                borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
                                paddingBottom: '4px',
                            }}>{category}</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {items && items.map(({ type, label }) => (
                                    <div
                                        key={type}
                                        onMouseDown={() => handleFurnitureDragStart(type)}
                                        style={{
                                            padding: '8px 12px',
                                            background: 'rgba(31, 41, 55, 0.8)',
                                            color: '#E1E6F0',
                                            borderRadius: '8px',
                                            cursor: 'grab',
                                            border: '1px solid rgba(75, 85, 99, 0.5)',
                                            userSelect: 'none',
                                            fontSize: '0.9em',
                                            whiteSpace: 'nowrap',
                                            transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }}
                                        title={`Перетащите для размещения: ${label}`}
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    background: 'rgba(55,65,81,0.6)',
                    padding: '12px',
                    borderRadius: '10px',
                    minWidth: '150px',
                    flex: '0 0 auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}>
                    <button
                        onClick={saveRoomState}
                        style={{
                            padding: '10px 15px',
                            background: '#28A745',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            fontSize: '1em',
                            fontWeight: '600',
                            transition: 'background-color 0.3s ease, transform 0.2s, box-shadow 0.3s ease',
                            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                        }}
                    >
                        Сохранить
                    </button>
                    <button
                        onClick={resetAllState}
                        style={{
                            padding: '10px 15px',
                            background: '#DC2626',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            fontSize: '1em',
                            fontWeight: '600',
                            transition: 'background-color 0.3s ease, transform 0.2s, box-shadow 0.3s ease',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                        }}
                    >
                        Очистить все
                    </button>

                    <button
                        onClick={() => {
                            setModalContent({
                                title: 'Выйти без сохранения',
                                message: 'Ваши изменения не сохранены. Вы уверены, что хотите выйти?',
                                onConfirm: () => { setShowModal(false); document.location.href = "/"; },
                                isConfirm: true
                            });
                            setShowModal(true);
                        }}
                        style={{
                            padding: '10px 15px',
                            background: '#545454ff',
                            color: '#E1E6F0',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            fontSize: '1em',
                            fontWeight: '600',
                            transition: 'background-color 0.3s ease, transform 0.2s, box-shadow 0.3s ease',
                            boxShadow: '0 4px 12px rgba(65, 65, 66, 0.3)',
                        }}
                    >
                        Выйти без сохранения
                    </button>
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
