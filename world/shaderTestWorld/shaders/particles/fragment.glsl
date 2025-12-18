void main()
{

    // Points
    vec2 uv = gl_PointCoord;

    gl_FragColor = vec4(uv, 1.0, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}