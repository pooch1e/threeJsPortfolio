uniform float uWaveSpeed;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/perlinClassic3D.glsl
#include ../includes/waveElevation.glsl

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    float elevation = waveElevation(modelPosition.xyz);
    
    modelPosition.y += elevation;


    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;

    // Varyings
    vElevation = elevation;
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vPosition = modelPosition.xyz;
}