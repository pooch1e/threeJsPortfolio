varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uMouseCell;

void main() {
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    float aspect = uResolution.x / uResolution.y;
    float gridCount = 30.0;

    // Scale UV by aspect ratio so cells are square on screen
    vec2 scaledUv = vUv * vec2(aspect * gridCount, gridCount);

    vec2 grid = floor(scaledUv);

    // Hover and 4-directional neighbour detection
    // Manhattan distance: hovered = 0, neighbour = 1
    vec2 delta = abs(grid - uMouseCell);
    float manhattan = delta.x + delta.y;
    bool isHovered   = (uMouseCell.x >= 0.0) && (manhattan == 0.0);
    bool isNeighbour = (uMouseCell.x >= 0.0) && (manhattan == 1.0);

    // Grid lines
    float lineWidth = 0.05;
    vec2 gridFrac = fract(scaledUv);
    float line = step(gridFrac.x, lineWidth) + step(gridFrac.y, lineWidth);

    // Cell fill colour
    vec3 cellColor = vec3(0.0);
    if (isHovered)   cellColor = vec3(1.0, 0.3, 0.0);   // orange
    if (isNeighbour) cellColor = vec3(0.4, 0.1, 0.0);   // dim orange

    // Grid lines drawn on top
    vec3 color = mix(cellColor, vec3(1.0), line);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
