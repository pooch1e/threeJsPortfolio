varying vec3 vPosition;
varying vec3 vNormal;
uniform float uTime;

#include ../includes/random.glsl
void main() {


     // Model normal
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vNormal = modelNormal.xyz;

    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Glitch
    float glitchStrength = sin(uTime - modelPosition.y);
    glitchStrength = smoothstep(0.3, 1.0, glitchStrength); 
    glitchStrength * 0.25;

    modelPosition.x += random2D(modelPosition.xz + uTime) - 0.5 * glitchStrength;
    modelPosition.z += random2D(modelPosition.zx + uTime) - 0.5 * glitchStrength;

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Varyings
    vPosition = modelPosition.xyz;
}