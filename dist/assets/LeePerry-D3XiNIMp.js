import{c as i,M as a,P as o}from"./index-FcQRNp8M.js";class l{constructor(e){this.world=e,this.scene=e.scene,this.debug=this.world.shaderExperience.debug,this.environment=this.world.environment,this.resources=this.world.resources,this.customUniforms={uTime:{value:0}},this.resource=this.resources.items.leePerryModel,this.setModel(),this.setPlane(),this.setDebug()}setModel(){this.model=this.resource.scene,this.material=this.model.material,this.model.scale.set(.2,.2,.2);const e=this.resources.items.leePerryColor,r=this.resources.items.leePerryNormal;this.model.traverse(s=>{s.isMesh&&(s.material=new i({map:e,normalMap:r}),s.material.onBeforeCompile=t=>{t.uniforms.uTime=this.customUniforms.uTime,t.vertexShader=t.vertexShader.replace("#include <common>",`
            #include <common>
            uniform float uTime;

            mat2 get2dRotateMatrix(float _angle)
            {
                return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
            }
            `),t.vertexShader=t.vertexShader.replace("#include <begin_vertex>",`
            #include <begin_vertex>
            
            float angle = position.y + uTime;
            mat2 rotateMatrix = get2dRotateMatrix(angle);
            transformed.xz = rotateMatrix * transformed.xz;
            `)})}),this.environment&&this.environment.environmentMap&&this.environment.environmentMap.updateMaterials(),this.scene.add(this.model)}setPlane(){this.plane=new a(new o(15,15,15),new i),this.plane.rotation.y=Math.PI,this.plane.position.y=0,this.plane.position.z=5,this.scene.add(this.plane)}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Lee Perry GUI"),this.debugFolder.add(this.customUniforms.uTime,"value").min(0).max(2).step(.01).name("uTime"))}destroy(){this.model&&(this.scene.remove(this.model),this.model.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),e.material&&(e.material.map&&e.material.map.dispose(),e.material.normalMap&&e.material.normalMap.dispose(),e.material.dispose()))})),this.plane&&(this.scene.remove(this.plane),this.plane.geometry?.dispose(),this.plane.material?.dispose()),this.debugFolder&&this.debug.ui.destroy()}update(e){e&&e.elapsedTime!==void 0&&(this.customUniforms.uTime.value=e.elapsedTime*.002)}}export{l as default};
