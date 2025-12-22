import{a as l,C as a,B as n,S as c,U as r,A as p,b as g}from"./index-FcQRNp8M.js";var u=`uniform float uSize;
attribute float aScales;
attribute vec3 aRandomness;
varying vec3 vColor;
uniform float uTime;

void main() {
    
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    
    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
    
    angle += angleOffset;
    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;

    
    modelPosition.xyz += aRandomness;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /**
     * Size
     */
    gl_PointSize = uSize * aScales;
    gl_PointSize *= (1.0 / - viewPosition.z);

    /**
     * Varyings
     */
     vColor = color;
  
}`,f=`varying vec3 vColor;

void main() {
    
    

    
    

    
    
    
    

    
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength *= 2.0;
    strength = step(0.5, strength);
    strength = 1.0 - strength;

    
    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
}`;class v{constructor(s){this.world=s,this.scene=s.scene,this.debug=this.world.shaderExperience.debug,this.renderer=this.world.shaderExperience.renderer,this.params={count:5e3,size:30,radius:5,branches:3,spin:1,randomness:.5,randomnessPower:3,insideColor:"#ff6030",outsideColor:"#1b3984"},this.setShader(),this.setDebug()}setShader(){this.points&&(this.geometry.dispose(),this.material.dispose(),this.scene.remove(this.points)),this.geometry=new l,this.positions=new Float32Array(this.params.count*3),this.colors=new Float32Array(this.params.count*3),this.randomness=new Float32Array(this.params.count*3),this.scales=new Float32Array(this.params.count*1),this.insideColor=new a(this.params.insideColor),this.outsideColor=new a(this.params.outsideColor);for(let s=0;s<this.params.count;s++){const e=s*3,t=Math.random()*this.params.radius,o=s%this.params.branches/this.params.branches*Math.PI*2,h=Math.pow(Math.random(),this.params.randomnessPower)*(Math.random()<.5?1:-1)*this.params.randomness*t,d=Math.pow(Math.random(),this.params.randomnessPower)*(Math.random()<.5?1:-1)*this.params.randomness*t,m=Math.pow(Math.random(),this.params.randomnessPower)*(Math.random()<.5?1:-1)*this.params.randomness*t;this.positions[e]=Math.cos(o)*t,this.positions[e+1]=0,this.positions[e+2]=Math.sin(o)*t,this.randomness[e]=h,this.randomness[e+1]=d,this.randomness[e+2]=m;const i=this.insideColor.clone();i.lerp(this.outsideColor,t/this.params.radius),this.colors[e]=i.r,this.colors[e+1]=i.g,this.colors[e+2]=i.b,this.scales[s]=Math.random()}this.geometry.setAttribute("position",new n(this.positions,3)),this.geometry.setAttribute("color",new n(this.colors,3)),this.geometry.setAttribute("aScales",new n(this.scales,1)),this.geometry.setAttribute("aRandomness",new n(this.randomness,3)),this.material=new c({vertexShader:u,fragmentShader:f,depthWrite:!1,blending:p,vertexColors:!0,uniforms:{uSize:new r(30*this.renderer.renderer.getPixelRatio()),uTime:new r(0)}}),this.points=new g(this.geometry,this.material),this.scene.add(this.points)}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Galaxy UI"),this.debugFolder.add(this.params,"count").min(100).max(1e6).step(100).onFinishChange(()=>this.setShader()),this.debugFolder.add(this.params,"size").min(1).max(100).step(.1).onFinishChange(()=>this.setShader()),this.debugFolder.add(this.params,"radius").min(.01).max(20).step(.01).onFinishChange(()=>this.setShader()),this.debugFolder.add(this.params,"branches").min(2).max(20).step(1).onFinishChange(()=>this.setShader()),this.debugFolder.add(this.params,"randomness").min(0).max(2).step(.001).onFinishChange(()=>this.setShader()),this.debugFolder.add(this.params,"randomnessPower").min(1).max(10).step(.001).onFinishChange(()=>this.setShader()),this.debugFolder.addColor(this.params,"insideColor").onFinishChange(()=>this.setShader()),this.debugFolder.addColor(this.params,"outsideColor").onFinishChange(()=>this.setShader()))}update(s){s&&(this.material.uniforms.uTime.value=s.elapsedTime*.002)}destroy(){this.points&&(this.geometry.dispose(),this.material.dispose(),this.scene.remove(this.points)),this.debugFolder&&this.debugFolder.destroy()}}export{v as default};
