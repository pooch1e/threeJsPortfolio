varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    int gridX = 30;
    int gridY = 30;

    vec2 grid = floor(vUv * vec2(gridX, gridY));

    //grid lines optional
    float lineWidth = 0.02;
    vec2 gridFrac = fract(vUv * vec2(gridX, gridY));
    float line = step(gridFrac.x, lineWidth) + step(gridFrac.y, lineWidth);

    // Final color
    //  white grid lines, black cells
    vec3 color = mix(vec3(0.0), vec3(1.0), line);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}