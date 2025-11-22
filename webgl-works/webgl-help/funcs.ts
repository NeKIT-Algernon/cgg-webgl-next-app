// Функция для создания правильного n-угольника
function createRegularPolygon(n: number, radius: number = 1) {
    const vertices = [] as number[][];

    for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        vertices.push([x, y, 0]); // x, y, z
    }

    return vertices;
}

// Функция генерации слуайного цвета
function generateRandomColor() {
    return [
        Math.random(), // R
        Math.random(), // G 
        Math.random(), // B
        1.0           // A
    ];
}

// Функция преобразования из системы координат экрана (0,0 в левом верхнем углу)
// в систему координат OpenGL (-1,-1 в левом нижнем углу, 1,1 в правом верхнем).
// Первым аргументом передаём массив массивов из точек (3 значения на точку), а вторым размеры в системе координат экрана
function screenToGL(array: number[][], [X, Y]: [number, number]) {
    return array.map((point) => {
        return point.map((coord, i) => {
            if (i % 3 == 0) return (2 * coord / X) - 1;
            if (i % 3 == 1) return 1 - (2 * coord / Y);
            return 0;
        })
    });
}

export {
    createRegularPolygon,
    generateRandomColor,
    screenToGL,
}