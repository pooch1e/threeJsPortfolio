import{P as o,S as t,U as e,C as i,V as a,M as l}from"./index-FcQRNp8M.js";var r=`uniform float uWaveSpeed;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

vec4 permute(vec4 x)
{
    return mod(((x*34.0)+1.0)*x, 289.0);
}
vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - 0.85373472095314 * r;
}
vec3 fade(vec3 t)
{
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float perlinClassic3D(vec3 P)
{
    vec3 Pi0 = floor(P); 
    vec3 Pi1 = Pi0 + vec3(1.0); 
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); 
    vec3 Pf1 = Pf0 - vec3(1.0); 
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
}
uniform float uBigWavesElevation;
uniform vec2 uBigWavesFrequency;
uniform float uTime;
uniform float uBigWavesSpeed;

uniform float uSmallIterations;
uniform float uSmallWavesElevation;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;

float waveElevation(vec3 position)
{
    float elevation = sin(position.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) *
                      sin(position.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) *
                      uBigWavesElevation;

    for(float i = 1.0; i <= uSmallIterations; i++)
    {
        elevation -= abs(perlinClassic3D(vec3(position.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
    }
    
    return elevation;
}

void main()
{

    
    float shift = 0.04;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 modelPositionA = modelPosition.xyz + vec3(shift, 0.0, 0.0);
    vec3 modelPositionB = modelPosition.xyz + vec3(0.0, 0.0, - shift);

    
    float elevation = waveElevation(modelPosition.xyz);

    
    modelPosition.y += elevation;
    modelPositionA.y += waveElevation(modelPositionA);
    modelPositionB.y += waveElevation(modelPositionB);

    
    vec3 toA = normalize(modelPositionA - modelPosition.xyz);
    vec3 toB = normalize(modelPositionB - modelPosition.xyz);
    vec3 computedNormal = cross(toA, toB);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;

    
    vElevation = elevation;
    vNormal = computedNormal;
    vPosition = modelPosition.xyz;
}`,s=`uniform vec3 uDepthColour;
uniform vec3 uSurfaceColour;

uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

vec3 specularLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower) {

  vec3 lightDirection = normalize(lightPosition);

  float shading = dot(normal, lightDirection);
  
  shading = clamp(shading, 0.0, 1.0);

  vec3 reflection = reflect(-lightDirection, normal);

  
  float specular = dot(reflection, viewDirection);
  specular = max(0.0, specular); 
  specular = pow(specular, specularPower); 

  return lightColor * lightIntensity * (shading + specular);

}
vec3 pointLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower, vec3 position, float lightDecay) {

  
  vec3 lightDelta = lightPosition - position;
  vec3 lightDirection = normalize(lightDelta);
  float lightDistance = length(lightDelta);

  float shading = dot(normal, lightDirection);
  
  shading = clamp(shading, 0.0, 1.0);

  vec3 reflection = reflect(-lightDirection, normal);

  
  float specular = dot(reflection, viewDirection);
  specular = max(0.0, specular); 
  specular = pow(specular, specularPower); 

  float decay = 1.0 - lightDistance * lightDecay;
  decay = max(0.0, decay);
  return lightColor * lightIntensity * decay * (shading + specular);

}

void main()
{

    
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    
    
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    
    mixStrength = smoothstep(0.0, 1.0, mixStrength);

    vec3 color = mix(uDepthColour, uSurfaceColour, mixStrength);

        
    vec3 light = vec3(0);

    light += pointLight(
        vec3(1.0),            
        10.0,                 
        normal,               
        vec3(0.0, 0.25, 0.0), 
        viewDirection,        
        30.0,                 
        vPosition,            
        0.95                  
    );

    color *= light;
    
    
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
    #include <tonemapping_fragment>

}`;class g{constructor(n){this.world=n,this.scene=this.world.scene,this.debug=this.world.shaderExperience.debug,this.helper=this.world.helpers,this.debugObject={},this.debugObject.depthColor="#ff4000",this.debugObject.surfaceColor="#151c37",this.setShader(),this.setDebug()}setShader(){this.geometry=new o(2,2,512,512),this.shaderMaterial=new t({vertexShader:r,fragmentShader:s,uniforms:{uBigWavesElevation:new e(.2),uBigWavesFrequency:new e(new a(4,1.5)),uTime:new e(0),uWaveSpeed:new e(.75),uBigWavesSpeed:new e(.75),uSmallIterations:new e(4),uSmallWavesElevation:new e(.15),uSmallWavesFrequency:new e(3),uSmallWavesSpeed:new e(.2),uDepthColour:new e(new i(this.debugObject.depthColor)),uSurfaceColour:new e(new i(this.debugObject.surfaceColor)),uColorOffset:new e(.925),uColorMultiplier:new e(1)}}),this.geometry.deleteAttribute("normal"),this.mesh=new l(this.geometry,this.shaderMaterial),this.mesh.rotation.x=-Math.PI*.5,console.log(this.mesh.rotation.z),this.scene.add(this.mesh)}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Waves GUI"),this.debugFolder.add(this.shaderMaterial.uniforms.uBigWavesElevation,"value").min(0).max(1).step(.001),this.debugFolder.add(this.shaderMaterial.uniforms.uBigWavesFrequency.value,"x").min(0).max(10).step(.001).name("uBigWavesFrequencyX"),this.debugFolder.add(this.shaderMaterial.uniforms.uBigWavesFrequency.value,"y").min(0).max(10).step(.001).name("uBigWavesFrequencyY"),this.debugFolder.add(this.shaderMaterial.uniforms.uWaveSpeed,"value").min(0).max(4).step(.001).name("uWave Speed"),this.debugFolder.addColor(this.debugObject,"depthColor").onChange(()=>{this.shaderMaterial.uniforms.uDepthColour.value.set(this.debugObject.depthColor)}),this.debugFolder.addColor(this.debugObject,"surfaceColor").onChange(()=>{this.shaderMaterial.uniforms.uSurfaceColour.value.set(this.debugObject.surfaceColor)}),this.debugFolder.add(this.shaderMaterial.uniforms.uColorOffset,"value").min(0).max(1).step(.001).name("uColorOffset"),this.debugFolder.add(this.shaderMaterial.uniforms.uColorMultiplier,"value").min(0).max(10).step(.001).name("uColorMultiplier"))}update(n){n&&(this.shaderMaterial.uniforms.uTime.value=n.elapsedTime*.002)}destroy(){this.mesh&&(this.scene.remove(this.mesh),this.geometry?.dispose(),this.shaderMaterial?.dispose()),this.debugFolder&&this.debugFolder.destroy()}}export{g as default};
