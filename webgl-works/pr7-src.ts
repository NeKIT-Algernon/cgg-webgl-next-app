// webgl-works/pr7-src.ts

const GL_LINEAR = 9729;
const GL_NEAREST = 9728;
const GL_LINEAR_MIPMAP_LINEAR = 9987;

const GL_REPEAT = 10497;
const GL_MIRRORED_REPEAT = 33648;
const GL_CLAMP_TO_EDGE = 33071;

// Интерфейс для управления текстурой
export type TextureSettings = {
    minFilter: number;
    magFilter: number;
    wrapS: number;
    wrapT: number;
    useTexture: boolean;
};

// Настройки по умолчанию
export const defaultTextureSettings: TextureSettings = {
    minFilter: GL_LINEAR_MIPMAP_LINEAR,
    magFilter: GL_LINEAR,
    wrapS: GL_REPEAT,
    wrapT: GL_REPEAT,
    useTexture: true,
};

// Вершинный шейдер: передаём текстурные координаты
export const vsSourceTexture = `#version 300 es
  in vec4 aPosition;
  in vec2 aTexCoord;

  out vec2 vTexCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
  }
`;

// Фрагментный шейдер: выбор цвета из текстуры или константы
export const fsSourceTexture = `#version 300 es
  precision mediump float;

  in vec2 vTexCoord;

  uniform sampler2D uSampler;
  uniform bool uUseTexture;

  out vec4 fragColor;

  void main() {
    if (uUseTexture) {
      fragColor = texture(uSampler, vTexCoord);
    } else {
      // Защитный цвет, если текстура выключена
      fragColor = vec4(0.3, 0.3, 1.0, 1.0); // синий
    }
  }
`;

// Функция загрузки изображения и создания текстуры
export function loadTexture(
  gl: WebGL2RenderingContext,
  url: string,
  callback: (texture: WebGLTexture | null) => void
) {
  const texture = gl.createTexture();
  if (!texture) {
    console.error("Не удалось создать текстуру");
    callback(null);
    return;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255])
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    callback(texture);

    // ✅ Отправляем событие на canvas
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.dispatchEvent(new CustomEvent("textureloaded"));
  };

  image.onerror = () => {
    console.error("Ошибка загрузки изображения:", url);
    callback(null);
  };

  image.src = url;
}


// Проверка, является ли число степенью двойки
function isPowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0;
}

// Создание буферов для трапеции с текстурными координатами
export function createTrapezoidWithTexCoords() {
    // Трапеция: нижняя часть шире верхней
    const positions = [
        -0.8, 0.5, 0.0,  // верх-лево
        0.8, 0.5, 0.0,  // верх-право
        1.0, -0.5, 0.0,  // низ-право
        -1.0, -0.5, 0.0,  // низ-лево
    ];

    // Текстурные координаты (UV)
    const texCoords = [
        0.0, 0.0,  // верх-лево
        1.0, 0.0,  // верх-право
        1.0, 1.0,  // низ-право
        0.0, 1.0,  // низ-лево
    ];

    // Индексы для двух треугольников
    const indices = [0, 1, 2, 0, 2, 3];

    return { positions, texCoords, indices };
}

// Настройка текстуры: фильтры и обёртка
export function configureTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    settings: TextureSettings
) {
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, settings.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, settings.magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, settings.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, settings.wrapT);
}
