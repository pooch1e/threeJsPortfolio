https://threejs-journey.com/lessons/shader-patterns#pattern-46

# Pattern 1

```glsl
// Fragment.glsl
varying vec2 vUv;
// vUv from vertex.glsl

void main()
{
    gl_FragColor = vec4(vUv, 1.0, 1.0);
}
```

# Pattern 2

```glsl
// Fragment.glsl
varying vec2 vUv;
// vUv from vertex.glsl

varying vec2 vUv;

void main()
{
    gl_FragColor = vec4(vUv, 0.0, 1.0);
}
```

# Pattern 3

```glsl
varying vec2 vUv;

void main()
{
    gl_FragColor = vec4(vUv.x, vUv.x, vUv.x, 1.0);
}
```

# Pattern 4

```glsl
varying vec2 vUv;

void main()
{
    float strength = vUv.x;

    gl_FragColor = vec4(vec3(strength), 1.0);
}
```

# Pattern 5

float strength = 1.0 - vUv.y;

# Pattern 6

float strength = vUv.y \* 10.0;

# Pattern 7

Now we are talking. To repeat the gradient, we use a modulo. The modulo operation finds the remainder after a division of the first number by the second one.

0.5 modulo 1.0 will be 0.5
0.8 modulo 1.0 will be 0.8
1.2 module 1.0 will be 0.2
1.7 modulo 1.0 will be 0.7
2.0 modulo 1.0 will be 0.0
2.4 modulo 1.0 will be 0.4
It's like having the first number going back to 0 once it reaches the second number.

In many languages, we can use the % to apply the modulo but in GLSL we have to use the mod(...) function:

```glsl
float strength = mod(vUv.y * 10.0, 1.0);
```

# Pattern 8

float strength = mod(vUv.y \* 10.0, 1.0);
strength = step(0.5, strength);

# Pattern 9

float strength = mod(vUv.y \* 10.0, 1.0);
strength = step(0.8, strength);

# Pattern 10

float strength = mod(vUv.x \* 10.0, 1.0);
strength = step(0.8, strength);

# Pattern 11

float strength = step(0.8, mod(vUv.x _ 10.0, 1.0));
strength += step(0.8, mod(vUv.y _ 10.0, 1.0));

# Pattern 12

Uses same process but can only see intersections via multiplication intead of addition

float strength = step(0.8, mod(vUv.x _ 10.0, 1.0));
strength _= step(0.8, mod(vUv.y \* 10.0, 1.0));

# Pattern 13

float strength = step(0.4, mod(vUv.x _ 10.0, 1.0));
strength _= step(0.8, mod(vUv.y \* 10.0, 1.0));

# Pattern 15

Skipped 14 as roughly the same

```glsl
float barX = step(0.4, mod(vUv.x * 10.0 - 0.2, 1.0)) * step(0.8, mod(vUv.y * 10.0, 1.0));
float barY = step(0.8, mod(vUv.x * 10.0, 1.0)) * step(0.4, mod(vUv.y * 10.0 - 0.2, 1.0));
float strength = barX + barY;
```

# Pattern 21 - stepped values from 0 - 255 black to white

float strength = floor(vUv.x \* 10.0) / 10.0;

On x AND y axis
float strength = floor(vUv.x _ 10.0) / 10.0 _ floor(vUv.y \* 10.0) / 10.0;

# Pattern 22

Pseudo random cells/noise

```glsl
float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
```

```glsl
varying vec2 vUv;

float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main()
{
    // ...

    float strength = random(vUv);

    // ...
}
```

# Perlin noise

// Classic Perlin 2D Noise
// by Stefan Gustavson
//
vec2 fade(vec2 t)
{
return t*t*t*(t*(t\*6.0-15.0)+10.0);
}

float cnoise(vec2 P)
{
vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
vec4 ix = Pi.xzxz;
vec4 iy = Pi.yyww;
vec4 fx = Pf.xzxz;
vec4 fy = Pf.yyww;
vec4 i = permute(permute(ix) + iy);
vec4 gx = 2.0 _ fract(i _ 0.0243902439) - 1.0; // 1/41 = 0.024...
vec4 gy = abs(gx) - 0.5;
vec4 tx = floor(gx + 0.5);
gx = gx - tx;
vec2 g00 = vec2(gx.x,gy.x);
vec2 g10 = vec2(gx.y,gy.y);
vec2 g01 = vec2(gx.z,gy.z);
vec2 g11 = vec2(gx.w,gy.w);
vec4 norm = 1.79284291400159 - 0.85373472095314 _ vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
g00 _= norm.x;
g01 _= norm.y;
g10 _= norm.z;
g11 _= norm.w;
float n00 = dot(g00, vec2(fx.x, fy.x));
float n10 = dot(g10, vec2(fx.y, fy.y));
float n01 = dot(g01, vec2(fx.z, fy.z));
float n11 = dot(g11, vec2(fx.w, fy.w));
vec2 fade_xy = fade(Pf.xy);
vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
return 2.3 _ n_xy;
}

// Helper Function
vec4 permute(vec4 x)
{
return mod(((x*34.0)+1.0)*x, 289.0);
}

// Typical rotation function

vec2 rotate2D(vec2 value, float angle)
{
float s = sin(angle);
float c = cos(angle);
mat2 m = mat2(c, s, -s, c);
return m \* value;
}

// Minimum Vertex pattern needed

```glsl
void main() {

// Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
```

// Minimum Fragment pattern needed

```glsl
void main()
{
    // Final color
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}
```

// Generate random x, y
float random2D(vec2 value)
{
return fract(sin(dot(value.xy, vec2(12.9898,78.233))) \* 43758.5453123);
}

# Simplex Noise

// Simplex 3D Noise
// by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 \* r; }

float simplexNoise3d(vec3 v)
{
const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //  x0 = x0 - 0. + 0.0 * C
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    // Permutations
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients
    // ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );

}
