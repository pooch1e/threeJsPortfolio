uniform vec2 uResolution;
uniform float uSize;
uniform sampler2D uParticlesTexture;

attribute vec2 aParticlesUv;
attribute float aSize;

varying vec3 vColor;

void main()
{
    // Get particle position from GPGPU texture
    vec4 particle = texture2D(uParticlesTexture, aParticlesUv);
    
    // Final position
    vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = uSize * aSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    vColor = vec3(1.0);
}