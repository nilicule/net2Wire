// Room configuration and constants
export const ROOM_ID = window.ROOM_ID;
export const IS_NEW_ROOM = window.IS_NEW_ROOM;

// Application state
export let shapeCounter = 0;
export let selectedShape = null;
export let isDrawing = false;
export let drawingShape = null;
export let startX = 0;
export let startY = 0;
export let dragOffset = { x: 0, y: 0 };
export let isResizing = false;
export let resizeHandle = null;
export let originalBounds = null;

// Setters for state management
export function setShapeCounter(value) { shapeCounter = value; }
export function setSelectedShape(value) { selectedShape = value; }
export function setIsDrawing(value) { isDrawing = value; }
export function setDrawingShape(value) { drawingShape = value; }
export function setStartX(value) { startX = value; }
export function setStartY(value) { startY = value; }
export function setDragOffset(value) { dragOffset = value; }
export function setIsResizing(value) { isResizing = value; }
export function setResizeHandle(value) { resizeHandle = value; }
export function setOriginalBounds(value) { originalBounds = value; }