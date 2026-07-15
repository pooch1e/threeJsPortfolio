/**
 * Fragment shader for FlowerPoints. Discards pixels outside a circular mask
 * so each point renders as a soft circle instead of a square, and outputs
 * the per-vertex color computed in vertex.glsl.
 */
varying vec3 vColor;

void main()
{
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if(distanceToCenter > 0.5)
        discard;

    gl_FragColor = vec4(vColor, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
