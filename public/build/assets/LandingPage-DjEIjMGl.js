import{c as D,u as M,r as u,j as e,a as F,b as R,V as C,B as q,M as $,L as V,S as A,C as G}from"./index-Bsh6FCfj.js";import{M as _}from"./map-pin-B31EeBwC.js";import{B as L}from"./book-open-J3kh6o8s.js";import{G as Y,Z}from"./zap-3slmOG15.js";import{U as K}from"./users-DkmL4Seh.js";import{F as X}from"./file-text-BeoJT1JU.js";import{S as H}from"./shield-DASHGBL7.js";import{C as W}from"./calendar-D1ti-L-Y.js";import{S as J}from"./sparkles-DVllhrUs.js";import{G as Q}from"./graduation-cap-CbWMgx-B.js";import{C as ee}from"./check-CjZReAEi.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]],te=D("brain",se);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]],ie=D("chart-no-axes-column",ae);function ne(i){return i.toLocaleString("id-ID")}function le({tutor:i,onView:r,onBook:h}){var N,w;const{t:n}=M(),[j,t]=u.useState(!1),v=i.subject??i.subject_label??n("findTutor.subjectGeneral"),E=i.location??i.city??n("findTutor.online"),m=n("findTutor.experienceYears",{years:i.experience_years??0}),T=i.level_label??i.level??n("findTutor.allLevels"),B=ne(i.price??i.price_per_hour??0),p=i.online??i.mode_online??!1,b=i.mode_offline??!1,y=n(p&&b?"findTutor.modeOnlineOffline":p?"findTutor.online":b?"findTutor.offline":"findTutor.modeUnknown"),g=i.badge??(i.verified?n("findTutor.topTutor"):null);return e.jsxs("div",{className:"bg-white p-3",children:[e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("div",{className:"relative shrink-0",children:[i.photo&&!j?e.jsx("img",{src:i.photo,onError:()=>t(!0),alt:i.name,className:"w-[72px] h-[72px] rounded-lg object-cover bg-gray-200"}):e.jsx("div",{className:`
                w-[72px]
                h-[72px]
                rounded-lg
                bg-blue-600
                text-white
                flex
                items-center
                justify-center
                text-2xl
                font-bold
              `,children:((w=(N=i.name)==null?void 0:N.charAt(0))==null?void 0:w.toUpperCase())||"T"}),p&&e.jsx("span",{className:"absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"})]}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex justify-between items-start gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("h3",{className:"font-semibold text-[18px] leading-tight text-gray-900 truncate",children:i.name}),e.jsx("p",{className:"text-sm text-slate-500 mt-1 truncate",children:v})]}),g&&e.jsx("span",{className:"text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 whitespace-nowrap",children:g})]}),e.jsxs("div",{className:"flex items-center gap-1 mt-2",children:[e.jsx(F,{size:14,className:"fill-yellow-400 text-yellow-400"}),e.jsx("span",{className:"text-sm font-medium text-gray-900",children:i.rating??0}),e.jsxs("span",{className:"text-sm text-gray-500",children:["(",i.reviews??0,")"]})]})]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-4 mt-3 pb-3 border-b border-gray-100 text-xs text-gray-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(_,{size:12}),e.jsx("span",{children:E})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(R,{size:12}),e.jsx("span",{children:m})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(L,{size:12}),e.jsx("span",{children:T})]}),e.jsx("div",{className:"flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-700",children:y})]}),e.jsxs("div",{className:"mt-3 flex justify-between items-center gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-lg font-bold text-gray-900",children:["Rp ",B]}),e.jsx("span",{className:"text-[10px] text-gray-500 ml-1",children:n("findTutor.perSession")})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:r,className:`
              h-8
              px-3
              text-xs
              border
              border-gray-300
              rounded-md
              text-gray-700
              hover:bg-gray-50
              transition
            `,children:n("findTutor.viewProfile")}),e.jsx("button",{onClick:h,className:`
              h-8
              px-3
              text-xs
              rounded-md
              bg-blue-600
              text-white
              hover:bg-blue-700
              transition
            `,children:n("findTutor.bookButton")})]})]})]})}function je({navigate:i,platformStats:r,tutors:h,user:n,onSelectTutor:j}){const{t}=M(),[v,E]=u.useState([]),[m,T]=u.useState(null);u.useEffect(()=>{(async()=>{try{const a="https://rezi-laravel.nlabs.id/api".replace(/\/api\/?$/,"")??"https://rezi-laravel.nlabs.id",d=await(await fetch(`${a}/api/website/ratings`)).json();if(d.data&&d.data.length>0){const f=d.data.map(l=>{const x=l.photo,O=x?x.startsWith("http")?x:`${a}/storage/${x}`:null;return{id:l.id,name:l.name,role:l.role,photo:O,text:l.text,rating:l.rating,created_at:l.created_at}}),c=f.filter(l=>l.rating===5).sort((l,x)=>!l.created_at||!x.created_at?0:new Date(x.created_at).getTime()-new Date(l.created_at).getTime()).slice(0,3);E(c),T({average:d.average??0,total:d.total??f.length})}}catch(a){console.error("Failed to fetch testimonials:",a)}})()},[]),u.useEffect(()=>{document.documentElement.style.scrollBehavior="smooth";const s={threshold:.1,rootMargin:"0px 0px -50px 0px"},a=c=>{c.forEach(l=>{l.isIntersecting&&(l.target.classList.add("animate-in","fade-in","duration-700"),o.unobserve(l.target))})},o=new IntersectionObserver(a,s);return document.querySelectorAll("section").forEach(c=>{c.style.opacity="0",o.observe(c)}),document.querySelectorAll("[class*='grid']").forEach(c=>{o.observe(c)}),()=>{o.disconnect()}},[]);const B=[{icon:e.jsx(Y,{size:24,className:"text-white"}),title:t("landing.feature1.title"),desc:t("landing.feature1.description"),gradient:"from-[#2563EB] to-[#1D4ED8]"},{icon:e.jsx(L,{size:24,className:"text-white"}),title:t("landing.feature2.title"),desc:t("landing.feature2.description"),gradient:"from-[#0EA5E9] to-[#0284C7]"},{icon:e.jsx(K,{size:24,className:"text-white"}),title:t("landing.feature3.title"),desc:t("landing.feature3.description"),gradient:"from-[#6366F1] to-[#4F46E5]"}],p=[{icon:e.jsx(C,{size:20}),title:t("landing.platformFeature1.title"),desc:t("landing.platformFeature1.description"),color:"#2563EB",bg:"#EFF6FF"},{icon:e.jsx(te,{size:20}),title:t("landing.platformFeature2.title"),desc:t("landing.platformFeature2.description"),color:"#0EA5E9",bg:"#F0F9FF"},{icon:e.jsx(_,{size:20}),title:t("landing.platformFeature3.title"),desc:t("landing.platformFeature3.description"),color:"#6366F1",bg:"#EEF2FF"},{icon:e.jsx(X,{size:20}),title:t("landing.platformFeature4.title"),desc:t("landing.platformFeature4.description"),color:"#0891B2",bg:"#ECFEFF"},{icon:e.jsx(H,{size:20}),title:t("landing.platformFeature5.title"),desc:t("landing.platformFeature5.description"),color:"#2563EB",bg:"#EFF6FF"},{icon:e.jsx(ie,{size:20}),title:t("landing.platformFeature6.title"),desc:t("landing.platformFeature6.description"),color:"#0EA5E9",bg:"#F0F9FF"},{icon:e.jsx(q,{size:20}),title:t("landing.platformFeature7.title"),desc:t("landing.platformFeature7.description"),color:"#6366F1",bg:"#EEF2FF"},{icon:e.jsx($,{size:20}),title:t("landing.platformFeature8.title"),desc:t("landing.platformFeature8.description"),color:"#0891B2",bg:"#ECFEFF"}],b=[{num:"01",icon:e.jsx(V,{size:18}),title:t("landing.step1.title"),desc:t("landing.step1.description"),color:"#2563EB"},{num:"02",icon:e.jsx(A,{size:18}),title:t("landing.step2.title"),desc:t("landing.step2.description"),color:"#0EA5E9"},{num:"03",icon:e.jsx(W,{size:18}),title:t("landing.step3.title"),desc:t("landing.step3.description"),color:"#6366F1"},{num:"04",icon:e.jsx(C,{size:18}),title:t("landing.step4.title"),desc:t("landing.step4.description"),color:"#0891B2"},{num:"05",icon:e.jsx(F,{size:18}),title:t("landing.step5.title"),desc:t("landing.step5.description"),color:"#2563EB"}],y=h.filter(s=>s.role==="tutor").length,g=s=>s>=1e3?`${s.toLocaleString("id-ID")}+`:s.toLocaleString("id-ID"),N=y>0?g(y):r!=null&&r.total_tutors?g(r.total_tutors):"—",w=r!=null&&r.total_students?g(r.total_students):"—",k=s=>{if(!s)return"";const a=s.trim().toLowerCase();return a.includes("sd")?"SD":a.includes("smp")||a.includes("mts")?"SMP/MTS":a.includes("sma")||a.includes("smk")?"SMA/SMK":a.includes("universitas")||a.includes("politeknik")||a.includes("mahasiswa")?"Universitas/Politeknik":s.trim()},I=s=>{const a=[...s.levels??[],...s.level_label?s.level_label.split("/").map(o=>o.trim()):[],...s.level?[s.level]:[]];return Array.from(new Set(a.filter(Boolean).map(k).filter(Boolean)))},z=(s=>{const a=k(s);return a==="SD"?"SD":a==="SMP/MTS"?"SMP/MTS":a==="SMA/SMK"?"SMA/SMK":a==="Universitas/Politeknik"?"Universitas/Politeknik":"Semua"})(n==null?void 0:n.education_level),U=[{val:N,label:t("landing.stats.tutors")},{val:w,label:t("landing.stats.students")},{val:"50+",label:t("landing.stats.cities")},{val:"95%",label:t("landing.stats.satisfaction")}],S=[...h].filter(s=>{const a=I(s);return z==="Semua"||a.includes(z)}).sort((s,a)=>(a.rating??0)-(s.rating??0)),P=S.length>0?S.slice(0,3):[...h].sort((s,a)=>(a.rating??0)-(s.rating??0)).slice(0,3);return e.jsxs("div",{className:"bg-white text-gray-900",style:{scrollBehavior:"smooth"},children:[e.jsx("style",{children:`
        html {
          scroll-behavior: smooth;
        }
        
        body {
          scroll-behavior: smooth;
        }
        
        .animate-in {
          animation: fadeInUp 0.7s ease-out forwards;
        }
        
        .fade-in {
          opacity: 0;
          animation: fadeInUp 0.7s ease-out forwards;
        }
        
        .duration-700 {
          animation-duration: 0.7s !important;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        section {
          transition: opacity 0.7s ease-out;
        }
        
        /* Smooth hover effects */
        button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        button:hover {
          transform: translateY(-2px);
        }
        
        /* Stagger animation for grid items */
        [class*='grid'] > * {
          animation: fadeInUp 0.6s ease-out both;
        }
        
        [class*='grid'] > *:nth-child(1) { animation-delay: 0.1s; }
        [class*='grid'] > *:nth-child(2) { animation-delay: 0.2s; }
        [class*='grid'] > *:nth-child(3) { animation-delay: 0.3s; }
        [class*='grid'] > *:nth-child(4) { animation-delay: 0.4s; }
        [class*='grid'] > *:nth-child(5) { animation-delay: 0.5s; }
        [class*='grid'] > *:nth-child(6) { animation-delay: 0.6s; }
        [class*='grid'] > *:nth-child(7) { animation-delay: 0.7s; }
        [class*='grid'] > *:nth-child(8) { animation-delay: 0.8s; }
      `}),e.jsxs("section",{className:"relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#F2F6FF] via-white to-[#EFF6FF]",children:[e.jsxs("div",{className:"absolute inset-0 pointer-events-none overflow-hidden",children:[e.jsx("div",{className:"absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#2563EB]/8 blur-[120px]"}),e.jsx("div",{className:"absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-[#0EA5E9]/10 blur-[100px]"}),e.jsxs("svg",{className:"absolute inset-0 w-full h-full opacity-[0.04]",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("defs",{children:e.jsx("pattern",{id:"dots",x:"0",y:"0",width:"24",height:"24",patternUnits:"userSpaceOnUse",children:e.jsx("circle",{cx:"2",cy:"2",r:"1.5",fill:"#2563EB"})})}),e.jsx("rect",{width:"100%",height:"100%",fill:"url(#dots)"})]})]}),e.jsxs("div",{className:"relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20 grid lg:grid-cols-2 gap-16 items-center",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-6",children:[e.jsx(J,{size:12}),t("landing.heroBadge")]}),e.jsxs("h1",{className:"text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6",children:[t("landing.heroTitleFirstPart")," "," ",e.jsx("span",{className:"text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#0EA5E9]",children:t("landing.heroTitleHighlightedPart")})]}),e.jsx("p",{className:"text-lg text-gray-500 mb-8 leading-relaxed max-w-lg",children:t("landing.heroDescription")}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3 mb-10",children:[e.jsxs("button",{onClick:()=>i("cari-tutor"),className:"flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] transition-colors text-base",children:[e.jsx(A,{size:18}),t("landing.heroCTA")]}),!n&&e.jsxs("button",{onClick:()=>i("login"),className:"flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm border border-gray-200 text-gray-600 hover:text-[#2563EB] hover:border-[#2563EB]/40 hover:bg-[#F2F6FF] font-semibold transition-colors text-base",children:[e.jsx(Q,{size:18}),t("landing.heroLogin")]})]}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-3 w-full",children:U.map(s=>e.jsxs("div",{className:"bg-white rounded-sm px-5 py-4 border border-gray-100 flex-1",children:[e.jsx("div",{className:"text-2xl font-extrabold text-[#2563EB]",children:s.val}),e.jsx("div",{className:"text-sm text-gray-400 mt-1",children:s.label})]},s.label))})]}),e.jsxs("div",{className:"hidden lg:block relative",children:[e.jsxs("div",{className:"relative rounded-sm overflow-hidden border border-gray-100",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop&auto=format",alt:t("landing.heroImageAlt"),className:"w-full h-80 object-cover"}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-white/30 to-transparent"})]}),e.jsxs("div",{className:"absolute -bottom-4 -left-8 bg-white rounded-sm p-4 border border-gray-100 flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-sm bg-[#DCFCE7] flex items-center justify-center",children:e.jsx(ee,{size:18,className:"text-[#16A34A]"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-semibold text-gray-800",children:t("landing.verifiedTutorTitle")}),e.jsx("div",{className:"text-xs text-gray-400",children:t("landing.verifiedTutorDescription")})]})]}),e.jsxs("div",{className:"absolute -top-4 -right-4 bg-white rounded-sm p-4 border border-gray-100",children:[e.jsx("div",{className:"flex items-center gap-1 mb-1",children:[1,2,3,4,5].map(s=>e.jsx(F,{size:12,fill:"#FBBF24",className:"text-[#FBBF24]"},s))}),e.jsx("div",{className:"text-sm font-semibold text-gray-800",children:m?t("landing.ratingScore",{score:m.average.toFixed(1)}):t("landing.noRatingScore")}),e.jsx("div",{className:"text-xs text-gray-400",children:m?t("landing.reviewCount",{count:m.total}):t("landing.noReviews")})]})]})]})]}),e.jsx("section",{className:"bg-white",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"flex justify-between items-start sm:items-center mb-10",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-3xl font-extrabold text-gray-900",children:t("landing.topTutorsTitle")}),e.jsx("p",{className:"text-gray-400 mt-1",children:t("landing.topTutorsDescription")})]}),e.jsxs("button",{onClick:()=>i("cari-tutor"),className:`
          flex
          items-center
          gap-1
          text-blue-600
          font-semibold
          text-sm
          whitespace-nowrap
          hover:text-blue-700
          transition-colors
        `,children:[t("landing.viewAll"),e.jsx(G,{size:16})]})]}),e.jsx("div",{className:`
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-8
      `,children:P.map(s=>e.jsx(le,{tutor:s,onView:()=>j(s),onBook:()=>{j(s),i("booking")}},s.id))})]})}),e.jsx("section",{className:"bg-[#F2F6FF]",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-12",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-4",children:[e.jsx(Z,{size:12}),t("landing.whyTitle")]}),e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:t("landing.whyTitle")}),e.jsx("p",{className:"text-gray-500 max-w-2xl",children:t("landing.whyDescription")})]}),e.jsx("div",{className:"grid sm:grid-cols-3 gap-6",children:B.map(s=>e.jsxs("div",{className:"bg-white border border-gray-100 rounded-sm p-6 hover:border-[#2563EB]/30 transition-colors duration-200",children:[e.jsx("div",{className:`w-14 h-14 rounded-sm bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5`,children:s.icon}),e.jsx("h3",{className:"text-lg font-bold text-gray-900 mb-2",children:s.title}),e.jsx("p",{className:"text-sm text-gray-500 leading-relaxed",children:s.desc})]},s.title))})]})}),e.jsx("section",{className:"bg-white",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-12",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:t("landing.platformFeaturesTitle")}),e.jsx("p",{className:"text-gray-500 max-w-2xl",children:t("landing.platformFeaturesDescription")})]}),e.jsx("div",{className:"grid sm:grid-cols-2 lg:grid-cols-4 gap-4",children:p.map(s=>e.jsxs("div",{className:"bg-white border border-gray-100 rounded-sm p-5 hover:border-[#2563EB]/25 transition-colors duration-200 cursor-default",children:[e.jsx("div",{className:"flex items-center gap-3 mb-3",children:e.jsx("div",{className:"w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0",style:{color:s.color,background:s.bg},children:s.icon})}),e.jsx("h4",{className:"text-sm font-semibold text-gray-900 mb-1",children:s.title}),e.jsx("p",{className:"text-xs text-gray-400 leading-relaxed",children:s.desc})]},s.title))})]})}),e.jsx("section",{className:"bg-[#F2F6FF]",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-14",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:t("landing.stepsTitle")}),e.jsx("p",{className:"text-gray-500",children:t("landing.stepsDescription")})]}),e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"hidden md:block absolute top-8 left-[8%] right-[8%] h-px bg-[#4F7DF3]"}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4",children:b.map((s,a)=>e.jsxs("div",{className:"relative flex flex-col items-center text-center",children:[e.jsx("div",{className:`
                relative
                z-10
                w-16
                h-16
                rounded-full
                border
                border-[#4F7DF3]
                bg-[#F2F6FF]
                flex
                items-center
                justify-center
              `,children:e.jsx("span",{className:`
                  text-[18px]
                  font-semibold
                  text-[#2563EB]
                `,children:s.num})}),e.jsx("h4",{className:"mt-5 text-lg font-bold text-gray-900",children:s.title}),e.jsx("p",{className:"mt-2 text-sm text-[#64748B] leading-relaxed max-w-[180px]",children:s.desc}),a<b.length-1&&e.jsx("div",{className:"md:hidden w-px h-8 bg-[#4F7DF3] mt-4"})]},s.num))})]})]})}),v.length>0&&e.jsx("section",{className:"bg-white",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-12",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:t("landing.testimonialTitle")}),e.jsx("p",{className:"text-gray-500",children:t("landing.testimonialDescription")})]}),e.jsx("div",{className:"grid sm:grid-cols-3 gap-6",children:v.map(s=>{var a,o;return e.jsxs("div",{className:"bg-[#F2F6FF] border border-gray-100 rounded-sm p-6 hover:border-[#2563EB]/20 transition-colors",children:[e.jsx("div",{className:"flex gap-1 mb-4",children:Array.from({length:s.rating}).map((d,f)=>e.jsx(F,{size:14,fill:"#FBBF24",className:"text-[#FBBF24]"},f))}),e.jsxs("p",{className:"text-sm text-gray-600 mb-5 leading-relaxed",children:['"',s.text,'"']}),e.jsxs("div",{className:"flex items-center gap-3",children:[s.photo?e.jsx("img",{src:s.photo,alt:s.name,className:"w-10 h-10 rounded-full object-cover bg-gray-100",onError:d=>{d.target.style.display="none"}}):e.jsx("div",{className:"w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700",children:((o=(a=s.name)==null?void 0:a.charAt(0))==null?void 0:o.toUpperCase())??"?"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-semibold text-gray-900",children:s.name}),e.jsx("div",{className:"text-xs text-gray-400",children:s.role})]})]})]},s.id||s.name)})})]})}),e.jsx("section",{className:"bg-[#F2F6FF]",children:e.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-32 md:pb-20",children:e.jsxs("div",{className:"relative rounded-sm overflow-hidden p-10 text-center bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]",style:{border:"1px solid rgba(37,99,235,0.3)"},children:[e.jsxs("div",{className:"absolute inset-0 pointer-events-none",children:[e.jsx("div",{className:"absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl"}),e.jsx("div",{className:"absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#0EA5E9]/20 blur-3xl"})]}),e.jsxs("svg",{className:"absolute inset-0 w-full h-full opacity-[0.06]",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("defs",{children:e.jsx("pattern",{id:"dots-cta",x:"0",y:"0",width:"24",height:"24",patternUnits:"userSpaceOnUse",children:e.jsx("circle",{cx:"2",cy:"2",r:"1.5",fill:"white"})})}),e.jsx("rect",{width:"100%",height:"100%",fill:"url(#dots-cta)"})]}),e.jsxs("div",{className:"relative",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-white mb-4",children:t("landing.ctaTitle")}),e.jsx("p",{className:"text-white/80 mb-8 max-w-xl mx-auto",children:t("landing.ctaDescription")})]})]})})})]})}export{je as default};
