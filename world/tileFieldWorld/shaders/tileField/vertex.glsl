#include ../../../shaders/includes/perlinClassic3D.glsl

uniform vec2 uGrid;
uniform vec2 uCursor;
uniform vec2 uCursorRadius;
uniform vec2 uCursorMagnitude;
uniform float uValueMin;

uniform float uFieldFrequency;
uniform float uFieldZ;

uniform vec2 uBand;
uniform vec2 uJGain;
uniform vec2 uLGain;
uniform float uOffset;
uniform float uSize;

attribute vec2 aCell;

varying vec2 vUv;

void main()
{
    vUv = uv;

    float noise = perlinClassic3D(vec3(aCell * uFieldFrequency, uFieldZ));
    float value = mix(uValueMin, 1.0, noise * 0.5 + 0.5);

    // aCell counts rows downwards from the top, as the original sketch does
    vec2 centre = vec2(
        aCell.x + uOffset + uSize * 0.5 - uGrid.x * 0.5,
        uGrid.y * 0.5 - (aCell.y + uOffset + uSize * 0.5)
    );

    // radius <= 0 collapses t to 1: j reads as fully-near, l as fully-far,
    // matching the two falloffs' opposite directions
    float cursorDistance = distance(centre, uCursor);
    vec2 t = clamp(cursorDistance / max(uCursorRadius, vec2(1e-4)), 0.0, 1.0);
    float j = uCursorMagnitude.x * t.x;
    float l = uCursorMagnitude.y * (1.0 - t.y);

    float low = value - uJGain.x * j + uLGain.x * l;
    float high = value - uJGain.y * j + uLGain.y * l;

    // A cell outside its rule's band collapses behind the far plane, so it is
    // clipped before rasterising rather than drawn transparent
    if (low <= uBand.x || high >= uBand.y)
    {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    vec3 tilePosition = vec3(position.xy * uSize + centre, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(tilePosition, 1.0);
}
