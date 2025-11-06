precision mediump float;


out vec4 fragColor;
in float vRandom;
void main() {

  fragColor = vec4(0.5, vRandom, 1.0, 1.0);
}
