uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;

// Attr
attribute vec3 aTargetPosition;
attribute float aSize;

//Varying
varying vec3 vColor;

// Includes
#include ../includes/simplexNoise.glsl

void main()
{

   // Noise and animation
    float noiseOrigin = simplexNoise3d(position * 0.2);
    float noiseTarget = simplexNoise3d(aTargetPosition * 0.2);

    float noise = mix(noiseOrigin, noiseTarget, uProgress);

    noiseOrigin = smoothstep(-1.0, 1.0, noiseOrigin);
    float duration = 0.4;
    float delay = (1.0 - duration) * noiseOrigin;
    float end = delay + duration;
    float progress = smoothstep(delay, end, uProgress);
    
     // Mixed position
    vec3 mixedPosition = mix(position, aTargetPosition, progress);

    

    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = aSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    vColor = vec3(noise);
    // Color
    vColor = mix(uColorA, uColorB, noise);
}
