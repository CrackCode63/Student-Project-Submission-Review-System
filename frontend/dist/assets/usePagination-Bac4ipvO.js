import{c as l,j as t,r as c}from"./index-nWYP9pDr.js";import{B as o}from"./Button-BAgEhZZa.js";import{p as m,c as h}from"./formatters-D49WsCjC.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=l("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=l("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function j({currentPage:s,totalPages:e,onPageChange:a}){return e<=1?null:t.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[t.jsxs("p",{className:"text-sm text-slate-500 dark:text-slate-300",children:["Page ",s," of ",e]}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsxs(o,{variant:"secondary",size:"sm",onClick:()=>a(s-1),disabled:s===1,children:[t.jsx(x,{className:"h-4 w-4"}),"Previous"]}),t.jsxs(o,{variant:"secondary",size:"sm",onClick:()=>a(s+1),disabled:s===e,children:["Next",t.jsx(d,{className:"h-4 w-4"})]})]})]})}function v(s,e=6){const[a,n]=c.useState(1),i=Math.max(1,Math.ceil(s.length/e));c.useEffect(()=>{n(1)},[s.length,e]);const r=h(a,1,i);return{currentPage:r,totalPages:i,setPage:n,paginatedItems:m(s,r,e)}}export{j as P,v as u};
