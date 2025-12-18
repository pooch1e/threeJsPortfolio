uniform vec2 uResolution;
uniform sampler2D uPictureTexture;

// Varyings
varying vec3 vColor;

void main()
{

     // Picture
    float pictureIntensity = texture2D(uPictureTexture, uv).r;
    

    // Final position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;



    // Point size
    gl_PointSize = 0.015 * pictureIntensity * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    vColor = vec3(pow(pictureIntensity, 2.0));
}