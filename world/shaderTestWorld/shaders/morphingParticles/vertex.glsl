uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;

// Attr
attribute vec3 aTargetPosition;

void main()
{

    // Mixed position
    
    vec3 mixedPosition = mix(position, aTargetPosition, uProgress);
    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
