varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uMouseCell;

void main() {
    float aspect = uResolution.x / uResolution.y;
    float gridCount = 30.0;

    vec2 scaledUv = vUv * vec2(aspect * gridCount, gridCount);

    // Grid lines
    float lineWidth = 0.05;
    vec2 gridFrac = fract(scaledUv);
    float line = step(gridFrac.x, lineWidth) + step(gridFrac.y, lineWidth);

    vec3 color = vec3(line);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}