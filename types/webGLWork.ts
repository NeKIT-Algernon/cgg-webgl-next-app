interface WebGLWork {
  id: string;
  name: string;
  controls: string[];
  initialize: (gl: WebGL2RenderingContext, taskNum?: number) => void;
}

interface WebGLWorkProps {
  works: WebGLWork[],
  activeWork: WebGLWork | null;
  switchWork: (workId: string) => void;
}

interface WebGLProgramInfo {
  program: WebGLProgram;
  vertexCount: number;
    attribLocations: {
        vertexPosition: number;
        vertexColor: number;
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation | null;
        modelViewMatrix: WebGLUniformLocation | null;
        pointSize?: WebGLUniformLocation | null;
    };
}

interface WebGLBuffersInfo {
  position: WebGLBuffer;
  color: WebGLBuffer | null;
}

interface WebGLRenderInfo {
  programInfoList: WebGLProgramInfo[],
  buffersList: WebGLBuffersInfo[],
}

interface WebGLcustomSettings {
  primitive: number,
  pointSize: number,
  lineThickness: number,
}