/* Базовые настройки, которые устанавливаются по умолчанию */

function deepFreeze<T extends Record<string, any>>(obj: T): T {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(prop => {
        const value = obj[prop];
        if (value !== null &&
            (typeof value === 'object' || typeof value === 'function') &&
            !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    });
    return obj;
}

// Базовые настройки для рендеринга сцен
const baseSceneOptions: WebGLSceneOptionsType = deepFreeze({
    currentTask: 1, // Начальное задание
    currentSubTask: 1,
    primitive: 5, // Примитив для отображения. 5 - TRIANGLES_STRIP
    pointSize: 10.0, // Размер точки
    lineThickness: 5, // Толщина линии
} as const);

export {
    baseSceneOptions,
}