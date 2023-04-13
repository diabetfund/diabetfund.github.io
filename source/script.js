var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const lib = (() => {
    let _isEnglish = null;
    let allInputs = (form) => [...form.getElementsByTagName("input"), ...form.getElementsByTagName("textarea")];
    return {
        get isEnglish() {
            return _isEnglish !== null && _isEnglish !== void 0 ? _isEnglish : (_isEnglish = location.href.indexOf('/en') > -1);
        },
        get cookEnglish() {
            var _a;
            let parts = ("; " + document.cookie).split("; is_english=");
            if (parts.length == 2)
                return ((_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.split(";").shift()) == 'true';
            return null;
        },
        set cookEnglish(v) {
            document.cookie = "is_english=" + (v ? 'true' : 'false') + "; expires=Fri, 3 Aug 2030 20:47:11 UTC; path=/";
        },
        get lang() { return lib.isEnglish ? "en" : "ua"; },
        sendLiqpay(sign, data, isNewWindow = false) {
            let form = document.createElement("form");
            if (!sign || sign == "null")
                sign = lib.isEnglish ? "8FCafqMc//6iKe9wB+eqZWs3FPc=" : "TVNsm5bs8KyxZhkpsexBFHb8Mb8=";
            if (!data || data == "null")
                data = lib.isEnglish
                    ? "eyJhY3Rpb24iOiJwYXlkb25hdGUiLCJhbW91bnQiOiI1MDAiLCJjdXJyZW5jeSI6IlVBSCIsImRlc2NyaXB0aW9uIjoiRG9uYXRlIHRvIHRoZSBmdW5kIiwicmVzdWx0X3VybCI6Imh0dHBzOlwvXC9kaWFiZXQuZnVuZFwvZW4iLCJsYW5ndWFnZSI6ImVuIiwidmVyc2lvbiI6IjMiLCJwdWJsaWNfa2V5IjoiaTMwNzg0ODE1MTQzIn0="
                    : "eyJhY3Rpb24iOiJwYXlkb25hdGUiLCJhbW91bnQiOiI1MDAiLCJjdXJyZW5jeSI6IlVBSCIsImRlc2NyaXB0aW9uIjoiXHUwNDFmXHUwNDNlXHUwNDM2XHUwNDM1XHUwNDQwXHUwNDQyXHUwNDMyXHUwNDQzXHUwNDMyXHUwNDMwXHUwNDQyXHUwNDM4IFx1MDQzMiBcdTA0NDRcdTA0M2VcdTA0M2RcdTA0MzQiLCJyZXN1bHRfdXJsIjoiaHR0cHM6XC9cL2RpYWJldC5mdW5kXC91YSIsImxhbmd1YWdlIjoidWsiLCJ2ZXJzaW9uIjoiMyIsInB1YmxpY19rZXkiOiJpMzA3ODQ4MTUxNDMifQ==";
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
            for (let inp of allInputs(formWrap)) {
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
                        if (inp && !inp.value) {
                            titles.push((_a = inp.title) !== null && _a !== void 0 ? _a : (_c = (_b = inp.previousSibling) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.trim());
                            inp.classList.add("inp-err");
                        }
                        else
                            res[field] = inp.value;
                }
            if (titles.length > 0) {
                alert(`\n${lib.isEnglish ? "Data not filled" : "Не заповнені дані"}:\n- ` + titles.join("\n- "));
                return [false, res];
            }
            return [true, res];
        },
        freezeeInputs: (btn, ...forms) => (disable) => {
            if (btn) {
                btn.classList[disable ? "add" : "remove"]("btn-disabled");
                btn.disabled = disable;
                if (disable) {
                    let { width, height } = btn.style;
                    btn.setAttribute("title", btn.innerText);
                    btn.innerText = lib.isEnglish ? "Sending.." : "Вiдправка..";
                    btn.style.width = width;
                    btn.style.height = height;
                }
                else
                    btn.innerText = btn.getAttribute("title");
            }
            for (let form of forms)
                for (let inp of allInputs(form))
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
                if ((yield aux()) || (yield aux()) || (yield aux()))
                    return [true, response];
                else
                    return [false, null];
            });
        },
        go(f, ...args) {
            if (args.length == 0 || (args[0] != undefined && args[0] != null && !(args[0].length === 0)))
                try {
                    f(...args);
                }
                catch (e) {
                    console.log(e);
                }
        }
    };
})();
setTimeout(() => {
    if (lib.cookEnglish != lib.isEnglish)
        lib.cookEnglish = lib.isEnglish;
}, 100);
lib.go(() => {
    let langSwitch = document.getElementsByClassName("lang-switcher")[0];
    for (let a of langSwitch.getElementsByTagName("a"))
        a.addEventListener("click", e => {
            e.preventDefault();
            lib.cookEnglish = a.href.indexOf('/en') > -1;
            location.href = a.href;
        });
    if (!lib.isEnglish)
        langSwitch.classList.add("lang-switcher__active");
    for (let link of document.getElementsByClassName('liqpay'))
        link.addEventListener("click", e => {
            e.preventDefault();
            let d = e.currentTarget.dataset;
            lib.sendLiqpay(d["liqpay-sig"], d["liqpay-data"], true);
        });
    for (let el of document.getElementsByClassName('local')) {
        let { ua, en } = el.dataset;
        el.innerHTML = lib.isEnglish ? en : ua;
    }
});
lib.go(() => {
    let folders = ["center", "aboutus", "about-diabetes", "fundraising", "thanks", "fun"], curFolder = folders.findIndex(f => location.pathname.indexOf(f) > -1);
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
    let search = location.search, tabIndex = Math.max(0, Array.prototype.findIndex.call(tabs, a => a.href.indexOf(search) > -1)), suffix = ["none", "True", "False"][tabIndex];
    if (tabIndex > -1 && tabIndex < tabs.length)
        for (var i = 0; i < tabs.length; i++)
            if (i == tabIndex)
                tabs[i].classList.add("needs-filter__item_active");
            else
                tabs[i].style.textDecoration = "underline";
    for (let v of document.getElementsByClassName(`is-military-${suffix}`))
        v.style.display = "none";
}, document.getElementsByClassName("needs-filter__item"));
lib.go(pane => {
    function arrow(clas, path, linkPage) {
        const [tag, color, href] = linkPage == null
            ? ["span", "#ccc", ""]
            : ["a", "#01B53E", `/${lib.lang}/news/?page=${linkPage}`];
        return `<${tag} class="${clas}" href="${href}">
           <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
               <path d="${path}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
           </svg>
       </${tag}>`;
    }
    const pages = [1, 2, 3], curIdx = Math.max(0, pages.findIndex(p => location.search.indexOf(`page=${p}`) > -1));
    [...document.querySelectorAll(".news__list > .col-md-6")].forEach((card, i) => card.style.display = i >= (6 * curIdx) && i < (6 * (curIdx + 1)) ? "block" : "none");
    var items = pages.map(p => p - 1 == curIdx
        ? `<span class="pagination__item pagination__item_active">${p}</span>`
        : `<a class="pagination__item" href="/${lib.lang}/news/?page=${p}">${p}</a>`);
    pane.innerHTML = `${arrow("pagination-btn_prev", "M6.15869 1.59766L1.65869 7.09766L6.15869 12.5977", curIdx == 0 ? null : curIdx - 1)}
   <div class="pagination__items-wr">${items.join('')}</div>
   ${arrow("pagination-btn_next", "M1.84131 12.4023L6.34131 6.90234L1.84131 1.40234", curIdx == pages.length - 1 ? null : curIdx + 1)}`;
}, document.getElementsByClassName("news__pagination")[0]);
lib.go(() => {
    const header = document.querySelector('header'), burgerBtn = document.getElementById('burger-btn'), mobileMenuWr = document.getElementById('menu_mobile-wr'), mobileMenu = document.getElementById('menu_mobile');
    for (const btn of document.querySelectorAll(".copy-wallet"))
        btn.addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const { innerText } = document.getElementById(e.currentTarget.dataset.walletid);
            yield navigator.clipboard.writeText(innerText);
            alert(lib.isEnglish ? "Copied to clipboard" : "Скопійовано");
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
lib.go((heroBg, heroContent) => {
    const calcHeroBgOffset = () => heroBg.style.top = window.matchMedia('(max-width: 575px)').matches
        ? `${heroContent.offsetHeight}px`
        : `0px`;
    window.onload = calcHeroBgOffset;
    window.onresize = calcHeroBgOffset;
}, document.getElementById('hero__background'), document.getElementById('hero__content'));
lib.go(() => {
    const modalTrigger = document.getElementById('modal-trigger');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal__content');
    const modalCloseBtn = document.getElementById('modal__close-btn');
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
lib.go((triggers, contents) => {
    for (const item of triggers)
        item.addEventListener('click', e => {
            e.preventDefault();
            const id = e.currentTarget.getAttribute('href').replace('#', '');
            for (var i = 0; i < triggers.length; i++) {
                const meth = contents[i].id == id ? "add" : "remove";
                triggers[i].classList[meth]('tabs-triggers__item_active');
                contents[i].classList[meth]('tabs-content__item_active');
            }
        });
    const current = [...triggers].find(_ => location.search.indexOf(_.href.split('#')[1]) > -1);
    if (current)
        current.click();
}, document.getElementsByClassName('tabs-triggers__item'), document.getElementsByClassName('tabs-content__item'));
lib.go(slider => {
    const figures = slider.getElementsByTagName("figure");
    let index = -1;
    function advance() {
        index++;
        if (index == figures.length)
            index = 0;
        for (let i = 0; i < figures.length; i++)
            figures[i].classList[i == index ? 'remove' : 'add']('hidd');
    }
    slider.addEventListener("click", e => {
        e.preventDefault();
        let { url } = figures[index].dataset;
        if (url)
            location.href = url;
    });
    var interval = setInterval(advance, 5000);
    advance();
}, document.getElementsByClassName("nslider")[0]);
lib.go(() => {
    for (const span of document.getElementsByClassName('numf')) {
        const num = parseInt(span.innerText, 10);
        if (!isNaN(num) && num > -1)
            span.innerHTML = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    function calcAges(tdate) {
        const now = new Date(), ageDifMs = now.getDate() - tdate, ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    const piskunovDisease = document.getElementById('piskunov-disease'), curYear = document.getElementById('cur-year');
    if (curYear)
        curYear.innerHTML = (new Date()).getFullYear().toString();
    if (piskunovDisease)
        piskunovDisease.innerHTML = calcAges(new Date("06/06/2005").getDate()).toString();
});
lib.go((form, butt) => {
    if (!form || !butt)
        return;
    const setStatus = text => document.getElementById("my-form-status").innerHTML = text;
    lib.listenInputs(form);
    butt.addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const [isValid, { Name, Mail, Message }] = lib.validateWithAlert([form, "Name Mail Message"]);
        if (!isValid)
            return;
        var [isSucc] = yield lib.fetchMiniback("feedback", {
            method: "POST",
            body: JSON.stringify({ Name, Mail, Message }),
            mode: "cors",
            headers: { Accept: 'application/json', "Content-Type": 'application/json' }
        }, lib.freezeeInputs(butt, form));
        if (isSucc) {
            setStatus(lib.isEnglish ? "✔️ Your message has been sent" : "✔️ Ваше повідомлення відправлено!");
            form.reset();
        }
        else
            setStatus(lib.isEnglish ? "❌ Something went wrong" : "❌ щось пішло не так");
    }));
}, document.getElementsByClassName("user-form")[0], document.getElementById("email-submit"));
lib.go(wraps => {
    var _a;
    for (const wrap of wraps) {
        const img = wrap.getElementsByTagName("picture")[0];
        const video = (_a = img === null || img === void 0 ? void 0 : img.dataset) === null || _a === void 0 ? void 0 : _a.video;
        if (!video || video == "null")
            continue;
        img.style.cursor = "pointer";
        img.addEventListener("click", e => {
            var _a, _b, _c;
            e.preventDefault();
            const name = (_b = (_a = wrap.getElementsByClassName("thanks-sign-text")[0]) === null || _a === void 0 ? void 0 : _a["innerText"]) !== null && _b !== void 0 ? _b : wrap.dataset.title, [w1, w2] = ((_c = wrap.getElementsByClassName("thank-descr")[0]) !== null && _c !== void 0 ? _c : wrap.getElementsByClassName("thank-descr-main")[0])["innerText"].split(' '), [, width, height] = video.split('_'), wind = window.open('', '_blank', `toolbar=no,menubar=no,status=yes,titlebar=0,resizable=yes,width=${width},height=${height}`);
            wind === null || wind === void 0 ? void 0 : wind.document.write(`<!doctype html><html><head><meta charset="UTF-8" />
               <title>${name}: ${w1} ${w2}...</title></head><body>
               <style>body { margin: 0; text-align: center; }</style>
               <div data-new-window>
                   <video controls autoplay style="width: 100%; height: auto;">
                       <source src="//${location.host}${video}" type="video/mp4" />
                   </video>
               </div>
           </body></html>`);
        });
    }
}, document.getElementsByClassName("thank-card-common"));
lib.go(radios => {
    const lookup = {};
    for (const item of radios) {
        const [v1, v2] = item.dataset.radioval.split(":"), [name, val] = v2 == undefined ? [item.name, v1] : [v1, v2];
        if (!(name in lookup))
            lookup[name] = {};
        if (!(val in lookup[name]))
            lookup[name][val] = [null, null];
        if (item instanceof HTMLButtonElement) {
            lookup[name][val][0] = item;
            item.addEventListener("click", e => {
                e.preventDefault();
                for (const keyval in lookup[name]) {
                    let [butt, div] = lookup[name][keyval];
                    if (keyval == val) {
                        div.style.display = "flex";
                        butt.classList.add("btn-pressed");
                    }
                    else {
                        div.style.display = "none";
                        butt.classList.remove("btn-pressed");
                    }
                }
            });
        }
        else {
            lookup[name][val][1] = item;
            lib.listenInputs(item);
        }
    }
}, document.getElementsByClassName("radioval"));
lib.go(sendButt => {
    const docform = document.getElementById("docform");
    lib.listenInputs(docform);
    sendButt.addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        const [form1, form2] = "recipient-type:0 recipient-type:1 contact-type:0 contact-type:1".split(" ")
            .map(key => document.querySelector(`[data-radioval="${key}"]`))
            .filter(_ => _.style.display != "none"), [isValid, fields] = lib.validateWithAlert([form1, "surname name parto birth ages phone passserial passnumber passtaker passdate phone phonename"], [form2, "postaddress postsurname postname postparto"], [docform, "doc"]);
        if (!isValid)
            return;
        const body = new FormData();
        body.append("file", document.getElementsByClassName("inp-doc")[0].files[0]);
        for (const nam in fields)
            body.append(nam, (_a = fields[nam]) !== null && _a !== void 0 ? _a : "");
        var [isSucc] = yield lib.fetchMiniback("helpreq", { method: "POST", body, mode: "cors" }, lib.freezeeInputs(sendButt, form1, form2, docform));
        if (isSucc) {
            if (confirm("Ваше повідомлення відправлено!"))
                location.href = "/";
            else
                location.href = "/";
        }
        else
            alert(lib.isEnglish ? "Something went wrong" : "щось пішло не так");
    }));
}, document.getElementById("seld-recipiet"));
