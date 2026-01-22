#include ../includes/simplexNoise2d.glsl

float getElevation (vec2 position) {
  float uPositionFrequency = 0.2;
  float uStrength = 2.0;
  float elevation = 0.0;
  float uWarpFrequency = 5.0;
  float uWarpStrength = 0.5;

// not working yet
  // vec2 warpedPosition = position;
  // warpedPosition += simplexNoise2d(warpedPosition * uPositionFrequency * uWarpFrequency) * uWarpStrength;

  elevation += simplexNoise2d(position * uPositionFrequency) / 2.0;
  elevation += simplexNoise2d(position * uPositionFrequency * 2.0) / 4.0;
  elevation += simplexNoise2d(position * uPositionFrequency * 4.0) / 8.0;
  
  // crush elevation when near 0
  float elevationSign = sign(elevation); // will be +1 for pos value and -1 for neg value
  elevation = pow(abs(elevation), 2.0) * elevationSign;
  elevation *= uStrength;

  return elevation; 
}

void main() {
  // Calc neighbours
  float shift = 0.01;
  vec3 positionA = position.xyz + vec3(shift, 0.0, 0.0);
  vec3 positionB = position.xyz + vec3(0.0, 0.0, -shift);



// Elevation
float elevation = getElevation(csm_Position.xz);
csm_Position.y += elevation;
positionA.y    += getElevation(positionA.xz);
positionB.y    += getElevation(positionB.xz);

// compute normal
vec3 toA = normalize(positionA - csm_Position);
vec3 toB = normalize(positionB - csm_Position);
csm_Normal = cross(toA, toB);
}