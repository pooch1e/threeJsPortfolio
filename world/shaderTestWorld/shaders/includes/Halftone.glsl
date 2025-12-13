vec3 halftone(
    vec3 color,
    float repetitions,
    vec3 direction,
    float low,
    float high,
    vec3 pointColor,
    vec3 normal
)
{
    // color = base color
  // repititions = repitions of uv
  // direction = direction of neighbours to calc norms
  // high, low = 
  // intensity =
  // pointColor = color of point inside uv grid
  // normal = direction vertex is facing

    float intensity = dot(normal, direction);
    intensity = smoothstep(low, high, intensity);

// GRID
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    uv *= repetitions;
    uv = mod(uv, 1.0);

// POINT INSIDE GRID
    float point = distance(uv, vec2(0.5));
    point = 1.0 - step(0.5 * intensity, point);

    // color = mix(color, pointColor, point);
    return mix(color, pointColor, point);
}

