import{d as t,S as s,U as i,A as o,V as n,b as r}from"./index-FcQRNp8M.js";var a=`uniform vec2 uResolution;
uniform float uSize;

void main()
{

    

    
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}`,l=`void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - 0.5);

    
    float alpha = 0.05 / distanceToCenter - 0.1;

    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;class c{constructor(e){this.world=e,this.scene=e.scene,this.resources=this.world.resources,this.sizes=this.world.shaderExperience.sizes,this.debug=this.world.shaderExperience.debug,this.particles={},this.models=this.resources.items.dracoModels,console.log(this.models),this.setParticles(),this.setModels(),this.setDebug()}setParticles(){this.particles.geometry=new t(3),this.particles.geometry.setIndex(null),this.positionArray=new Float32Array,this.particles.material=new s({vertexShader:a,fragmentShader:l,blending:o,depthWrite:!1,uniforms:{uSize:new i(.1),uResolution:new i(new n(this.sizes.width*this.sizes.pixelRatio,this.sizes.height*this.sizes.pixelRatio))}}),this.particles.points=new r(this.particles.geometry,this.particles.material),this.scene.add(this.particles.points)}setModels(){}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Particle Morph"))}update(e){}}export{c as default};
