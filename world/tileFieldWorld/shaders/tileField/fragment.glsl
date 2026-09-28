uniform sampler2D uTexture;
uniform float uAlphaThreshold;

varying vec2 vUv;

void main()
{
    vec4 sprite = texture2D(uTexture, vUv);

    if (sprite.a < uAlphaThreshold) discard;

    gl_FragColor = sprite;

    // No tonemapping_fragment — see TileFieldExperience for why
    #include <colorspace_fragment>
}
