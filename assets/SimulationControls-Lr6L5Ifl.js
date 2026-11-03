import{c as t,u as i,j as a}from"./index-CsEklMlf.js";import{i as o}from"./runtime-CxJkH8d1.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=t("Pause",[["rect",{x:"14",y:"4",width:"4",height:"16",rx:"1",key:"zuxfzm"}],["rect",{x:"6",y:"4",width:"4",height:"16",rx:"1",key:"1okwgv"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=t("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=t("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=t("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);function m({transactions:s=!1}){const e=i();return a.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[a.jsxs("span",{className:"mr-1 flex items-center gap-1.5 text-xs text-muted",children:[a.jsx("span",{className:`h-1.5 w-1.5 rounded-full ${e.simulationRunning?"animate-pulse bg-success":"bg-gold"}`}),"SIMULATION"]}),a.jsxs("button",{"aria-label":e.simulationRunning?"Pause fleet simulation":"Play fleet simulation",onClick:()=>e.setSimulationRunning(!e.simulationRunning),className:"flex items-center gap-1.5 rounded border-[0.5px] border-edge bg-surface px-2 py-1.5 text-sm",children:[e.simulationRunning?a.jsx(l,{"aria-hidden":!0,size:11}):a.jsx(r,{"aria-hidden":!0,size:11})," ",e.simulationRunning?"Pause":"Play"]}),a.jsxs("select",{"aria-label":"Fleet simulation speed",className:"!px-2 !py-1.5 !text-sm",value:e.simulationSpeed,onChange:n=>e.setSimulationSpeed(Number(n.target.value)),children:[a.jsx("option",{value:1,children:"1× speed"}),a.jsx("option",{value:4,children:"4× speed"}),a.jsx("option",{value:12,children:"12× speed"})]}),a.jsx("button",{"aria-label":"Restart fleet routes",className:"rounded border-[0.5px] border-edge bg-surface p-1.5 text-muted",onClick:e.resetFleet,children:a.jsx(u,{"aria-hidden":!0,size:12})}),s&&o&&a.jsxs("button",{"aria-label":e.autoTransactions?"Stop transaction demo":"Run transaction demo",onClick:()=>e.setAutoTransactions(!e.autoTransactions),className:`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${e.autoTransactions?"bg-gold/10 text-gold":"bg-noir text-gold"}`,children:[a.jsx(d,{"aria-hidden":!0,size:11}),e.autoTransactions?"Demo running · stop":"Run transaction demo"]})]})}export{m as S};
