import{c as v,u as z,r as b,j as e,a as j,C as I,V as B,B as S,M as U,L,S as k,d as $}from"./index-BdtSUb_z.js";import{M as T}from"./map-pin-BoSC0qmk.js";import{B as C}from"./book-open-Dl4EEqwl.js";import{U as q}from"./users-CBaUlhLQ.js";import{F as R}from"./file-text-3J036PQi.js";import{S as O}from"./shield-OhpxjgKZ.js";import{C as P}from"./calendar-D9vC_jqp.js";import{S as V}from"./sparkles-BgR1IjeD.js";import{G}from"./graduation-cap-GSIYIQEk.js";import{C as Y}from"./check-BdFWStkt.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]],X=v("brain",Z);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]],W=v("chart-no-axes-column",H);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],K=v("globe",J);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],ee=v("zap",Q);function se(a){return a.toLocaleString("id-ID")}function te({tutor:a,onView:n,onBook:u}){var h,m;const{t:r}=z(),[y,s]=b.useState(!1),f=a.subject??a.subject_label??r("findTutor.subjectGeneral"),N=a.location??a.city??r("findTutor.online"),x=r("findTutor.experienceYears",{years:a.experience_years??0}),F=a.level_label??a.level??r("findTutor.allLevels"),w=se(a.price??a.price_per_hour??0),E=a.online??a.mode_online??!1,g=a.badge??(a.verified?r("findTutor.topTutor"):null);return e.jsxs("div",{className:"bg-white p-3",children:[e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("div",{className:"relative shrink-0",children:[a.photo&&!y?e.jsx("img",{src:a.photo,onError:()=>s(!0),alt:a.name,className:"w-[72px] h-[72px] rounded-lg object-cover bg-gray-200"}):e.jsx("div",{className:`
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
              `,children:((m=(h=a.name)==null?void 0:h.charAt(0))==null?void 0:m.toUpperCase())||"T"}),E&&e.jsx("span",{className:"absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"})]}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex justify-between items-start gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("h3",{className:"font-semibold text-[18px] leading-tight text-gray-900 truncate",children:a.name}),e.jsx("p",{className:"text-sm text-slate-500 mt-1 truncate",children:f})]}),g&&e.jsx("span",{className:"text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 whitespace-nowrap",children:g})]}),e.jsxs("div",{className:"flex items-center gap-1 mt-2",children:[e.jsx(j,{size:14,className:"fill-yellow-400 text-yellow-400"}),e.jsx("span",{className:"text-sm font-medium text-gray-900",children:a.rating??0}),e.jsxs("span",{className:"text-sm text-gray-500",children:["(",a.reviews??0,")"]})]})]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-4 mt-3 pb-3 border-b border-gray-100 text-xs text-gray-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(T,{size:12}),e.jsx("span",{children:N})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(I,{size:12}),e.jsx("span",{children:x})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(C,{size:12}),e.jsx("span",{children:F})]})]}),e.jsxs("div",{className:"mt-3 flex justify-between items-center gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-lg font-bold text-gray-900",children:["Rp ",w]}),e.jsx("span",{className:"text-[10px] text-gray-500 ml-1",children:r("findTutor.perSession")})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:n,className:`
              h-8
              px-3
              text-xs
              border
              border-gray-300
              rounded-md
              text-gray-700
              hover:bg-gray-50
              transition
            `,children:r("findTutor.viewProfile")}),e.jsx("button",{onClick:u,className:`
              h-8
              px-3
              text-xs
              rounded-md
              bg-blue-600
              text-white
              hover:bg-blue-700
              transition
            `,children:r("findTutor.bookButton")})]})]})]})}function ge({navigate:a,platformStats:n,tutors:u,user:r,onSelectTutor:y}){const{t:s}=z(),[f,N]=b.useState([]),[x,F]=b.useState(null);b.useEffect(()=>{(async()=>{try{const l="https://rezi-laravel.yopaaa.xyz/api".replace(/\/api\/?$/,"")??"http://localhost:8000",o=await(await fetch(`${l}/api/website/ratings`)).json();if(o.data&&o.data.length>0){const p=o.data.map(i=>{const c=i.photo,M=c?c.startsWith("http")?c:`${l}/storage/${c}`:null;return{id:i.id,name:i.name,role:i.role,photo:M,text:i.text,rating:i.rating,created_at:i.created_at}});N(p),F({average:o.average??0,total:o.total??p.length})}}catch(l){console.error("Failed to fetch testimonials:",l)}})()},[]),b.useEffect(()=>{document.documentElement.style.scrollBehavior="smooth";const t={threshold:.1,rootMargin:"0px 0px -50px 0px"},l=i=>{i.forEach(c=>{c.isIntersecting&&(c.target.classList.add("animate-in","fade-in","duration-700"),d.unobserve(c.target))})},d=new IntersectionObserver(l,t);return document.querySelectorAll("section").forEach(i=>{i.style.opacity="0",d.observe(i)}),document.querySelectorAll("[class*='grid']").forEach(i=>{d.observe(i)}),()=>{d.disconnect()}},[]);const w=[{icon:e.jsx(K,{size:24,className:"text-white"}),title:s("landing.feature1.title"),desc:s("landing.feature1.description"),gradient:"from-[#2563EB] to-[#1D4ED8]"},{icon:e.jsx(C,{size:24,className:"text-white"}),title:s("landing.feature2.title"),desc:s("landing.feature2.description"),gradient:"from-[#0EA5E9] to-[#0284C7]"},{icon:e.jsx(q,{size:24,className:"text-white"}),title:s("landing.feature3.title"),desc:s("landing.feature3.description"),gradient:"from-[#6366F1] to-[#4F46E5]"}],E=[{icon:e.jsx(B,{size:20}),title:s("landing.platformFeature1.title"),desc:s("landing.platformFeature1.description"),color:"#2563EB",bg:"#EFF6FF"},{icon:e.jsx(X,{size:20}),title:s("landing.platformFeature2.title"),desc:s("landing.platformFeature2.description"),color:"#0EA5E9",bg:"#F0F9FF"},{icon:e.jsx(T,{size:20}),title:s("landing.platformFeature3.title"),desc:s("landing.platformFeature3.description"),color:"#6366F1",bg:"#EEF2FF"},{icon:e.jsx(R,{size:20}),title:s("landing.platformFeature4.title"),desc:s("landing.platformFeature4.description"),color:"#0891B2",bg:"#ECFEFF"},{icon:e.jsx(O,{size:20}),title:s("landing.platformFeature5.title"),desc:s("landing.platformFeature5.description"),color:"#2563EB",bg:"#EFF6FF"},{icon:e.jsx(W,{size:20}),title:s("landing.platformFeature6.title"),desc:s("landing.platformFeature6.description"),color:"#0EA5E9",bg:"#F0F9FF"},{icon:e.jsx(S,{size:20}),title:s("landing.platformFeature7.title"),desc:s("landing.platformFeature7.description"),color:"#6366F1",bg:"#EEF2FF"},{icon:e.jsx(U,{size:20}),title:s("landing.platformFeature8.title"),desc:s("landing.platformFeature8.description"),color:"#0891B2",bg:"#ECFEFF"}],g=[{num:"01",icon:e.jsx(L,{size:18}),title:s("landing.step1.title"),desc:s("landing.step1.description"),color:"#2563EB"},{num:"02",icon:e.jsx(k,{size:18}),title:s("landing.step2.title"),desc:s("landing.step2.description"),color:"#0EA5E9"},{num:"03",icon:e.jsx(P,{size:18}),title:s("landing.step3.title"),desc:s("landing.step3.description"),color:"#6366F1"},{num:"04",icon:e.jsx(B,{size:18}),title:s("landing.step4.title"),desc:s("landing.step4.description"),color:"#0891B2"},{num:"05",icon:e.jsx(j,{size:18}),title:s("landing.step5.title"),desc:s("landing.step5.description"),color:"#2563EB"}],h=u.filter(t=>t.role==="tutor").length,m=t=>t>=1e3?`${t.toLocaleString("id-ID")}+`:t.toLocaleString("id-ID"),A=h>0?m(h):n!=null&&n.total_tutors?m(n.total_tutors):"—",_=n!=null&&n.total_students?m(n.total_students):"—",D=[{val:A,label:s("landing.stats.tutors")},{val:_,label:s("landing.stats.students")},{val:"50+",label:s("landing.stats.cities")},{val:"95%",label:s("landing.stats.satisfaction")}];return e.jsxs("div",{className:"bg-white text-gray-900",style:{scrollBehavior:"smooth"},children:[e.jsx("style",{children:`
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
      `}),e.jsxs("section",{className:"relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#F2F6FF] via-white to-[#EFF6FF]",children:[e.jsxs("div",{className:"absolute inset-0 pointer-events-none overflow-hidden",children:[e.jsx("div",{className:"absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#2563EB]/8 blur-[120px]"}),e.jsx("div",{className:"absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-[#0EA5E9]/10 blur-[100px]"}),e.jsxs("svg",{className:"absolute inset-0 w-full h-full opacity-[0.04]",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("defs",{children:e.jsx("pattern",{id:"dots",x:"0",y:"0",width:"24",height:"24",patternUnits:"userSpaceOnUse",children:e.jsx("circle",{cx:"2",cy:"2",r:"1.5",fill:"#2563EB"})})}),e.jsx("rect",{width:"100%",height:"100%",fill:"url(#dots)"})]})]}),e.jsxs("div",{className:"relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20 grid lg:grid-cols-2 gap-16 items-center",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-6",children:[e.jsx(V,{size:12}),s("landing.heroBadge")]}),e.jsxs("h1",{className:"text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6",children:[s("landing.heroTitleFirstPart")," "," ",e.jsx("span",{className:"text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#0EA5E9]",children:s("landing.heroTitleHighlightedPart")})]}),e.jsx("p",{className:"text-lg text-gray-500 mb-8 leading-relaxed max-w-lg",children:s("landing.heroDescription")}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3 mb-10",children:[e.jsxs("button",{onClick:()=>a("cari-tutor"),className:"flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] transition-colors text-base",children:[e.jsx(k,{size:18}),s("landing.heroCTA")]}),!r&&e.jsxs("button",{onClick:()=>a("login"),className:"flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm border border-gray-200 text-gray-600 hover:text-[#2563EB] hover:border-[#2563EB]/40 hover:bg-[#F2F6FF] font-semibold transition-colors text-base",children:[e.jsx(G,{size:18}),s("landing.heroLogin")]})]}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-3 w-full",children:D.map(t=>e.jsxs("div",{className:"bg-white rounded-sm px-5 py-4 border border-gray-100 flex-1",children:[e.jsx("div",{className:"text-2xl font-extrabold text-[#2563EB]",children:t.val}),e.jsx("div",{className:"text-sm text-gray-400 mt-1",children:t.label})]},t.label))})]}),e.jsxs("div",{className:"hidden lg:block relative",children:[e.jsxs("div",{className:"relative rounded-sm overflow-hidden border border-gray-100",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop&auto=format",alt:s("landing.heroImageAlt"),className:"w-full h-80 object-cover"}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-white/30 to-transparent"})]}),e.jsxs("div",{className:"absolute -bottom-4 -left-8 bg-white rounded-sm p-4 border border-gray-100 flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-sm bg-[#DCFCE7] flex items-center justify-center",children:e.jsx(Y,{size:18,className:"text-[#16A34A]"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-semibold text-gray-800",children:s("landing.verifiedTutorTitle")}),e.jsx("div",{className:"text-xs text-gray-400",children:s("landing.verifiedTutorDescription")})]})]}),e.jsxs("div",{className:"absolute -top-4 -right-4 bg-white rounded-sm p-4 border border-gray-100",children:[e.jsx("div",{className:"flex items-center gap-1 mb-1",children:[1,2,3,4,5].map(t=>e.jsx(j,{size:12,fill:"#FBBF24",className:"text-[#FBBF24]"},t))}),e.jsx("div",{className:"text-sm font-semibold text-gray-800",children:x?s("landing.ratingScore",{score:x.average.toFixed(1)}):s("landing.noRatingScore")}),e.jsx("div",{className:"text-xs text-gray-400",children:x?s("landing.reviewCount",{count:x.total}):s("landing.noReviews")})]})]})]})]}),e.jsx("section",{className:"bg-white",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"flex justify-between items-start sm:items-center mb-10",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-3xl font-extrabold text-gray-900",children:s("landing.topTutorsTitle")}),e.jsx("p",{className:"text-gray-400 mt-1",children:s("landing.topTutorsDescription")})]}),e.jsxs("button",{onClick:()=>a("cari-tutor"),className:`
          flex
          items-center
          gap-1
          text-blue-600
          font-semibold
          text-sm
          whitespace-nowrap
          hover:text-blue-700
          transition-colors
        `,children:[s("landing.viewAll"),e.jsx($,{size:16})]})]}),e.jsx("div",{className:`
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-8
      `,children:u.slice(0,6).map(t=>e.jsx(te,{tutor:t,onView:()=>y(t),onBook:()=>{a("booking")}},t.id))})]})}),e.jsx("section",{className:"bg-[#F2F6FF]",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-12",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-4",children:[e.jsx(ee,{size:12}),s("landing.whyTitle")]}),e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:s("landing.whyTitle")}),e.jsx("p",{className:"text-gray-500 max-w-2xl",children:s("landing.whyDescription")})]}),e.jsx("div",{className:"grid sm:grid-cols-3 gap-6",children:w.map(t=>e.jsxs("div",{className:"bg-white border border-gray-100 rounded-sm p-6 hover:border-[#2563EB]/30 transition-colors duration-200",children:[e.jsx("div",{className:`w-14 h-14 rounded-sm bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-5`,children:t.icon}),e.jsx("h3",{className:"text-lg font-bold text-gray-900 mb-2",children:t.title}),e.jsx("p",{className:"text-sm text-gray-500 leading-relaxed",children:t.desc})]},t.title))})]})}),e.jsx("section",{className:"bg-white",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-12",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:s("landing.platformFeaturesTitle")}),e.jsx("p",{className:"text-gray-500 max-w-2xl",children:s("landing.platformFeaturesDescription")})]}),e.jsx("div",{className:"grid sm:grid-cols-2 lg:grid-cols-4 gap-4",children:E.map(t=>e.jsxs("div",{className:"bg-white border border-gray-100 rounded-sm p-5 hover:border-[#2563EB]/25 transition-colors duration-200 cursor-default",children:[e.jsx("div",{className:"flex items-center gap-3 mb-3",children:e.jsx("div",{className:"w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0",style:{color:t.color,background:t.bg},children:t.icon})}),e.jsx("h4",{className:"text-sm font-semibold text-gray-900 mb-1",children:t.title}),e.jsx("p",{className:"text-xs text-gray-400 leading-relaxed",children:t.desc})]},t.title))})]})}),e.jsx("section",{className:"bg-[#F2F6FF]",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-14",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:s("landing.stepsTitle")}),e.jsx("p",{className:"text-gray-500",children:s("landing.stepsDescription")})]}),e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"hidden md:block absolute top-8 left-[8%] right-[8%] h-px bg-[#4F7DF3]"}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4",children:g.map((t,l)=>e.jsxs("div",{className:"relative flex flex-col items-center text-center",children:[e.jsx("div",{className:`
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
                `,children:t.num})}),e.jsx("h4",{className:"mt-5 text-lg font-bold text-gray-900",children:t.title}),e.jsx("p",{className:"mt-2 text-sm text-[#64748B] leading-relaxed max-w-[180px]",children:t.desc}),l<g.length-1&&e.jsx("div",{className:"md:hidden w-px h-8 bg-[#4F7DF3] mt-4"})]},t.num))})]})]})}),f.length>0&&e.jsx("section",{className:"bg-white",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-20",children:[e.jsxs("div",{className:"mb-12",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4",children:s("landing.testimonialTitle")}),e.jsx("p",{className:"text-gray-500",children:s("landing.testimonialDescription")})]}),e.jsx("div",{className:"grid sm:grid-cols-3 gap-6",children:f.map(t=>{var l,d;return e.jsxs("div",{className:"bg-[#F2F6FF] border border-gray-100 rounded-sm p-6 hover:border-[#2563EB]/20 transition-colors",children:[e.jsx("div",{className:"flex gap-1 mb-4",children:Array.from({length:t.rating}).map((o,p)=>e.jsx(j,{size:14,fill:"#FBBF24",className:"text-[#FBBF24]"},p))}),e.jsxs("p",{className:"text-sm text-gray-600 mb-5 leading-relaxed",children:['"',t.text,'"']}),e.jsxs("div",{className:"flex items-center gap-3",children:[t.photo?e.jsx("img",{src:t.photo,alt:t.name,className:"w-10 h-10 rounded-full object-cover bg-gray-100",onError:o=>{o.target.style.display="none"}}):e.jsx("div",{className:"w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700",children:((d=(l=t.name)==null?void 0:l.charAt(0))==null?void 0:d.toUpperCase())??"?"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-semibold text-gray-900",children:t.name}),e.jsx("div",{className:"text-xs text-gray-400",children:t.role})]})]})]},t.id||t.name)})})]})}),e.jsx("section",{className:"bg-[#F2F6FF]",children:e.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 xs:pt-16 pb-32 md:pb-20",children:e.jsxs("div",{className:"relative rounded-sm overflow-hidden p-10 text-center bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]",style:{border:"1px solid rgba(37,99,235,0.3)"},children:[e.jsxs("div",{className:"absolute inset-0 pointer-events-none",children:[e.jsx("div",{className:"absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl"}),e.jsx("div",{className:"absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#0EA5E9]/20 blur-3xl"})]}),e.jsxs("svg",{className:"absolute inset-0 w-full h-full opacity-[0.06]",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("defs",{children:e.jsx("pattern",{id:"dots-cta",x:"0",y:"0",width:"24",height:"24",patternUnits:"userSpaceOnUse",children:e.jsx("circle",{cx:"2",cy:"2",r:"1.5",fill:"white"})})}),e.jsx("rect",{width:"100%",height:"100%",fill:"url(#dots-cta)"})]}),e.jsxs("div",{className:"relative",children:[e.jsx("h2",{className:"text-3xl sm:text-4xl font-extrabold text-white mb-4",children:s("landing.ctaTitle")}),e.jsx("p",{className:"text-white/80 mb-8 max-w-xl mx-auto",children:s("landing.ctaDescription")})]})]})})})]})}export{ge as default};
