varying vec3 vPosition;
varying vec3 vNormal;
void main() {


     // Model normal
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vNormal = modelNormal.xyz;

    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Varyings
    vPosition = modelPosition.xyz;
}