#include ../includes/simplexNoise4d.glsl
attribute vec4 tangent;

uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uStrength;

float getWobble(vec3 position)
{
    return simplexNoise4d(vec4(
        position * uPositionFrequency, // XYZ
        uTime * uTimeFrequency          // W
    )) * uStrength;
}

void main(){
  // Compute crossproduct
  vec3 biTangent = cross(normal, tangent.xyz);

  // Work out neighbours
  // Neighbour Pos
  float shift = 0.001;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  // Wobble 
  // Use vec 3 vertex (first 3) of simplex noise to calculate height of vertex, use the 4th value to calculate change over time
  float wobble = getWobble(csm_Position);

  csm_Position += wobble * normal;
  positionA    += getWobble(positionA) * normal;
  positionB    += getWobble(positionB) * normal;

  // Compute normal
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB);
}