
const lib = {
    get isEnglish() {
        var parts = ("; " + document.cookie).split("; is_english=");
        if (parts.length == 2)
            return parts.pop().split(";").shift() == 'true';
  
        var val = location.href.indexOf('/en') > -1;
        setTimeout(() => lib.isEnglish = val, 50);
        return val;
    },
    set isEnglish(v) {
        document.cookie =  "is_english=" + (v ? 'true': 'false') + "; expires=Fri, 3 Aug 2030 20:47:11 UTC; path=/";
    },

    _lang: null,
    get lang() {
        let {_lang} = this
        if (_lang == null)
            this._lang = _lang = this.isEnglish ? "en" : "ua";
        return _lang;
    },

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

[...document.querySelectorAll(".lang-switcher a")].forEach(a => 
    a.addEventListener("click", e => {
        e.preventDefault();
        lib.isEnglish = e.currentTarget.href.indexOf('/en') > -1;
        location.href = e.currentTarget.href;
    }));

[...document.querySelectorAll('[data-liqpay]')].forEach(link => 
    link.addEventListener("click", e => {
        e.preventDefault();
        var [sign, data] = JSON.parse(e.currentTarget.dataset.liqpay);
        lib.sendLiqpay(sign, data, true);
    }));

 
var folders = ["center", "aboutus", "about-diabetes", "fundraising", "thanks" ];

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

if (!lib.isEnglish)
    document.querySelector(".lang-switcher").classList.add("lang-switcher__active");

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

function pageArrow(clas, path, linkPage) {
    var [tag, color, href] = linkPage == null ? ["span", "#ccc", ""] : ["a", "#01B53E", `/${lib.lang}/news/?page=${linkPage}`];
    return `<${tag} class="${clas}" href="${href}">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="${path}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    </${tag}>`;
}

var paginationPane = document.querySelector(".news__pagination")
if (paginationPane){
    var pages = [1, 2, 3];
    var curIdx = Math.max(0, pages.findIndex(p => location.search.indexOf(`page=${p}`) > -1));

    [...document.querySelectorAll(".news__list > .col-md-6")].forEach((card, i) =>
        card.style.display = i >= (6*curIdx) && i < (6*(curIdx+1)) ? "block": "none" );

    var items = pages.map(p => p-1 == curIdx
        ? `<span class="pagination__item pagination__item_active">${p}</span>`
        : `<a class="pagination__item" href="/${lib.lang}/news/?page=${p}">${p}</a>`);

    paginationPane.innerHTML = `${pageArrow("pagination-btn_prev", "M6.15869 1.59766L1.65869 7.09766L6.15869 12.5977", curIdx==0 ? null : curIdx -1)}
    <div class="pagination__items-wr">${items.join('')}</div>
    ${pageArrow("pagination-btn_next", "M1.84131 12.4023L6.34131 6.90234L1.84131 1.40234", curIdx==pages.length-1 ? null : curIdx +1)}`;
}

const header = document.querySelector('header')
const burgerBtn = document.getElementById('burger-btn')
const mobileMenuWr = document.getElementById('menu_mobile-wr')
const mobileMenu = document.getElementById('menu_mobile')

const copyBtn = document.getElementById('copyBtn')
if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard)
}

function copyToClipboard() {
    const copyText = document.getElementById(`${lib.isEnglish ? "usd" : "uah"}Account`).innerText
    navigator.clipboard.writeText(copyText).then(() => {
        alert("Copied to clipboard")
    })
}

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
    if (i.classList.contains('dropdown')) {
        i.addEventListener('click', function (e) {
            e.preventDefault()
            this.classList.toggle('dropdown_open')
        })
    }
})

const heroBg = document.getElementById('hero__background')
const heroContent = document.getElementById('hero__content')
window.onload = calcHeroBgOffset
window.onresize = calcHeroBgOffset

function calcHeroBgOffset() {
    if (heroBg && window.matchMedia('(max-width: 575px)').matches) {
        heroBg.style.top = `${heroContent.offsetHeight}px`
    } else {
        if (heroBg) {
            heroBg.style.top = `0px`
        }
    }
}

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
})([document.querySelectorAll('.tabs-triggers__item'), document.querySelectorAll('.tabs-content__item')]);



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

(slider => {
    if (!slider)
        return;
    const slideArray = 
        [...document.querySelectorAll('.slider div')].map(({dataset: set}) => [set.background, set.backgroundmini]);

    let curSlideIndex = -1;
    const curCaption = () => document.querySelector('.caption-' + (curSlideIndex));
    
    function advanceSliderItem() {
        curSlideIndex++;

        if (curSlideIndex >= slideArray.length)
            curSlideIndex = 0;
            
        let url = slideArray[curSlideIndex][window.screen.width > 600 ? 0 : 1];
        slider.style.cssText = 'background: url("' + url + '") no-repeat center center; background-size: cover;';

        const elems = document.getElementsByClassName('caption');
        for (let i = 0; i < elems.length; i++) 
            elems[i].style.cssText = 'opacity: 0;';

        curCaption().style.cssText = 'opacity: 1;';
    }
    advanceSliderItem();
    setInterval(advanceSliderItem, 5000);

    slider.addEventListener("click", () => location.href = curCaption().dataset.href);

})(document.querySelector('.slider'));

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

(() => {
    let piskunovDisease = document.getElementById('piskunov-disease'),
    curYear = document.getElementById('cur-year'),
    now = new Date(),
    ageDifMs = now - new Date("06/06/2005"),
    ageDate = new Date(ageDifMs),
    piskunovDiseaseAges = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (curYear)
       curYear.innerHTML = now.getFullYear().toString();
    if (piskunovDisease)
        piskunovDisease.innerHTML = piskunovDiseaseAges.toString();
})();

(([form, butt]) => {
    if (!form || !butt)
        return;
    var setStatus = text => document.getElementById("my-form-status").innerHTML =text;
    
    butt.addEventListener("click", e => {
        e.preventDefault();
        fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(response => {
          if (response.ok) {
            setStatus(lib.isEnglish ? "Your message has been sent": "Ваше повідомлення відправлено!");
            form.reset()
          } 
          else
            response.json().then(data =>
              setStatus(Object.hasOwn(data, 'errors')
                ? data.errors.map(_=>_.message).join(", ")
                : lib.isEnglish ? "Something went wrong": "щось пішло не так"))
        })
        .catch(error => setStatus(lib.isEnglish ? "Something went wrong": "щось пішло не так"));
    });

})([document.getElementsByClassName("user-form")[0], document.getElementById("email-submit")]);