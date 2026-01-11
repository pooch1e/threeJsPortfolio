
#include ../includes/simplexNoise4d.glsl

uniform float uTime;
uniform sampler2D uBase;
uniform float uDeltaTime;
void main() {

  float time = uTime * 0.002;

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 particle = texture2D(uParticles, uv);
  vec4 base = texture2D(uBase, uv);
  
   // Dead
    if(particle.a >= 1.0)
    {
        particle.a = mod(particle.a, 1.0);
        particle.a = 0.0;
        particle.xyz = base.xyz;
    }
    // Alive
    else
    {
  // Flow field
    vec3 flowField = vec3(
      simplexNoise4d(vec4(particle.xyz, time)), simplexNoise4d(vec4(particle.xyz, time)), simplexNoise4d(vec4(particle.xyz, time))
      );
    flowField = normalize(flowField);
    

    // Decay
    particle.a * uDeltaTime * 0.3;

    // Strength
    float strength = simplexNoise4d(vec4(base.xyz, time + 1.0));
    strength = smoothstep(- 1.0, 1.0, strength);
    particle.xyz += flowField * uDeltaTime * strength * 0.001;

    }
  gl_FragColor = particle;
}
