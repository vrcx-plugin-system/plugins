(()=>{var f=Object.defineProperty;var d=(m,t)=>f(m,"name",{value:t,configurable:!0});const h=class h extends CustomModule{constructor(){super({name:"\u{1F4AC} Dialog API",description:"API for creating and showing custom dialogs in VRCX",authors:[{name:"Bluscream"}],tags:["API","Core","Dialog","Library"],dependencies:[]}),this.customDialogs=new Map,this.dialogContainers=new Map,this.dialogWrapperElement=null}async load(){this.logger.log("Dialog API ready"),this.loaded=!0}async start(){await this.setupDialogWrapper(),this.enabled=!0,this.started=!0,this.logger.log("Dialog API started")}async stop(){this.logger.log("Stopping Dialog API"),this.closeAllDialogs(),this.dialogWrapperElement&&this.dialogWrapperElement.parentNode&&this.dialogWrapperElement.parentNode.removeChild(this.dialogWrapperElement),await super.stop()}async setupDialogWrapper(){return new Promise(t=>{const e=d(()=>{this.dialogWrapperElement=document.createElement("div"),this.dialogWrapperElement.id="customjs-dialog-wrapper",this.dialogWrapperElement.style.cssText="position: relative; z-index: 2000;",(document.querySelector("#app")||document.body).appendChild(this.dialogWrapperElement),this.logger.log("Dialog wrapper created"),t()},"createWrapper");document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()})}registerDialog(t,e){this.customDialogs.has(t)&&this.logger.warn(`Dialog ${t} already exists, overwriting`);const o={id:t,visible:!1,title:e.title||"Custom Dialog",width:e.width||"600px",content:e.content||"",showClose:e.showClose!==!1,closeOnClickModal:e.closeOnClickModal!==!1,closeOnPressEscape:e.closeOnPressEscape!==!1,fullscreen:e.fullscreen||!1,top:e.top||"15vh",modal:e.modal!==!1,draggable:e.draggable||!1,footer:e.footer,beforeClose:e.beforeClose,onOpen:e.onOpen,onClose:e.onClose};return this.customDialogs.set(t,o),this.logger.log(`Registered dialog: ${t}`),this.createDialogController(t)}createDialogController(t){return{show:()=>this.showDialog(t),hide:()=>this.closeDialog(t),toggle:()=>this.toggleDialog(t),setTitle:e=>this.setDialogTitle(t,e),setContent:e=>this.setDialogContent(t,e),isVisible:()=>this.isDialogVisible(t),destroy:()=>this.destroyDialog(t)}}showDialog(t){const e=this.customDialogs.get(t);if(!e)return this.logger.error(`Dialog ${t} not found`),!1;if(e.visible)return this.logger.warn(`Dialog ${t} is already visible`),!1;if(e.onOpen)try{e.onOpen()}catch(o){this.logger.error(`Error in onOpen callback for ${t}:`,o)}return this.renderDialog(t),e.visible=!0,this.logger.log(`Showing dialog: ${t}`),!0}closeDialog(t){const e=this.customDialogs.get(t);if(!e)return this.logger.error(`Dialog ${t} not found`),!1;if(!e.visible)return!1;if(e.beforeClose)try{if(e.beforeClose()===!1)return!1}catch(s){this.logger.error(`Error in beforeClose callback for ${t}:`,s)}e.visible=!1;const o=this.dialogContainers.get(t);if(o&&(o.style.display="none"),e.onClose)try{e.onClose()}catch(s){this.logger.error(`Error in onClose callback for ${t}:`,s)}return this.logger.log(`Closed dialog: ${t}`),!0}toggleDialog(t){const e=this.customDialogs.get(t);if(!e){this.logger.error(`Dialog ${t} not found`);return}e.visible?this.closeDialog(t):this.showDialog(t)}setDialogTitle(t,e){const o=this.customDialogs.get(t);if(!o){this.logger.error(`Dialog ${t} not found`);return}if(o.title=e,o.visible){const s=this.dialogContainers.get(t);if(s){const l=s.querySelector(".dialog-title");l&&(l.textContent=e)}}}setDialogContent(t,e){const o=this.customDialogs.get(t);if(!o){this.logger.error(`Dialog ${t} not found`);return}if(o.content=e,o.visible){const s=this.dialogContainers.get(t);if(s){const l=s.querySelector(".dialog-body");l&&(typeof e=="string"?l.innerHTML=e:e instanceof HTMLElement&&(l.innerHTML="",l.appendChild(e)))}}}isDialogVisible(t){const e=this.customDialogs.get(t);return e?e.visible:!1}destroyDialog(t){this.closeDialog(t);const e=this.dialogContainers.get(t);e&&e.parentNode&&e.parentNode.removeChild(e),this.dialogContainers.delete(t),this.customDialogs.delete(t),this.logger.log(`Destroyed dialog: ${t}`)}renderDialog(t){const e=this.customDialogs.get(t);if(!e||!this.dialogWrapperElement)return;let o=this.dialogContainers.get(t);if(o||(o=document.createElement("div"),o.className="customjs-dialog-container",o.setAttribute("data-dialog-id",t),this.dialogWrapperElement.appendChild(o),this.dialogContainers.set(t,o)),o.innerHTML="",o.style.display=e.visible?"block":"none",e.modal){const i=document.createElement("div");i.className="el-overlay",i.style.cssText="z-index: 2000;";const c=document.createElement("div");c.className="el-overlay-dialog",e.closeOnClickModal&&this.registerListener(c,"click",()=>{this.closeDialog(t)}),i.appendChild(c),o.appendChild(i)}const s=document.createElement("div");s.className="el-dialog__wrapper",s.style.cssText=`
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: auto;
      margin: 0;
      z-index: 2001;
      display: flex;
      align-items: ${e.fullscreen?"stretch":"center"};
      justify-content: center;
    `;const l=document.createElement("div");l.className="el-dialog x-dialog customjs-dialog",l.style.cssText=`
      position: relative;
      margin: ${e.fullscreen?"0":e.top+" auto 50px"};
      background: #2a2a2a;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      box-sizing: border-box;
      width: ${e.fullscreen?"100%":e.width};
      height: ${e.fullscreen?"100%":"auto"};
      max-width: ${e.fullscreen?"100%":"calc(100% - 30px)"};
      ${e.draggable?"cursor: move;":""}
    `;const n=document.createElement("div");n.className="el-dialog__header",n.style.cssText=`
      padding: 15px 20px;
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #404040;
    `;const a=document.createElement("span");if(a.className="el-dialog__title dialog-title",a.style.cssText="color: #e8e8e8; font-size: 18px; font-weight: 600;",a.textContent=e.title,n.appendChild(a),e.showClose){const i=document.createElement("button");i.className="el-dialog__headerbtn",i.style.cssText=`
        position: absolute;
        top: 15px;
        right: 20px;
        padding: 0;
        background: transparent;
        border: none;
        outline: none;
        cursor: pointer;
        font-size: 16px;
        color: #909399;
      `,i.innerHTML='<i class="el-icon el-dialog__close"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="width: 1em; height: 1em;"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></svg></i>',this.registerListener(i,"click",()=>{this.closeDialog(t)}),n.appendChild(i)}l.appendChild(n);const g=document.createElement("div");if(g.className="el-dialog__body dialog-body",g.style.cssText="padding: 20px; color: #e8e8e8; font-size: 14px;",typeof e.content=="string"?g.innerHTML=e.content:e.content instanceof HTMLElement&&g.appendChild(e.content),l.appendChild(g),e.footer){const i=document.createElement("div");i.className="el-dialog__footer",i.style.cssText="padding: 10px 20px 15px; text-align: right; border-top: 1px solid #404040;",typeof e.footer=="string"?i.innerHTML=e.footer:e.footer instanceof HTMLElement&&i.appendChild(e.footer),l.appendChild(i)}if(e.draggable&&this.makeDraggable(l,n),e.closeOnPressEscape){const i=d(c=>{c.key==="Escape"&&e.visible&&this.closeDialog(t)},"escHandler");this.registerListener(document,"keydown",i)}s.appendChild(l),o.appendChild(s)}makeDraggable(t,e){let o=!1,s=0,l=0,n=0,a=0;const g=d(r=>{n=r.clientX-s,a=r.clientY-l,(r.target===e||e.contains(r.target))&&(o=!0)},"dragStart"),i=d(r=>{o&&(r.preventDefault(),s=r.clientX-n,l=r.clientY-a,t.style.transform=`translate(${s}px, ${l}px)`)},"drag"),c=d(()=>{o=!1},"dragEnd");this.registerListener(e,"mousedown",g),this.registerListener(document,"mousemove",i),this.registerListener(document,"mouseup",c)}closeAllDialogs(){for(const[t]of this.customDialogs)this.closeDialog(t)}getAllDialogIds(){return Array.from(this.customDialogs.keys())}getDialog(t){return this.customDialogs.get(t)}};d(h,"DialogApiPlugin");let p=h;window.customjs.__LAST_PLUGIN_CLASS__=p;})();
