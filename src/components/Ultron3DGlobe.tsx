import React,{useEffect,useRef} from 'react';
import {useUltron} from '../core/ultronContext';
import {hexToRgba} from '../utils/colorLerp';
import {useDynamicRgbColor} from '../utils/dynamicRgb';

type P={x:number;y:number;z:number};
type E=[number,number];
export const Ultron3DGlobe:React.FC<{size?:number}>=({size=440})=>{
  const {status,audioAmplitude,isTyping}=useUltron(); const colors=useDynamicRgbColor(); const canvasRef=useRef<HTMLCanvasElement|null>(null); const statusRef=useRef(status); statusRef.current=status; const colorRef=useRef(colors); colorRef.current=colors;
  useEffect(()=>{const canvas=canvasRef.current,ctx=canvas?.getContext('2d',{alpha:true});if(!canvas||!ctx)return;const dpr=Math.min(window.devicePixelRatio||1,1.25);canvas.width=Math.floor(size*dpr);canvas.height=Math.floor(size*dpr);canvas.style.width=`${size}px`;canvas.style.height=`${size}px`;ctx.setTransform(dpr,0,0,dpr,0,0);
    const cx=size/2,cy=size/2,r=size*.35,golden=(1+Math.sqrt(5))/2,count=145,points:P[]=Array.from({length:count},(_,i)=>{const t=2*Math.PI*i/golden,p=Math.acos(1-(2*(i+.5))/count);return{x:r*Math.sin(p)*Math.cos(t),y:r*Math.cos(p),z:r*Math.sin(p)*Math.sin(t)}});
    const edges:E[]=[];const link=r*.62,link2=link*link;for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){const a=points[i],b=points[j],dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;if(dx*dx+dy*dy+dz*dz<link2)edges.push([i,j]);}
    const lats=8,longs=9,sats=5;let rx=.25,ry=0,targetX=.25,targetY=0,last=0,raf=0;
    const project=(p:P)=>{const cyy=Math.cos(ry),syy=Math.sin(ry),x=p.x*cyy+p.z*syy,z=-p.x*syy+p.z*cyy,cxx=Math.cos(rx),sxx=Math.sin(rx),y=p.y*cxx-z*sxx,zz=p.y*sxx+z*cxx,sc=360/(360+zz);return{x:cx+x*sc,y:cy+y*sc,z:zz,sc,a:Math.max(.08,Math.min(1,(zz+r*1.5)/(r*3)))};};
    const render=(now:number)=>{const dt=Math.min(40,now-(last||now));last=now;ctx.clearRect(0,0,size,size);const c=hexToRgba(colorRef.current.primary),s=statusRef.current,spin=s==='THINKING'?.015:s==='EXECUTING'?.011:s==='RESPONDING'?.008:.0035;ry+=spin*dt/16.67;rx+=(targetX-rx)*.08;ry+=(targetY-ry)*.02;
      const glow=ctx.createRadialGradient(cx,cy,r*.05,cx,cy,r*1.3);glow.addColorStop(0,`rgba(${c.r},${c.g},${c.b},.17)`);glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,r*1.3,0,Math.PI*2);ctx.fill();
      const pr=points.map(project);ctx.lineWidth=.7;for(const [i,j] of edges){const a=pr[i],b=pr[j];if(a.z<-r*.6||b.z<-r*.6)continue;const alpha=Math.min(a.a,b.a)*(s==='IDLE'?.16:.3);ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},${alpha})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      for(let i=1;i<lats;i++){const phi=Math.PI*i/lats,rr=r*Math.sin(phi),yy=r*Math.cos(phi);ctx.beginPath();for(let k=0;k<=24;k++){const t=2*Math.PI*k/24,p=project({x:rr*Math.cos(t),y:yy,z:rr*Math.sin(t)});k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},.13)`;ctx.stroke();}
      for(let i=0;i<longs;i++){const th=Math.PI*i/longs;ctx.beginPath();for(let k=0;k<=28;k++){const ph=2*Math.PI*k/28,p=project({x:r*Math.sin(ph)*Math.cos(th),y:r*Math.cos(ph),z:r*Math.sin(ph)*Math.sin(th)});k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},.12)`;ctx.stroke();}
      for(const p of pr){const n=(p.z>0?1.8:1)*p.sc;ctx.fillStyle=p.z>0?`rgba(255,255,255,${p.a})`:`rgba(${c.r},${c.g},${c.b},${p.a*.4})`;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.5,n),0,Math.PI*2);ctx.fill();}
      for(let i=0;i<sats;i++){const t=now*.00032*(i%2?-.75:1)+i*.9,sr=r*(1.18+(i%3)*.08),p=project({x:sr*Math.cos(t),y:sr*Math.sin(t)*.4,z:sr*Math.sin(t)*.86});ctx.fillStyle=`rgba(255,255,255,${Math.max(.2,p.a)})`;ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,Math.PI*2);ctx.fill();}
      const pulse=(s==='LISTENING'?audioAmplitude*20:(s==='THINKING'||s==='EXECUTING'?Math.sin(now*.006)*5:Math.sin(now*.0018)*1.2))*(isTyping?1.08:1),core=r*.29+pulse,cg=ctx.createRadialGradient(cx,cy,0,cx,cy,core);cg.addColorStop(0,'rgba(255,255,255,.95)');cg.addColorStop(.35,`rgba(${c.r},${c.g},${c.b},.9)`);cg.addColorStop(1,'transparent');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,Math.max(4,core),0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},.35)`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r*1.03,0,Math.PI*2);ctx.stroke();raf=requestAnimationFrame(render);};
    const move=(e:PointerEvent)=>{const b=canvas.getBoundingClientRect(),x=e.clientX-b.left-cx,y=e.clientY-b.top-cy;targetX=.25-y/size*.35;targetY=x/size*.45;};canvas.addEventListener('pointermove',move,{passive:true});raf=requestAnimationFrame(render);return()=>{cancelAnimationFrame(raf);canvas.removeEventListener('pointermove',move);};},[size]);
  return <canvas ref={canvasRef} className="block gpu-layer" aria-label="ULTRON neural globe"/>;
};
