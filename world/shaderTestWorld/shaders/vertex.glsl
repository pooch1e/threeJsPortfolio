uniform vec2 uFrequency;
uniform float uTime;

attribute float aRandom;
varying float vRandom;
varying vec2 vUv;


void main()
{
    vec4 modelPosition = vec4(position, 1.0);
    modelPosition.z += sin(modelPosition.x * uFrequency.x + uTime) * 0.1;
    modelPosition.z += sin(modelPosition.y * uFrequency.y + uTime) * 0.1;
    
    vRandom = aRandom;
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * modelPosition;
}
