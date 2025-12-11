varying vec3 vNormal;
void main() {
  // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Model normal (have to apply transformations to model normal otherwise light will just follow rotation ie not realistic!!)
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Varyings
    vNormal = modelNormal.xyz;
}
