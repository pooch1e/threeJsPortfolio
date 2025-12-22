import{P as i,S as a,V as o,B as r,M as s}from"./index-FcQRNp8M.js";var d=`uniform vec2 uFrequency;
uniform float uTime;

attribute float aRandom;
varying float vRandom;
varying vec2 vUv;

void main()
{
    vec4 modelPosition = vec4(position, 1.0);
    modelPosition.z += sin(modelPosition.x * uFrequency.x + uTime) * 0.1;
    modelPosition.z += sin(modelPosition.y * uFrequency.y + uTime) * 0.1;
    
    vRandom = aRandom;
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * modelPosition;
}`,v=`varying float vRandom;
varying vec2 vUv;
uniform float uAlpha;
uniform float uMix;

vec4 permute(vec4 x)
{
    return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t)
{
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec2 P)
{
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); 
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; 
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

void main()
{
    
    float strength = step(0.9, sin(cnoise(vUv * 10.0) * 20.0));
    
    vec3 black = vec3(0.0);
    vec3 color = vec3(vUv, uMix);
    vec3 colorMix = mix(black, color, strength);
    gl_FragColor = vec4(colorMix, uAlpha);
}`;class l{constructor(e){this.world=e,this.scene=this.world.scene,this.debug=this.world.shaderExperience.debug,this.setShader(),this.setDebug()}setShader(){this.geometry=new i(1,1,50,50),this.shaderMaterial=new a({vertexShader:d,fragmentShader:v,transparent:!0,uniforms:{uFrequency:{value:new o(10,5)},uTime:{value:0},uAlpha:{value:1},uMix:{value:1}}});const e=this.geometry.attributes.position.count,t=new Float32Array(e);for(let n=0;n<e;n++)t[n]=Math.random();this.geometry.setAttribute("aRandom",new r(t,1)),this.mesh=new s(this.geometry,this.shaderMaterial),this.scene.add(this.mesh)}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Shader GUI"),this.debugFolder.add(this.shaderMaterial.uniforms.uFrequency.value,"x").min(0).max(20).step(.01).name("frequencyX"),this.debugFolder.add(this.shaderMaterial.uniforms.uFrequency.value,"y").min(0).max(20).step(.01).name("frequencyY"),this.debugFolder.add(this.shaderMaterial.uniforms.uAlpha,"value").min(0).max(1).step(.01).name("Alpha"),this.debugFolder.add(this.shaderMaterial.uniforms.uMix,"value").min(0).max(1).step(.001).name("Mix"))}update(e){e&&(this.shaderMaterial.uniforms.uTime.value=e.elapsedTime*.002)}destroy(){this.mesh&&(this.scene.remove(this.mesh),this.geometry?.dispose(),this.shaderMaterial?.dispose()),this.debugFolder&&this.debugFolder.destroy()}}export{l as default};
