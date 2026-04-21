varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uMouseCell;
uniform sampler2D uCellData;
uniform sampler2D uGlyphAtlas;
uniform float uGridCount;
uniform float uNumChars;
uniform float uAspect;

void main() {
    vec2 grid = vec2(uAspect * uGridCount, uGridCount);
    vec2 scaledUv = vUv * grid;
    vec2 cellCoord = floor(scaledUv);
    vec2 localUv = fract(scaledUv);

    vec2 clampedCell = clamp(cellCoord, vec2(0.0), grid - 1.0);
    vec2 cellUv = (clampedCell + 0.5) / grid;
    vec4 cellSample = texture2D(uCellData, cellUv);

    float charIndex = floor(cellSample.r * 255.0 + 0.5);
    float brightness = cellSample.g;
    vec2 atlasUv = vec2((charIndex + localUv.x) / uNumChars, 1.0 - localUv.y);
    float glyph = texture2D(uGlyphAtlas, atlasUv).r;

    vec3 color = vec3(glyph * brightness);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
