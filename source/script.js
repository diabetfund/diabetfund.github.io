
const lib = {

    _isEnglish: null,
    get isEnglish() {
        var {_isEnglish} = this;
        if (_isEnglish == null)
            this._isEnglish = _isEnglish = location.href.indexOf('/en') > -1;
        return _isEnglish; 
    },

    get cookEnglish() {
        var parts = ("; " + document.cookie).split("; is_english=");
        if (parts.length == 2)
            return parts.pop().split(";").shift() == 'true';
        return null;
    },
    set cookEnglish(v) {
        document.cookie =  "is_english=" + (v ? 'true': 'false') + "; expires=Fri, 3 Aug 2030 20:47:11 UTC; path=/";
    },

    get lang() { return this.isEnglish ? "en" : "ua"; },

    sendLiqpay(sign, data, isNewWindow) {
        var form = document.createElement("form");
        if (!sign || sign == "null")
            sign = this.isEnglish ? "8FCafqMc//6iKe9wB+eqZWs3FPc=" : "TVNsm5bs8KyxZhkpsexBFHb8Mb8=";
        if (!data || data == "null")
            data = this.isEnglish 
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
    }
};

setTimeout(() => {
    if (lib.cookEnglish != lib.isEnglish)
        lib.cookEnglish = lib.isEnglish;
}, 100);

[...document.querySelectorAll(".lang-switcher a")].forEach(a => 
    a.addEventListener("click", e => {
        e.preventDefault();
        lib.cookEnglish = e.currentTarget.href.indexOf('/en') > -1;
        location.href = e.currentTarget.href;
    }));

    
if (!lib.isEnglish)
    document.querySelector(".lang-switcher").classList.add("lang-switcher__active");


[...document.querySelectorAll('[data-liqpay]')].forEach(link => 
    link.addEventListener("click", e => {
        e.preventDefault();
        var [sign, data] = JSON.parse(e.currentTarget.dataset.liqpay);
        lib.sendLiqpay(sign, data, true);
    }));

[...document.querySelectorAll('[data-loc]')].forEach(el => 
    el.innerHTML = JSON.parse(el.dataset.loc)[lib.isEnglish ? 1 : 0]);

(() => {
    var folders = ["center", "aboutus", "about-diabetes", "fundraising", "thanks", "fun" ];

    var curFolder = folders.findIndex(f => location.pathname.indexOf(f) > -1);
    
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
})();


if (location.href.indexOf("/fundraising") > -1) {
    var search = location.search;
    var tabs = [...document.querySelectorAll(".needs-filter__item")];
    var tabIndex = Math.max(0, tabs.findIndex(a => a.href.indexOf(search) > -1));
    if (tabIndex > -1 && tabIndex < tabs.length)
        for(var i =0; i<tabs.length; i++)
            if (i == tabIndex)
                tabs[i].classList.add("needs-filter__item_active");
            else {
                tabs[i].style.textDecoration = "underline";
            }

    var suffix = ["none", "True", "False"][tabIndex];
    [...document.getElementsByClassName(`is-military-${suffix}`)].forEach(c => c.style.display = "none");
}

(pane => {
    if (!pane)
        return;
    
    function arrow(clas, path, linkPage) {
        var [tag, color, href] = linkPage == null ? ["span", "#ccc", ""] : ["a", "#01B53E", `/${lib.lang}/news/?page=${linkPage}`];
        return `<${tag} class="${clas}" href="${href}">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="${path}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        </${tag}>`;
    }
    var pages = [1, 2, 3];
    var curIdx = Math.max(0, pages.findIndex(p => location.search.indexOf(`page=${p}`) > -1));

    [...document.querySelectorAll(".news__list > .col-md-6")].forEach((card, i) =>
        card.style.display = i >= (6*curIdx) && i < (6*(curIdx+1)) ? "block": "none" );

    var items = pages.map(p => p-1 == curIdx
        ? `<span class="pagination__item pagination__item_active">${p}</span>`
        : `<a class="pagination__item" href="/${lib.lang}/news/?page=${p}">${p}</a>`);

    pane.innerHTML = `${arrow("pagination-btn_prev", "M6.15869 1.59766L1.65869 7.09766L6.15869 12.5977", curIdx==0 ? null : curIdx -1)}
    <div class="pagination__items-wr">${items.join('')}</div>
    ${arrow("pagination-btn_next", "M1.84131 12.4023L6.34131 6.90234L1.84131 1.40234", curIdx==pages.length-1 ? null : curIdx +1)}`;

})
(document.querySelector(".news__pagination"));

const header = document.querySelector('header')
const burgerBtn = document.getElementById('burger-btn')
const mobileMenuWr = document.getElementById('menu_mobile-wr')
const mobileMenu = document.getElementById('menu_mobile');

[...document.querySelectorAll(".copy-wallet")].forEach(btn => 
    btn.addEventListener("click", async e => {
        e.preventDefault();
        var copyText = document.getElementById(e.currentTarget.dataset.walletid).innerText
        await navigator.clipboard.writeText(copyText);
        alert(lib.isEnglish ? "Copied to clipboard" : "Скопійовано");
    }));

window.addEventListener('resize', function () {
    mobileMenuWr.style.top = `${header.offsetHeight}px`
})

window.addEventListener('load', function () {
    mobileMenuWr.style.top = `${header.offsetHeight}px`
})

burgerBtn.addEventListener('click', function () {
    this.classList.toggle('burger-btn_active')
    document.body.classList.toggle('o_h')
    mobileMenuWr.classList.toggle('menu_mobile_active')
});

[...mobileMenu.children].forEach(i => {
    if (i.classList.contains('dropdown'))
        i.addEventListener('click', function (e) {
            e.preventDefault()
            this.classList.toggle('dropdown_open')
        })
});

(([heroBg, heroContent]) => {
    if (heroBg && heroContent) {
        const calcHeroBgOffset = () =>
            heroBg.style.top = window.matchMedia('(max-width: 575px)').matches
                ? `${heroContent.offsetHeight}px`
                : `0px`;

        window.onload = calcHeroBgOffset
        window.onresize = calcHeroBgOffset
    }
})([
    document.getElementById('hero__background'),
    document.getElementById('hero__content')
]);


const modalTrigger = document.getElementById('modal-trigger')
const modal = document.getElementById('modal')
const modalContent = document.getElementById('modal__content')
const modalCloseBtn = document.getElementById('modal__close-btn')
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
const showDocumentBtn = document.getElementById('show-document-btn')
const documentModal = document.getElementById('document-modal')
const documentModalContent = document.getElementById('document-modal__content')
const closeDocumentBtn = document.getElementById('document-modal__close-btn')
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

(([triggers, contents]) => {
    triggers.forEach(item =>
        item.addEventListener('click', function (e) {
            e.preventDefault()
            const id = e.target.getAttribute('href').replace('#', '');
            for (var i = 0; i < triggers.length; i++) {
                var meth = contents[i].id == id ? "add" : "remove";
                triggers[i].classList[meth]('tabs-triggers__item_active');
                contents[i].classList[meth]('tabs-content__item_active');
            }
        }))
    
    var current = [...triggers].find(_=> location.search.indexOf(_.href.split('#')[1]) > -1);
    if (current)
        current.click();
})([
    document.querySelectorAll('.tabs-triggers__item'),
    document.querySelectorAll('.tabs-content__item')
]);


const articleContent = document.getElementById('article__content');
if (articleContent) {
    const allImages = articleContent.querySelectorAll('img')
    allImages.forEach(img => {
        if (img.classList.length === 0 && img.nextSibling?.localName === 'img') {
            const imagesWr = document.createElement('div')
            imagesWr.classList.add('article__images-wr')

            img.parentNode.insertBefore(imagesWr, img)

            const secondImg = img.nextSibling
            imagesWr.appendChild(img)
            imagesWr.appendChild(secondImg)
        }
    })
}

var sliderLib = (([slider, suppButton, moreButton, mask]) => {
    if (!slider)
        return {};
    const slideArray = 
        [...document.querySelectorAll('.slider div')].map(({dataset: set}) =>
        [set.background, set.backgroundmini, JSON.parse(set.liqpay), set.dark]);

    let curSlideIndex = -1;
    const curCaption = () => document.querySelector('.caption-' + (curSlideIndex));
    
    var interval = null;
    function advance() {
        curSlideIndex++;

        if (curSlideIndex >= slideArray.length)
            curSlideIndex = 0;
            
        let url = slideArray[curSlideIndex][window.screen.width > 600 ? 0 : 1];
        slider.style.cssText = `background: url("${url}") no-repeat center center; background-size: cover;`;

        const elems = document.getElementsByClassName('caption');
        for (let i = 0; i < elems.length; i++) 
            elems[i].style.cssText = 'opacity: 0;';

        curCaption().style.cssText = 'opacity: 1;';
        //mask.style.background = `rgba(0, 0, 0, 0.${slideArray[curSlideIndex][3]})`;
    }
    var stop = () => clearInterval(interval);
    var start = () => interval = setInterval(advance, 5000);
    advance();
    start();

    suppButton.addEventListener("click", e => {
        e.preventDefault();
        var [sign, data] = slideArray[curSlideIndex][2];
        lib.sendLiqpay(sign, data, true);
    })

    moreButton.addEventListener("click", e => {
        e.preventDefault();
        location.href = curCaption().dataset.href;
    })
    return { start, stop };
    
})([
    document.querySelector('.slider'),
    document.getElementById('supp-slide'),
    document.getElementById('more-slide'),
    document.getElementById('slide-mask')
]);

(images => {
    if (images.length < 3)
    return;
    var current = { index: 0 };
    function appStyles() {
        for(var i=0 ; i < images.length; i++){
            var { classList, style, dataset: {val} } = images[i];
            if (i == current.index) {
                classList.add('main-partner-sel');
                style.cursor = null;

                let [name, descr] = JSON.parse(val);
                document.querySelector(".af_name").innerHTML = name;
                document.querySelector(".af_descr").innerHTML = descr;
            }
            else {
                classList.remove('main-partner-sel');
                style.cursor = "pointer";
            }
        }
    }
    appStyles();
    images.forEach((img, i) =>
        img.addEventListener("click", () => {
            if (i != current.index){
                current.index = i;
                appStyles();
            }
        }));
})([...document.querySelectorAll('.about-fund__img_rest')]);

[...document.querySelectorAll('.numf')].forEach(span => {
    var num = parseInt(span.innerText, 10);
    if (!isNaN(num) && num > -1)
        span.innerHTML = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
});

function calcAges(tdate){
    var now = new Date(), ageDifMs = now - tdate, ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

(() => {
    let piskunovDisease = document.getElementById('piskunov-disease'),
    curYear = document.getElementById('cur-year');
    if (curYear)
       curYear.innerHTML = (new Date()).getFullYear().toString();
    if (piskunovDisease)
        piskunovDisease.innerHTML = calcAges(new Date("06/06/2005")).toString();
})();

(([form, butt]) => {
    if (!form || !butt)
        return;
    var setStatus = text => document.getElementById("my-form-status").innerHTML =text;
    
    butt.addEventListener("click", async e => {
        e.preventDefault();
        try {
            var response = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: 'application/json' } })
            if (response.ok) {
                setStatus(lib.isEnglish ? "Your message has been sent": "Ваше повідомлення відправлено!");
                form.reset()
            } 
            else {
                var data = await response.json()
                setStatus(Object.hasOwn(data, 'errors')
                ? data.errors.map(_=>_.message).join(", ")
                : lib.isEnglish ? "Something went wrong": "щось пішло не так")
            }
        }
        catch(error) { 
            setStatus(lib.isEnglish ? "Something went wrong": "щось пішло не так");
        }
    });

})([
    document.getElementsByClassName("user-form")[0],
    document.getElementById("email-submit")
]);

(images => {
    if (images.length == 0)
        return;
    Array.prototype.filter.call(images,({dataset: {video}}) => video && video != "null")
        .forEach(img => {
            img.style.cursor = "pointer";
            
            img.addEventListener("click", e => {
                e.preventDefault();
                var parent = img.parentNode;
                var name = parent.querySelector(".thanks-sign-text")?.innerText ?? parent.dataset.title;
                var [w1, w2] = (parent.querySelector(".thank-descr") ?? parent.querySelector(".thank-descr-main")).innerText.split(' ');
                var link = img.dataset.video;
                var [, width, height] = link.split('_');

                var wind = window.open('', '_blank', `toolbar=no,menubar=no,status=yes,titlebar=0,resizable=yes,width=${width},height=${height}`);
                wind.document.write(`<!doctype html><html><head><meta charset="UTF-8" />
                    <title>${name}: ${w1} ${w2}...</title></head><body>
                    <style>body { margin: 0; text-align: center; }</style>
                    <div data-new-window>
                        <video controls autoplay style="width: 100%; height: auto;">
                            <source src="//${location.host}${link}" type="video/mp4" />
                        </video>
                    </div>
                </body></html>`);
            });
        });
})(document.querySelectorAll(".thank-card-common img"));

(radios => {
    if (radios.length == 0)
        return;
        
    var lookup = {};
    Array.prototype.forEach.call(radios, item => {
        var [v1, v2] = item.dataset.radioval.split(":");
        var [name, val] = v2 == undefined ? [item.name, v1] : [v1, v2];
        if (!(name in lookup))
        lookup[name] = {};
        if (!(val in lookup[name]))
        lookup[name][val] = [null, null];

        if (item.tagName == "BUTTON") {
            lookup[name][val][0] = item;

            item.addEventListener("click", e => {
                e.preventDefault();
                Object.entries(lookup[name]).forEach(([keyval, [butt, div]]) => {
                    if (keyval == val) {
                        div.style.display = "flex";
                        butt.classList.add("btn-pressed");
                    }
                    else {
                        div.style.display = "none";
                        butt.classList.remove("btn-pressed");
                    }
                });
            });
        }
        else {
            lookup[name][val][1] = item;

            Array.prototype.forEach.call(item.querySelectorAll("input"), inp => 
                inp.addEventListener("change", e => e.currentTarget.classList.remove("inp-err")));
        }
    });


})(document.querySelectorAll("[data-radioval]"));

(sendButt => {
    if (!sendButt)
    return;

    function invalidate(form, fieldLine) {
        var res = {};
        var isvalid = true;
        fieldLine.split(" ").forEach(field => {
            var inp = form.querySelector(`[name="${field}"]`);
            if (inp) 
                if (!inp.value) {
                    isvalid = false;
                    inp.classList.add("inp-err");
                }
                else
                    res[field] = inp.value
        });
        return [isvalid, res];
    }

    sendButt.addEventListener("click", async e => {
        e.preventDefault();
        var form = e.currentTarget.parentNode;
        var [form1, form2] = "recipient-type:0 recipient-type:1 contact-type:0 contact-type:1"
                        .split(" ")
                        .map(key => document.querySelector(`[data-radioval="${key}"]`))
                        .filter(_ => _.style.display != "none");

        var [isvalid1, {
            surname, name, parto, birth, ages, phone, 
            passserial, passnumber, passtaker, passdate, 
            phonename = "мой номер", birthplace = "дорослий"
        }] = invalidate(form1, "surname name parto birth ages phone passserial passnumber passtaker passdate surname phonename");

        var [isvalid2, {postaddress, postsurname = "", postname= "", postparto= ""} ] = 
            invalidate(form2, "postaddress postsurname postname postparto");

        if (isvalid1 && isvalid2) {
            try {
                form.querySelector("[name='message']").value =  `${surname} ${name} ${parto}

                ${birth}, ${ages} рокiв, ${birthplace}
                
                ${passserial} ${passnumber}, ${passdate}, ${passtaker}
                ${phone} (${phonename})
                ==========
                ${postaddress}
                ${postsurname} ${postname} ${postparto}`;



                var response = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: 'application/json' } })
                if (response.ok) {
                    if (confirm("Ваше повідомлення відправлено!"))
                        location.href="/";
                    else
                        location.href="/";
                } 
                else {
                    var data = await response.json()
                    alert(Object.hasOwn(data, 'errors')
                    ? data.errors.map(_=>_.message).join(", ")
                    : lib.isEnglish ? "Something went wrong": "щось пішло не так")
                }
            }
            catch(error) { 
                alert(lib.isEnglish ? "Something went wrong": "щось пішло не так");
            }
        }
        else {
            alert("Не всі дані заповнені");
        }
    });
})(document.getElementById("seld-recipiet"));