uniform float uBigWavesElevation;
uniform vec2 uBigWavesFrequency;
uniform float uTime;
uniform float uWaveSpeed;

varying float vElevation;


void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Elevation
    float elevation = sin(modelPosition.x * uBigWavesFrequency.x + uTime * uWaveSpeed) * sin(modelPosition.z * uBigWavesFrequency.y + uTime * uWaveSpeed) * uBigWavesElevation;
    modelPosition.y += elevation;


    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    vElevation = elevation;

    
    gl_Position = projectedPosition;
}