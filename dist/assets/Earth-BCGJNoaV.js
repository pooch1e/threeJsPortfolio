import{n,d as a,S as s,U as e,C as t,h as r,M as i,e as h,I as l,m as u,i as m}from"./index-FcQRNp8M.js";var c=`varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    
    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    
    vUv = uv;
    vNormal = modelNormal;
    vPosition = modelPosition.xyz;
}`,p=`varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    
    vec3 color = vec3(0.0);

    

    
    float sunOrientation = dot(uSunDirection, normal);
    float dayMix = smoothstep(-0.25, 0.5, sunOrientation);

    
    
    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
    color = mix(nightColor, dayColor, dayMix);

    
    vec2 cloudColor = texture2D(uSpecularCloudsTexture, vUv).rg;
    float cloudsMix = cloudColor.g;
    cloudsMix = smoothstep(0.5, 1.0, cloudColor.g);

    cloudsMix *= dayMix; 

    color = mix(color, vec3(1.0), cloudsMix);

    
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);
    
    
    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);

    
    vec3 reflection = reflect(- uSunDirection, normal);
    float specular = - dot(reflection, viewDirection);
    specular = max(specular, 0.0);
    specular = pow(specular, 32.0);

    specular *= cloudColor.r;
    

    vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);
    color += specular * specularColor;
    
    
    
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`,d=`varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    
    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    
    vNormal = modelNormal;
    vPosition = modelPosition.xyz;
}`,v=`uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    
    float sunOrientation = dot(uSunDirection, normal);

    
    float atmosphereDayMix = smoothstep(- 0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    color = mix(color, atmosphereColor, atmosphereDayMix);

    
    float edgeAlpha = dot(viewDirection, normal);
    edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);

    
    float dayAlpha = smoothstep(- 0.5, 0.0, sunOrientation);

    float alpha = dayAlpha * edgeAlpha;

    
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;class y{constructor(o){this.world=o,this.scene=o.scene,this.debug=this.world.shaderExperience.debug,this.resources=o.resources,this.earthDayTexture=this.resources.items.earthTextures[0],this.earthDayTexture.colorSpace=n,this.earthDayTexture.anisotropy=6,this.earthNightTexture=this.resources.items.earthTextures[1],this.earthNightTexture.colorSpace=n,this.earthNightTexture.anisotropy=6,this.earthSpecularCloudTexture=this.resources.items.earthTextures[2],this.earthSpecularCloudTexture.anisotropy=6,this.earthParams={atmosphereDayColor:"#00aaff",atmosphereTwilightColor:"#ff6600"},this.setModel(),this.setAtmosphere(),this.setSun(),this.updateSun(),this.setDebug()}setModel(){this.sphereGeometry=new a(2,64,64),this.sphereMaterial=new s({vertexShader:c,fragmentShader:p,uniforms:{uDayTexture:new e(this.earthDayTexture),uNightTexture:new e(this.earthNightTexture),uSpecularCloudsTexture:new e(this.earthSpecularCloudTexture),uSunDirection:new e(new r(0,0,1)),uAtmosphereDayColor:new e(new t(this.earthParams.atmosphereDayColor)),uAtmosphereTwilightColor:new e(new t(this.earthParams.atmosphereTwilightColor))}}),this.earthMesh=new i(this.sphereGeometry,this.sphereMaterial),this.scene.add(this.earthMesh)}setAtmosphere(){this.atmosGeometry=new a(2,64,64),this.atmosMaterial=new s({side:h,transparent:!0,vertexShader:d,fragmentShader:v,uniforms:{uSunDirection:new e(new r(0,0,1)),uAtmosphereDayColor:new e(new t(this.earthParams.atmosphereDayColor)),uAtmosphereTwilightColor:new e(new t(this.earthParams.atmosphereTwilightColor))}}),this.atmosMesh=new i(this.atmosGeometry,this.atmosMaterial),this.atmosMesh.scale.set(1.04,1.04,1.04),this.scene.add(this.atmosMesh)}setSun(){this.debugSun=new i(new l(.1,2),new u),this.sunSpherical=new m(1,Math.PI*.5,.5),this.sunDirection=new r,this.scene.add(this.debugSun)}updateSun(){this.sunDirection&&(this.sunDirection.setFromSpherical(this.sunSpherical),this.debugSun.position.copy(this.sunDirection).multiplyScalar(5),this.sphereMaterial.uniforms.uSunDirection.value.copy(this.sunDirection),this.atmosMaterial.uniforms.uSunDirection.value.copy(this.sunDirection))}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Earth Shader"),this.debugFolder.add(this.sunSpherical,"phi").min(0).max(Math.PI).onChange(()=>this.updateSun()),this.debugFolder.add(this.sunSpherical,"theta").min(-Math.PI).max(Math.PI).onChange(()=>this.updateSun()),this.debugFolder.addColor(this.earthParams,"atmosphereDayColor").onChange(()=>{this.sphereMaterial.uniforms.uAtmosphereDayColor.value.set(this.earthParams.atmosphereDayColor),this.atmosMaterial.uniforms.uAtmosphereDayColor.value.set(this.earthParams.atmosphereDayColor)}),this.debugFolder.addColor(this.earthParams,"atmosphereTwilightColor").onChange(()=>{this.sphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(this.earthParams.atmosphereTwilightColor),this.atmosMaterial.uniforms.uAtmosphereTwilightColor.value.set(this.earthParams.atmosphereTwilightColor)}))}update(o){o&&this.sphereMaterial&&(this.earthMesh.rotation.y=o.elapsedTime*2e-4)}destroy(){this.mesh&&(this.scene.remove(this.mesh),this.geometry?.dispose(),this.sphereMaterial?.dispose()),this.debugFolder&&this.debugFolder.destroy()}}export{y as default};
