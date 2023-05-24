
const lib = (() => {
   let _isEnglish: boolean | null = null

   let allInputs = (form: HTMLElement) => 
      [...form.getElementsByTagName("input"), ...form.getElementsByTagName("textarea")] as HTMLInputElement[]

   return {
      get isEnglish() {
         return _isEnglish ??= location.href.indexOf('/en') > -1
      },

      get cookEnglish() {
         let parts = ("; " + document.cookie).split("; is_english=")
         if (parts.length == 2)
             return parts.pop()?.split(";").shift() == 'true'
         return null
      },
      set cookEnglish(v) {
         document.cookie =  "is_english=" + (v ? 'true': 'false') + "; expires=Fri, 3 Aug 2030 20:47:11 UTC; path=/";
      },
  
      get lang() { return lib.isEnglish ? "en" : "ua" },
  
      sendLiqpay(sign: string, data: string, isNewWindow = false) {
         let form = document.createElement("form")
         if (!sign || sign == "null")
             sign = lib.isEnglish ? "8FCafqMc//6iKe9wB+eqZWs3FPc=" : "TVNsm5bs8KyxZhkpsexBFHb8Mb8="
         if (!data || data == "null")
             data = lib.isEnglish 
             ? "eyJhY3Rpb24iOiJwYXlkb25hdGUiLCJhbW91bnQiOiI1MDAiLCJjdXJyZW5jeSI6IlVBSCIsImRlc2NyaXB0aW9uIjoiRG9uYXRlIHRvIHRoZSBmdW5kIiwicmVzdWx0X3VybCI6Imh0dHBzOlwvXC9kaWFiZXQuZnVuZFwvZW4iLCJsYW5ndWFnZSI6ImVuIiwidmVyc2lvbiI6IjMiLCJwdWJsaWNfa2V5IjoiaTMwNzg0ODE1MTQzIn0="
             : "eyJhY3Rpb24iOiJwYXlkb25hdGUiLCJhbW91bnQiOiI1MDAiLCJjdXJyZW5jeSI6IlVBSCIsImRlc2NyaXB0aW9uIjoiXHUwNDFmXHUwNDNlXHUwNDM2XHUwNDM1XHUwNDQwXHUwNDQyXHUwNDMyXHUwNDQzXHUwNDMyXHUwNDMwXHUwNDQyXHUwNDM4IFx1MDQzMiBcdTA0NDRcdTA0M2VcdTA0M2RcdTA0MzQiLCJyZXN1bHRfdXJsIjoiaHR0cHM6XC9cL2RpYWJldC5mdW5kXC91YSIsImxhbmd1YWdlIjoidWsiLCJ2ZXJzaW9uIjoiMyIsInB1YmxpY19rZXkiOiJpMzA3ODQ4MTUxNDMifQ==";
  
         form.method = "POST"
         form.action = "https://www.liqpay.ua/api/3/checkout"
         form.innerHTML = `<input type="hidden" name="data" value="${data}"/>
                 <input type="hidden" name="signature" value="${sign}"/>
                 <input type="image" src="//static.liqpay.ua/buttons/p1ru.radius.png" name="btn_text"/>`
         if (isNewWindow === true)
             form.target = "_blank"
  
         document.getElementsByTagName("body")[0].appendChild(form)
         form.submit()
         form.remove()
      },

      listenInputs(formWrap: HTMLElement) {
         let remError = (e: any) => e.currentTarget.classList.remove("inp-err")
         for (let inp of allInputs(formWrap)) {
             inp.addEventListener("keyup", remError)
             inp.addEventListener("change", remError)
         }            
      },
  
      validateWithAlert(...formFiledPairs: [HTMLFormElement, string][]): [boolean, Record<string, string>] {
         let res = {}, titles: string[] = []
         for (let [form, fieldLine] of formFiledPairs)
             for (let field of fieldLine.split(" ")) {
                 let inp = form.getElementsByClassName(`inp-${field}`)[0] as HTMLInputElement
                 if (inp) 
                     if (inp && !inp.value) {
                         titles.push(inp.title ?? inp.previousSibling?.textContent?.trim())
                         inp.classList.add("inp-err")
                     }
                     else
                         res[field] = inp.value
             }
         if (titles.length > 0) {
             alert(`\n${lib.isEnglish ? "Data not filled" : "Не заповнені дані"}:\n- ` + titles.join("\n- "))
             return [false, res]
         }
         return [true, res]
      },

      freezeeInputs: (btn: HTMLButtonElement, ...forms: HTMLFormElement[]) => (disable: boolean) => {
         if (btn) {
             btn.classList[disable ? "add" : "remove"]("btn-disabled");
             btn.disabled = disable;
  
             if (disable) {
                 let {width, height} = btn.style
                 btn.setAttribute("title", btn.innerText)
                 btn.innerText = lib.isEnglish ? "Sending.." : "Вiдправка.."
                 btn.style.width = width
                 btn.style.height = height
             }
             else
                 btn.innerText = btn.getAttribute("title")!
         }
         for (let form of forms)
             for (let inp of allInputs(form))
                 inp.disabled = disable
     },

     async fetchMiniback(action: string, req: any, freezee: (v: boolean) => void) {
      let response: any
      async function aux() {
          try {
              freezee(true)
              response = await fetch("https://minimail2.azurewebsites.net/" + action, req)
              if (!response.ok) 
                  return false
          }
          catch (error) { return false }
          finally { freezee(false) }   
          return true 
      }
      if (await aux() || await aux() || await aux())
          return [true, response]
      else 
          return [false, null]
    },
    
    go<T extends any[]>(f: (...args: T) => void, ...args: T){
        let res
        if (args.length == 0 || (args[0] != undefined && args[0] != null && !(args[0].length === 0)))
        try { res = f(...args) }
        catch(e){ console.log(e); }
        return res
    }
   }
})();

setTimeout(() => {
   if (lib.cookEnglish != lib.isEnglish)
       lib.cookEnglish = lib.isEnglish
}, 100);

lib.go(() => {
   let langSwitch = document.getElementsByClassName("lang-switcher")[0]
   for (let a of langSwitch.getElementsByTagName("a")) 
       a.addEventListener("click", e => {
           e.preventDefault()
           lib.cookEnglish = a.href.indexOf('/en') > -1
           location.href = a.href
       })

   if (!lib.isEnglish)
       langSwitch.classList.add("lang-switcher__active")

   for (let link of document.getElementsByClassName('liqpay'))
       link.addEventListener("click", e => {
           e.preventDefault()
           let d = (e.currentTarget as HTMLElement)!.dataset
           lib.sendLiqpay(d["liqpay-sig"], d["liqpay-data"], true)
       })

   for (let el of document.getElementsByClassName('local')) {
     let {ua, en} = (el as HTMLElement).dataset;
     el.innerHTML = lib.isEnglish ? en : ua;
   }
});

lib.go(() => {
   let folders = ["center", "aboutus", "about-diabetes", "fundraising", "thanks", "fun" ],
   curFolder = folders.findIndex(f => location.pathname.indexOf(f) > -1);
   
   [...document.querySelectorAll(".menu > a")].forEach((a, i) => {
       if (i == curFolder)
           a.classList.add("menu__item_active");
   });
   [...document.querySelectorAll(".menu_mobile > a")].forEach((a, i) => {
       if (i == curFolder)
           a.classList.add("menu_mobile__item_active");
   });
   
   [...document.querySelectorAll(".footer__nav > a")].forEach((a, i) => {
       if (i == curFolder)
           a.classList.add("footer__nav-item_active");
   });
});

lib.go(tabs => {
   let search = location.search,
   tabIndex = Math.max(0, Array.prototype.findIndex.call(tabs, a => a.href.indexOf(search) > -1)),
   suffix = ["none", "True", "False"][tabIndex];

   if (tabIndex > -1 && tabIndex < tabs.length)
       for (var i =0; i<tabs.length; i++)
           if (i == tabIndex)
               tabs[i].classList.add("needs-filter__item_active");
           else 
               tabs[i].style.textDecoration = "underline";

   for (let v of document.getElementsByClassName(`is-military-${suffix}`))
       (v as HTMLElement).style.display = "none";
},
document.getElementsByClassName("needs-filter__item") as HTMLCollectionOf<HTMLAnchorElement>);

lib.go(pane => {
   function arrow(clas: string, path: string, linkPage: number | null) {
       const [tag, color, href] = linkPage == null 
           ? ["span", "#ccc", ""]
           : ["a", "#01B53E", `/${lib.lang}/news/?page=${linkPage}`];
       
       return `<${tag} class="${clas}" href="${href}">
           <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
               <path d="${path}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
           </svg>
       </${tag}>`;
   }
   const pages = [1, 2, 3],
   curIdx = Math.max(0, pages.findIndex(p => location.search.indexOf(`page=${p}`) > -1));

   [...document.querySelectorAll(".news__list > .col-md-6")].forEach((card, i) =>
       (card as HTMLElement).style.display = i >= (6*curIdx) && i < (6*(curIdx+1)) ? "block": "none" );

   var items = pages.map(p => p-1 == curIdx
       ? `<span class="pagination__item pagination__item_active">${p}</span>`
       : `<a class="pagination__item" href="/${lib.lang}/news/?page=${p}">${p}</a>`);

   pane.innerHTML = `${arrow("pagination-btn_prev", "M6.15869 1.59766L1.65869 7.09766L6.15869 12.5977", curIdx==0 ? null : curIdx -1)}
   <div class="pagination__items-wr">${items.join('')}</div>
   ${arrow("pagination-btn_next", "M1.84131 12.4023L6.34131 6.90234L1.84131 1.40234", curIdx==pages.length-1 ? null : curIdx +1)}`;

},
document.getElementsByClassName("news__pagination")[0]);

lib.go(() => {
   const header = document.querySelector('header') as HTMLElement,
   burgerBtn = document.getElementById('burger-btn') as HTMLButtonElement,
   mobileMenuWr = document.getElementById('menu_mobile-wr') as HTMLElement,
   mobileMenu = document.getElementById('menu_mobile') as HTMLElement;
   
   for (const btn of document.querySelectorAll(".copy-wallet")) 
       btn.addEventListener("click", async e => {
           e.preventDefault();
           const { innerText } = document.getElementById((e.currentTarget as HTMLElement)!.dataset.walletid!) as HTMLElement
           await navigator.clipboard.writeText(innerText);
           alert(lib.isEnglish ? "Copied to clipboard" : "Скопійовано");
       });
   
   window.addEventListener('resize', () => mobileMenuWr.style.top = `${header.offsetHeight}px`)
   window.addEventListener('load', () => mobileMenuWr.style.top = `${header.offsetHeight}px`)
   
   burgerBtn.addEventListener('click', function () {
       this.classList.toggle('burger-btn_active')
       document.body.classList.toggle('o_h')
       mobileMenuWr.classList.toggle('menu_mobile_active')
   });
   
   for (const item of mobileMenu.children)
       if (item.classList.contains('dropdown'))
           item.addEventListener('click', function (e) {
               e.preventDefault()
               this.classList.toggle('dropdown_open')
           })
});

lib.go((heroBg, heroContent) => {
       const calcHeroBgOffset = () =>
           heroBg.style.top = window.matchMedia('(max-width: 575px)').matches
               ? `${heroContent.offsetHeight}px`
               : `0px`;

       window.onload = calcHeroBgOffset
       window.onresize = calcHeroBgOffset
},
   document.getElementById('hero__background'),
   document.getElementById('hero__content')
);

lib.go(() => {
    const modalTrigger = document.getElementById('modal-trigger') as HTMLElement
    const modal = document.getElementById('modal') as HTMLElement
    const modalContent = document.getElementById('modal__content') as HTMLElement
    const modalCloseBtn = document.getElementById('modal__close-btn') as HTMLElement
    modalTrigger.addEventListener('click', function () {
       modal.classList.toggle('open')
    })
    
    modal.addEventListener('click', function () {
       this.classList.remove('open')
    })
    
    modalContent.addEventListener('click', function (e) {
       e.stopPropagation()
    })
    
    modalCloseBtn.addEventListener('click', function (e) {
       modal.classList.remove('open')
    })
    
    /*needs item modal*/
    const showDocumentBtn = document.getElementById('show-document-btn') as HTMLElement
    const documentModal = document.getElementById('document-modal') as HTMLElement
    const documentModalContent = document.getElementById('document-modal__content') as HTMLElement
    const closeDocumentBtn = document.getElementById('document-modal__close-btn') as HTMLElement
    if (documentModal && showDocumentBtn) {
       showDocumentBtn.addEventListener('click', function () {
           documentModal.classList.toggle('open')
       })
    
       documentModal.addEventListener('click', function () {
           this.classList.remove('open')
       })
    
       documentModalContent.addEventListener('click', function (e) {
           e.stopPropagation()
       })
    
       closeDocumentBtn.addEventListener('click', function (e) {
           documentModal.classList.remove('open')
       })
    }
});

lib.go((triggers, contents) => {
   for (const item of triggers)
       item.addEventListener('click', e => {
           e.preventDefault()
           const id = e.currentTarget.getAttribute('href').replace('#', '')
           for (var i = 0; i < triggers.length; i++) {
               const meth = contents[i].id == id ? "add" : "remove"
               triggers[i].classList[meth]('tabs-triggers__item_active')
               contents[i].classList[meth]('tabs-content__item_active')
           }
       })
   
   const current = [...triggers].find(_=> location.search.indexOf(_.href.split('#')[1]) > -1);
   if (current)
       current.click();
},
   document.getElementsByClassName('tabs-triggers__item') as HTMLCollectionOf<any>,
   document.getElementsByClassName('tabs-content__item'));

const __slider = lib.go(slider => {
   let figures = slider.getElementsByTagName("figure"),
   index = -1,
   interval = null;

   slider.addEventListener("click", e => {
        e.preventDefault();
        location.href = figures[index].dataset.url
    })

   function advance() {
       index++;
       if (index == figures.length)
           index = 0;
       
       for (let i = 0; i < figures.length; i++) 
           figures[i].classList[i == index ? 'remove' : 'add']('hidd');
   }
   const start = () => interval = setInterval(advance, 5000)
   start()
   advance()
   return {
     start, 
     stop() { clearInterval(interval) }
   }
},
    document.getElementsByClassName("nslider")[0]);

lib.go(() => {
   for (const span of document.getElementsByClassName('numf')) {
       const num = parseInt((span as HTMLElement).innerText, 10);
       if (!isNaN(num) && num > -1)
           span.innerHTML = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
   }
   
   function calcAges(tdate: number){
       const now = new Date(), ageDifMs = now.valueOf() - tdate, ageDate = new Date(ageDifMs);
       return Math.abs(ageDate.getUTCFullYear() - 1970);
   }

   const piskunovDisease = document.getElementById('piskunov-disease'),
   curYear = document.getElementById('cur-year');
   if (curYear)
      curYear.innerHTML = (new Date()).getFullYear().toString();
   if (piskunovDisease)
       piskunovDisease.innerHTML = calcAges(new Date("06/06/2005").valueOf()).toString();
});

lib.go((form, butt) => {
   if (!form || !butt)
       return;

   const setStatus = text => document.getElementById("my-form-status")!.innerHTML =text;
   lib.listenInputs(form);

   butt.addEventListener("click", async e => {
       e.preventDefault()
       const [isValid, { Name, Mail, Message }] = lib.validateWithAlert([form, "Name Mail Message"])
       if (!isValid)
           return

        butt.disabled = true
        try {
            var resp = await fetch(form.action, {
              method: "POST",
              body: new FormData(form),
              headers: { 'Accept': 'application/json' }
            })
            if (resp.ok)
                setStatus(lib.isEnglish ? "✔️ Your message has been sent": "✔️ Ваше повідомлення відправлено!")
            else
                setStatus(lib.isEnglish ? "❌ Something went wrong": "❌ щось пішло не так")
        }
        catch (e){
            setStatus(lib.isEnglish ? "❌ Something went wrong": "❌ щось пішло не так")
            console.log(e.message)
        }
        finally {
            butt.disabled = false
            form.reset()
        }
      /* var [isSucc] =
            await lib.fetchMiniback("feedback", {
                method: "POST", 
                body: JSON.stringify({ Name, Mail, Message }), 
                mode: "cors",
                headers: { Accept: 'application/json', "Content-Type": 'application/json' }
            },
            lib.freezeeInputs(butt, form))
       */
       
   });

},
   document.getElementsByClassName("user-form")[0] as HTMLFormElement,
   document.getElementById("email-submit") as HTMLButtonElement);

function handleThankVideo(wraps: HTMLElement) {
    for (const wrap of wraps.getElementsByTagName("figure")) {
        const pics = wrap.getElementsByTagName("picture"),
        img = pics[pics.length-1],
        video = img?.dataset?.video,
        tspan = wrap.getElementsByTagName("span")[0],
        title = tspan?.innerText
 
        if (!video || video == "null")
            continue;
        img.style.cursor = "pointer";
        img.addEventListener("click", e => {
            e.preventDefault()
            const name = title?.trim() || wrap.dataset.title,
            [w1, w2] = wrap.getElementsByTagName("blockquote")[0].innerText.split(' '),
            [, width, height] = video.split('_'),
            
            wind = window.open('', '_blank', `toolbar=no,menubar=no,status=yes,titlebar=0,resizable=yes,width=${width},height=${height}`)
   
            wind?.document.write(`<!doctype html><html><head><meta charset="UTF-8" />
                <title>${name}: ${w1} ${w2}...</title></head><body>
                <style>body { margin: 0; text-align: center; }</style>
                <div data-new-window>
                    <video controls autoplay muted playsinline style="width: 100%; height: auto;">
                        <source src="//${location.host}${video}" type="video/mp4" />
                    </video>
                </div>
            </body></html>`)
        })
    }
}

lib.go((wraps: HTMLDivElement, link: HTMLAnchorElement) => {
    handleThankVideo(wraps)
    if (!link)
        return;
    let page = parseInt(link.dataset.thanknext)
    let footH = document.getElementsByTagName("footer")[0].clientHeight
  
    window.addEventListener("scroll", async () => {
        const endOfPage = (window.innerHeight + window.pageYOffset) >= (document.body.offsetHeight-footH)
        if (endOfPage && page != null) {
            link.style.display = "none"
            var html = await fetch(`/${lib.lang}/thanksChunk${page}.html`)
            if (html.ok) {
                var span = document.createElement("span")
                span.innerHTML = await html.text()
                handleThankVideo(span)
                wraps.append(...span.childNodes)
                page++
            }
            else
                page = null
        }
    })
},
document.getElementsByClassName("thanks")[0],
document.getElementsByClassName("thanks-next-link")[0]);

lib.go(radios => {
   const lookup: Record<string, Record<string, [HTMLButtonElement | null, HTMLFormElement|null]>> = {};
   for (const item of radios) {
       const [v1, v2] = item.dataset.radioval!.split(":"),
       [name, val] = v2 == undefined ? [item.name, v1] : [v1, v2]
       
       if (!(name in lookup))
           lookup[name] = {};
       if (!(val in lookup[name]))
           lookup[name][val] = [null, null]

       if (item instanceof HTMLButtonElement) {
           lookup[name][val][0] = item

           item.addEventListener("click", e => {
               e.preventDefault()
               for (const keyval in lookup[name]) {
                  let [butt, div] = lookup[name][keyval]
                   if (keyval == val) {
                       div!.style.display = "flex"
                       butt!.classList.add("btn-pressed")
                   }
                   else {
                       div!.style.display = "none"
                       butt!.classList.remove("btn-pressed")
                   }
               }
           })
       }
       else {
           lookup[name][val][1] = item
           lib.listenInputs(item)
       }
   }
},
document.getElementsByClassName("radioval") as HTMLCollectionOf<HTMLButtonElement | HTMLFormElement>);

lib.go(sendButt => {
   const docform = document.getElementById("docform") as HTMLFormElement;
   lib.listenInputs(docform);

   sendButt.addEventListener("click", async e => {
       e.preventDefault();
       
       const [form1, form2] = 
             "recipient-type:0 recipient-type:1 contact-type:0 contact-type:1".split(" ")
               .map(key => document.querySelector(`[data-radioval="${key}"]`) as HTMLFormElement)
               .filter(_ => _.style.display != "none"),

       [isValid, fields] = lib.validateWithAlert(
           [form1, "surname name parto birth ages phone passserial passnumber passtaker passdate phone phonename"],
           [form2, "postaddress postsurname postname postparto"],
           [docform, "doc"]);
       if (!isValid) 
           return;

       const body = new FormData()
       body.append("file", (document.getElementsByClassName("inp-doc")[0] as HTMLInputElement).files![0])
       for (const nam in fields)
           body.append(nam, fields[nam] ?? "");
       
       var [isSucc] = await lib.fetchMiniback("helpreq", 
                       { method: "POST", body, mode: "cors" },
                       lib.freezeeInputs(sendButt, form1, form2, docform));

       if (isSucc) {
           if (confirm("Ваше повідомлення відправлено!"))
               location.href="/";
           else
               location.href="/";
       }
       else
           alert("щось пішло не так");
   });
},
document.getElementById("seld-recipiet") as HTMLButtonElement);