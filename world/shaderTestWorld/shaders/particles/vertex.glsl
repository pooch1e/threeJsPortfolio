uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacementTexture;

// Varyings
varying vec3 vColor;

// Attributes
attribute float aIntensity;
attribute float aAngles;
// attribute vec2 uv;

void main()
{

     // Picture
    float pictureIntensity = texture2D(uPictureTexture, uv).r;

    // Displacement
    vec3 newPosition = position;
    float displacementIntensity = texture2D(uDisplacementTexture, uv).r; // elevation
    // smooth
    displacementIntensity = smoothstep(0.1, 1.0, displacementIntensity); // remove this for cool random effect when partciles settle

    vec3 displacementDirection = vec3(
        cos(aAngles) * 0.2,
        sin(aAngles) * 0.2,
        1.0
    );

    displacementDirection = normalize(displacementDirection);

    displacementDirection *= displacementIntensity;
    displacementDirection *= 3.0;
    displacementDirection *= aIntensity; // Random intensity affects displacement only
    newPosition += displacementDirection;

    

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;


    // Point size
    float sizeIn = smoothstep(0.0, 0.1, particle.a);
    float sizeOut = 1.0 - smoothstep(0.7, 1.0, particle.a);
    float size = min(sizeIn, sizeOut);

    gl_PointSize = size * aSize * uSize * uResolution.y;

    // Varyings
    vColor = vec3(pow(pictureIntensity, 2.0));
}