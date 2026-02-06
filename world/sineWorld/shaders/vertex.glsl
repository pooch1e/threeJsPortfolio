void main() {

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;


    // Point size
    // float sizeIn = smoothstep(0.0, 0.1, particle.a);
    // float sizeOut = 1.0 - smoothstep(0.7, 1.0, particle.a);
    // float size = min(sizeIn, sizeOut);

    gl_PointSize = size * aSize * uSize * uResolution.y;
}