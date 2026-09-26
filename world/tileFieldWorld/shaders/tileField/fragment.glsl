uniform sampler2D uTexture;
uniform float uAlphaThreshold;

varying vec2 vUv;

void main()
{
    vec4 sprite = texture2D(uTexture, vUv);

    if (sprite.a < uAlphaThreshold) discard;

    gl_FragColor = sprite;

    // No <tonemapping_fragment>: the renderer's Cineon curve lifts and
    // desaturates flat sprite colour, and this scene is a 2D blit
    #include <colorspace_fragment>
}
