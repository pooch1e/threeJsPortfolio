/**
 * Vertex shader for FlowerPoints. Looks up each particle's simulated
 * position from the shared FlowerSimulation's GPGPU texture (uParticlesTexture,
 * indexed by aParticlesUv) and projects it normally via modelMatrix — this is
 * how per-instance position/rotation apply even though the simulation itself
 * is shared across flowers.
 *
 * Color: aColor is the model's vertex-painted color. Its red channel selects
 * which part of the flower a point belongs to, blending across a
 * blue(uColorA) -> base(uColor) -> pink(uColorB) palette. particle.a holds a
 * stable per-particle random value (baked into the GPGPU base texture) that
 * shades each point slightly darker or lighter than its chosen color, for
 * some depth/texture rather than flat blocks of color.
 */
uniform vec2 uResolution;
uniform float uSize;
uniform vec3 uColor;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform sampler2D uParticlesTexture;

attribute vec2 aParticlesUv;
attribute float aSize;
attribute vec3 aColor;

varying vec3 vColor;

void main()
{
    vec4 particle = texture2D(uParticlesTexture, aParticlesUv);

    vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uSize * aSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    vec3 base = mix(uColorA, uColor, smoothstep(0.0, 0.5, aColor.r));
    base = mix(base, uColorB, smoothstep(0.5, 1.0, aColor.r));

    vec3 colorDark = base * 0.75;
    vec3 colorLight = mix(base, vec3(1.0), 0.15);
    vColor = mix(colorDark, colorLight, particle.a);
}
