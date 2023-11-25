var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cookie = (key) => ({
    get val() {
        var _a;
        let parts = ("; " + document.cookie).split(`; ${key}=`);
        if (parts.length == 2)
            return (_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.split(";").shift();
        return null;
    },
    set val(v) {
        document.cookie = `${key}=${v}; expires=Fri, 3 Aug 2030 20:47:11 UTC; path=/`;
    }
});
function go(f, ...args) {
    let res;
    for (let i = 0, cur = args[0]; i < args.length; i++, cur = args[i])
        if (typeof cur == "string")
            args[i] = cur.startsWith('.') ? [...document.querySelectorAll(cur)]
                : document.querySelector(cur);
    if (args.length == 0 || (args[0] != undefined && args[0] != null && !(args[0].length === 0)))
        try {
            res = f(...args);
        }
        catch (e) {
            console.log(e);
        }
    return res;
}
const Lang = (() => {
    let _cur = null, cook = cookie("lang");
    return {
        infer: (href) => href.indexOf('/en') > -1 ? "en"
            : href.indexOf('/de') > -1 ? "de"
                : href.indexOf('/it') > -1 ? "it"
                    : href.indexOf('/pl') > -1 ? "pl" : "ua",
        get cur() { return _cur !== null && _cur !== void 0 ? _cur : (_cur = Lang.infer(location.href)); },
        trans(en, ua, de, it, pl) {
            switch (Lang.cur) {
                case "ua": return ua !== null && ua !== void 0 ? ua : en;
                case "de": return de !== null && de !== void 0 ? de : en;
                case "it": return it !== null && it !== void 0 ? it : en;
                case "pl": return pl !== null && pl !== void 0 ? pl : en;
                default: return en;
            }
        },
        get cook() {
            let w = cook.val;
            return w && ["ua", "en", "de", "it", "pl"].indexOf(w) > -1 ? w : null;
        },
        set cook(v) { cook.val = v; },
        euro: cookie("eulang"),
    };
})();
const lib = {
    allInputs: (form) => [
        ...form.getElementsByTagName("input"),
        ...form.getElementsByTagName("textarea")
    ],
    sendLiqpay(sign, data, isNewWindow = false) {
        let form = document.createElement("form");
        if (!sign || sign == "null")
            sign = Lang.trans("8FCafqMc//6iKe9wB+eqZWs3FPc=", "TVNsm5bs8KyxZhkpsexBFHb8Mb8=");
        if (!data || data == "null")
            data = Lang.trans("eyJhY3Rpb24iOiJwYXlkb25hdGUiLCJhbW91bnQiOiI1MDAiLCJjdXJyZW5jeSI6IlVBSCIsImRlc2NyaXB0aW9uIjoiRG9uYXRlIHRvIHRoZSBmdW5kIiwicmVzdWx0X3VybCI6Imh0dHBzOlwvXC9kaWFiZXQuZnVuZFwvZW4iLCJsYW5ndWFnZSI6ImVuIiwidmVyc2lvbiI6IjMiLCJwdWJsaWNfa2V5IjoiaTMwNzg0ODE1MTQzIn0=", "eyJhY3Rpb24iOiJwYXlkb25hdGUiLCJhbW91bnQiOiI1MDAiLCJjdXJyZW5jeSI6IlVBSCIsImRlc2NyaXB0aW9uIjoiXHUwNDFmXHUwNDNlXHUwNDM2XHUwNDM1XHUwNDQwXHUwNDQyXHUwNDMyXHUwNDQzXHUwNDMyXHUwNDMwXHUwNDQyXHUwNDM4IFx1MDQzMiBcdTA0NDRcdTA0M2VcdTA0M2RcdTA0MzQiLCJyZXN1bHRfdXJsIjoiaHR0cHM6XC9cL2RpYWJldC5mdW5kXC91YSIsImxhbmd1YWdlIjoidWsiLCJ2ZXJzaW9uIjoiMyIsInB1YmxpY19rZXkiOiJpMzA3ODQ4MTUxNDMifQ==");
        form.method = "POST";
        form.action = "https://www.liqpay.ua/api/3/checkout";
        form.innerHTML = `<input type="hidden" name="data" value="${data}"/>
                 <input type="hidden" name="signature" value="${sign}"/>
                 <input type="image" src="//static.liqpay.ua/buttons/p1ru.radius.png" name="btn_text"/>`;
        if (isNewWindow === true)
            form.target = "_blank";
        document.getElementsByTagName("body")[0].appendChild(form);
        form.submit();
        form.remove();
    },
    listenInputs(formWrap) {
        let remError = (e) => e.currentTarget.classList.remove("inp-err");
        for (let inp of lib.allInputs(formWrap)) {
            inp.addEventListener("keyup", remError);
            inp.addEventListener("change", remError);
        }
    },
    validateWithAlert(...formFiledPairs) {
        var _a, _b, _c;
        let res = {}, titles = [];
        for (let [form, fieldLine] of formFiledPairs)
            for (let field of fieldLine.split(" ")) {
                let inp = form.getElementsByClassName(`inp-${field}`)[0];
                if (inp)
                    if (!inp.value) {
                        titles.push((_a = inp.title) !== null && _a !== void 0 ? _a : (_c = (_b = inp.previousSibling) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.trim());
                        inp.classList.add("inp-err");
                    }
                    else
                        res[field] = inp.value;
            }
        if (titles.length > 0) {
            let message = Lang.trans("Data not filled", "Не заповнені дані", "Daten nicht ausgefüllt", "Dati non compilati", "Dane nie zostały wypełnione");
            alert(`\n${message}:\n- ` + titles.join("\n- "));
            return [false, res];
        }
        return [true, res];
    },
    freezeeInputs: (btn, ...forms) => (disable) => {
        if (btn) {
            if (btn.disabled = disable) {
                let { width, height } = btn.style;
                btn.title = btn.innerText;
                btn.innerText = Lang.trans("Sending..", "Вiдправка..", "Versenden..", "Spedizione..", "Załatwić..");
                btn.style.width = width;
                btn.style.height = height;
            }
            else
                btn.innerText = btn.title;
            btn.classList[disable ? "add" : "remove"]("btn-disabled");
        }
        for (let form of forms)
            for (let inp of lib.allInputs(form))
                inp.disabled = disable;
    },
    fetchMiniback(action, req, freezee) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            function aux() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        freezee(true);
                        response = yield fetch("https://minimail2.azurewebsites.net/" + action, req);
                        if (!response.ok)
                            return false;
                    }
                    catch (error) {
                        return false;
                    }
                    finally {
                        freezee(false);
                    }
                    return true;
                });
            }
            return (yield aux()) || (yield aux()) || (yield aux())
                ? [true, yield response.text()]
                : [false, null];
        });
    }
};
go(() => {
    let { cur, euro: { val: eulang } } = Lang;
    if (Lang.cook != cur)
        Lang.cook = cur;
    if (cur && cur != "en" && (!eulang || cur != eulang))
        Lang.euro.val = cur;
});
go(l => l.style.display = "none", "#eu-lang-links");
go(([langSwitch], payLinks, localItems) => {
    var _a, _b;
    let { cur, euro: { val: eulang } } = Lang, title = (_a = { pl: "POL", de: "DEU", it: "ITA" }[eulang]) !== null && _a !== void 0 ? _a : "УКР";
    for (let anchor of langSwitch.getElementsByTagName("a")) {
        let { href } = anchor;
        anchor.addEventListener("click", e => {
            e.preventDefault();
            Lang.cook = Lang.infer(href);
            location.href = href;
        });
        if (!href.includes('en') && eulang && !href.includes(eulang)) {
            anchor.href = '/' + eulang;
            if (anchor.classList.contains("lang-switcher__link"))
                anchor.innerHTML = ` ${title} `;
        }
    }
    //! local
    if (cur != "en")
        langSwitch.classList.add("lang-switcher__active");
    for (let link of payLinks)
        link.addEventListener("click", e => {
            e.preventDefault();
            lib.sendLiqpay(link.dataset["liqpay-sig"], link.dataset["liqpay-data"], true);
        });
    for (let el of localItems)
        el.innerHTML = (_b = el.dataset[cur]) !== null && _b !== void 0 ? _b : el.dataset.en;
}, ".lang-switcher", '.liqpay', '.local');
go(() => {
    let folders = ["center", "aboutus", "about-diabetes", "fundraising", "thanks", "fun"], curFolder = folders.findIndex(f => location.pathname.includes(f));
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
go(tabs => {
    let search = location.search, tabIndex = Math.max(0, tabs.findIndex(a => a.href.indexOf(search) > -1));
    if (tabIndex > -1 && tabIndex < tabs.length)
        for (var i = 0; i < tabs.length; i++)
            if (i == tabIndex)
                tabs[i].classList.add("needs-filter__item_active");
            else
                tabs[i].style.textDecoration = "underline";
    let suffix = ["none", "True", "False"][tabIndex];
    for (let v of document.getElementsByClassName(`is-military-${suffix}`))
        v.style.display = "none";
}, ".needs-filter__item");
go(([pane], cols) => {
    function arrow(clas, path, linkPage) {
        let [tag, color, href] = linkPage == null
            ? ["span", "#ccc", ""]
            : ["a", "#01B53E", `/${Lang.cur}/news/?page=${linkPage}`];
        return `<${tag} class="${clas}" href="${href}">
         <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="${path}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
         </svg>
      </${tag}>`;
    }
    let pages = [1, 2, 3], curIdx = Math.max(0, pages.findIndex(p => location.search.includes(`page=${p}`)));
    cols.forEach((card, i) => card.style.display = i >= (6 * curIdx) && i < (6 * (curIdx + 1)) ? "block" : "none");
    let items = pages.map(p => p - 1 == curIdx
        ? `<span class="pagination__item pagination__item_active">${p}</span>`
        : `<a class="pagination__item" href="/${Lang.cur}/news/?page=${p}">${p}</a>`);
    pane.innerHTML =
        `${arrow("pagination-btn_prev", "M6.15869 1.59766L1.65869 7.09766L6.15869 12.5977", curIdx == 0 ? null : curIdx - 1)}
         <div class="pagination__items-wr">${items.join('')}</div>
       ${arrow("pagination-btn_next", "M1.84131 12.4023L6.34131 6.90234L1.84131 1.40234", curIdx == pages.length - 1 ? null : curIdx + 1)}`;
}, ".news__pagination", ".news__list > .col-md-6");
go(() => {
    let header = document.querySelector('header'), burgerBtn = document.getElementById('burger-btn'), mobileMenuWr = document.getElementById('menu_mobile-wr'), mobileMenu = document.getElementById('menu_mobile');
    for (let btn of document.querySelectorAll(".copy-wallet"))
        btn.addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            let { dataset: { walletid } } = e.currentTarget, { innerText } = document.getElementById(walletid);
            yield navigator.clipboard.writeText(innerText);
            alert(Lang.trans("Copied to clipboard", "Скопійовано", "Kopiert", "Copiato", "Skopiowano"));
        }));
    window.addEventListener('resize', () => mobileMenuWr.style.top = `${header.offsetHeight}px`);
    window.addEventListener('load', () => mobileMenuWr.style.top = `${header.offsetHeight}px`);
    burgerBtn.addEventListener('click', function () {
        this.classList.toggle('burger-btn_active');
        document.body.classList.toggle('o_h');
        mobileMenuWr.classList.toggle('menu_mobile_active');
    });
    for (const item of mobileMenu.children)
        if (item.classList.contains('dropdown'))
            item.addEventListener('click', function (e) {
                e.preventDefault();
                this.classList.toggle('dropdown_open');
            });
});
go((heroBg, heroContent) => {
    let calcHeroBgOffset = () => heroBg.style.top = window.matchMedia('(max-width: 575px)').matches ? `${heroContent.offsetHeight}px` : `0px`;
    window.onload = calcHeroBgOffset;
    window.onresize = calcHeroBgOffset;
}, '#hero__background', '#hero__content');
go(() => {
    let modalTrigger = document.getElementById('modal-trigger'), modal = document.getElementById('modal'), modalContent = document.getElementById('modal__content'), modalCloseBtn = document.getElementById('modal__close-btn');
    modalTrigger.addEventListener('click', function () {
        modal.classList.toggle('open');
    });
    modal.addEventListener('click', function () {
        this.classList.remove('open');
    });
    modalContent.addEventListener('click', function (e) {
        e.stopPropagation();
    });
    modalCloseBtn.addEventListener('click', function (e) {
        modal.classList.remove('open');
    });
    /*needs item modal*/
    const showDocumentBtn = document.getElementById('show-document-btn');
    const documentModal = document.getElementById('document-modal');
    const documentModalContent = document.getElementById('document-modal__content');
    const closeDocumentBtn = document.getElementById('document-modal__close-btn');
    if (documentModal && showDocumentBtn) {
        showDocumentBtn.addEventListener('click', function () {
            documentModal.classList.toggle('open');
        });
        documentModal.addEventListener('click', function () {
            this.classList.remove('open');
        });
        documentModalContent.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        closeDocumentBtn.addEventListener('click', function (e) {
            documentModal.classList.remove('open');
        });
    }
});
go((triggers, contents) => {
    var _a;
    for (let item of triggers)
        item.addEventListener('click', e => {
            e.preventDefault();
            for (let i = 0; i < triggers.length; i++) {
                let meth = contents[i].id == item.hash.replace('#', '') ? "add" : "remove";
                triggers[i].classList[meth]('tabs-triggers__item_active');
                contents[i].classList[meth]('tabs-content__item_active');
            }
        });
    (_a = triggers.find(({ hash }) => location.href.includes(hash))) === null || _a === void 0 ? void 0 : _a.click();
}, '.tabs-triggers__item', '.tabs-content__item');
go(([slider]) => {
    let figures = slider.getElementsByTagName("figure"), index = -1, interval = null;
    slider.addEventListener("click", e => {
        e.preventDefault();
        location.href = figures[index].dataset.url;
    });
    function advance() {
        index++;
        if (index == figures.length)
            index = 0;
        for (let i = 0; i < figures.length; i++)
            figures[i].classList[i == index ? 'remove' : 'add']('hidd');
    }
    interval = setInterval(advance, 5000);
    advance();
}, ".nslider");
go(() => {
    for (const span of document.getElementsByClassName('numf')) {
        const num = parseInt(span.innerText, 10);
        if (!isNaN(num) && num > -1)
            span.innerHTML = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    function calcAges(tdate) {
        const now = new Date(), ageDifMs = now.valueOf() - tdate, ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    const piskunovDisease = document.getElementById('piskunov-disease'), curYear = document.getElementById('cur-year');
    if (curYear)
        curYear.innerHTML = (new Date()).getFullYear().toString();
    if (piskunovDisease)
        piskunovDisease.innerHTML = calcAges(new Date("06/06/2005").valueOf()).toString();
});
go((butt, [form]) => {
    const setStatus = text => document.getElementById("my-form-status").innerHTML = text;
    lib.listenInputs(form);
    butt.addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const [isValid, { Name, Mail, Message }] = lib.validateWithAlert([form, "Name Mail Message"]);
        if (!isValid)
            return;
        butt.disabled = true;
        let wrongMessage = Lang.trans("Something went wrong", "щось пішло не так", "etwas ist schief gelaufen", "qualcosa è andato storto", "coś poszło nie tak");
        try {
            var resp = yield fetch(form.action, {
                method: "POST",
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });
            if (resp.ok)
                setStatus("✔️ " + Lang.trans("Your message has been sent", "Ваше повідомлення відправлено!", "Ihre Nachricht wurde gesendet!", "Il tuo messaggio è stato inviato!", "Twoja wiadomość została wysłana!"));
            else
                setStatus("❌ " + wrongMessage);
        }
        catch (e) {
            setStatus("❌ " + wrongMessage);
            console.log(e.message);
        }
        finally {
            butt.disabled = false;
            form.reset();
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
    }));
}, "#email-submit", ".user-form");
function handleThankVideo(wraps) {
    var _a;
    for (let wrap of wraps.getElementsByTagName("figure")) {
        let pics = wrap.getElementsByTagName("picture"), img = pics[pics.length - 1], video = (_a = img === null || img === void 0 ? void 0 : img.dataset) === null || _a === void 0 ? void 0 : _a.video, [tspan] = wrap.getElementsByTagName("span"), title = tspan === null || tspan === void 0 ? void 0 : tspan.innerText;
        if (!video || video == "null")
            continue;
        img.style.cursor = "pointer";
        img.addEventListener("click", e => {
            e.preventDefault();
            let name = (title === null || title === void 0 ? void 0 : title.trim()) || wrap.dataset.title, [{ innerText: quote }] = wrap.getElementsByTagName("blockquote"), [w1, w2] = quote.split(' '), [, width, height] = video.split('_'), wind = window.open('', '_blank', `toolbar=no,menubar=no,status=yes,titlebar=0,resizable=yes,width=${width},height=${height}`);
            wind === null || wind === void 0 ? void 0 : wind.document.write(`<!doctype html><html><head><meta charset="UTF-8" />
            <title>${name}: ${w1} ${w2}...</title></head><body>
            <style>body { margin: 0; text-align: center; }</style>
            <div data-new-window>
               <video controls autoplay muted playsinline style="width: 100%; height: auto;">
                  <source src="${video}" type="video/mp4" />
               </video>
            </div>
         </body></html>`);
        });
    }
}
go(([wraps], [link]) => {
    handleThankVideo(wraps);
    if (!link)
        return;
    let page = parseInt(link.dataset.thanknext), [{ clientHeight }] = document.getElementsByTagName("footer"), fetching = false;
    window.addEventListener("scroll", () => __awaiter(this, void 0, void 0, function* () {
        let endOfPage = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - clientHeight);
        if (endOfPage && page != null && !fetching) {
            fetching = true;
            link.style.display = "none";
            let html = yield fetch(`/${Lang.cur}/thanksChunk${page}.html`);
            if (html.ok) {
                let span = document.createElement("span");
                span.innerHTML = yield html.text();
                handleThankVideo(span);
                wraps.append(...span.childNodes);
                page++;
            }
            else
                page = null;
            fetching = false;
        }
    }));
}, ".thanks", ".thanks-next-link");
go((radios) => {
    let lookup = {};
    for (let item of radios) {
        let [v1, v2] = item.dataset.radioval.split(":"), [name, val] = v2 == undefined ? [item.name, v1] : [v1, v2];
        if (!(name in lookup))
            lookup[name] = {};
        if (!(val in lookup[name]))
            lookup[name][val] = [null, null];
        if (item instanceof HTMLButtonElement) {
            lookup[name][val][0] = item;
            item.addEventListener("click", e => {
                e.preventDefault();
                for (let keyval in lookup[name]) {
                    let [butt, div] = lookup[name][keyval], [display, act] = keyval == val ? ["flex", "add"] : ["none", "remove"];
                    div.style.display = display;
                    butt.classList[act]("btn-pressed");
                }
            });
        }
        else {
            lookup[name][val][1] = item;
            lib.listenInputs(item);
        }
    }
}, ".radioval");
go((sendButt, docform, [docInput]) => {
    lib.listenInputs(docform);
    sendButt.addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        let [form1, form2] = "recipient-type:0 recipient-type:1 contact-type:0 contact-type:1".split(" ")
            .map(key => document.querySelector(`[data-radioval="${key}"]`))
            .filter(_ => _.style.display != "none"), [isValid, fields] = lib.validateWithAlert([form1, "surname name parto birth ages phone passserial passnumber passtaker passdate phone phonename"], [form2, "postaddress postsurname postname postparto"], [docform, "doc"]);
        if (!isValid)
            return;
        let body = new FormData();
        body.append("file", docInput.files[0]);
        for (let nam in fields)
            body.append(nam, (_a = fields[nam]) !== null && _a !== void 0 ? _a : "");
        let [isSucc] = yield lib.fetchMiniback("helpreq", { method: "POST", body, mode: "cors" }, lib.freezeeInputs(sendButt, form1, form2, docform));
        if (isSucc) {
            if (confirm("Ваше повідомлення відправлено!"))
                location.href = "/";
            else
                location.href = "/";
        }
        else
            alert("щось пішло не так");
    }));
}, "#seld-recipiet", "#docform", ".inp-doc");
