
const isEnglish = {
    get val() {
       var parts = ("; " + document.cookie).split("; is_english=");
       if (parts.length == 2)
         return parts.pop().split(";").shift() == 'true';
 
       return location.href.indexOf('/ua') < 0
    },
    set val(v) {
       document.cookie =  "is_english=" + (v ? 'true': 'false') + "; expires=Fri, 3 Aug 2030 20:47:11 UTC; path=/";
    }
 };

[...document.querySelectorAll(".lang-switcher a")].forEach(a => 
    a.addEventListener("click", e => {
        e.preventDefault();
        isEnglish.val = e.currentTarget.href.indexOf('/en') > -1;
        location.href = e.currentTarget.href;
    })
);

 
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

if (!isEnglish.val)
    document.querySelector(".lang-switcher").classList.add("lang-switcher__active");

if (location.href.indexOf("/fundraising") > -1) {
    [...document.getElementsByClassName("need-donate")].forEach(subscribeNeedsDonate)

    var search = location.search;
    var tabs = [...document.querySelectorAll(".needs-filter__item")];
    var tabIndex = Math.max(0, tabs.findIndex(a => a.href.indexOf(search) > -1));
    if (tabIndex > -1 && tabIndex < tabs.length)
        tabs[tabIndex].classList.add("needs-filter__item_active");
    
    var suffix = ["none", "True", "False"][tabIndex];
    [...document.getElementsByClassName(`is-military-${suffix}`)].forEach(c => c.style.display = "none");
}

function pageArrow(clas, path, linkPage) {
    var lang = isEnglish.val ? 'en' : 'ua';
    var [tag, color, href] = linkPage == null ? ["span", "#ccc", ""] : ["a", "#01B53E", `/${lang}/news/?page=${linkPage}`];
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

    var lang = isEnglish.val ? 'en' : 'ua';

    var items = pages.map(p => p-1 == curIdx
        ? `<span class="pagination__item pagination__item_active">${p}</span>`
        : `<a class="pagination__item" href="/${lang}/news/?page=${p}">${p}</a>`);

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
    const copyText = document.getElementById(`${isEnglish.val ? "usd" : "uah"}Account`).innerText
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

const fundraisingItemsDonateBtns = [...document.getElementsByClassName('fundraising-item__donate-btn')]
const fundraisingItemsDonateForm = document.getElementById('fundraising-item__donate-form')
fundraisingItemsDonateBtns.forEach(b => {
    b.addEventListener('click', function (e) {
        fundraisingItemsDonateForm.querySelector('form').setAttribute('target', '_blank')
        fundraisingItemsDonateForm.querySelector('form').submit()
    })
})

/*donate-button*/
const donateButtons = [...document.getElementsByClassName('donate-button')]
const hiddenFormWr = document.getElementById('hidden-form')
const hiddenForm = hiddenFormWr.querySelector('form')

donateButtons.forEach(b => {
    b.addEventListener('click', function (e) {
        e.preventDefault()
        hiddenForm.setAttribute('target', '_blank')
        hiddenForm.submit()
    })
})

const tabsTriggers = document.querySelectorAll('.tabs-triggers__item')
const tabsContents = document.querySelectorAll('.tabs-content__item')

function activateTab (item, id) {
    tabsTriggers.forEach(child => {
        child.classList.remove('tabs-triggers__item_active')
    })

    tabsContents.forEach(child => {
        child.classList.remove('tabs-content__item_active')
    })

    item.classList.add('tabs-triggers__item_active')
    document.getElementById(id).classList.add('tabs-content__item_active')
}

if (tabsTriggers) {
    tabsTriggers.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault()
            const id = e.target.getAttribute('href').replace('#', '')
            activateTab(item, id);
        })
    })

}

if (document.querySelector('.tabs-triggers__item')) {
    var items = [...document.getElementsByClassName("tabs-triggers__item")]
    var current = items.find(_=> location.search.indexOf(_.href.split('#')[1]) > -1) || items[0];
    current.click();
}

const articleContent = document.getElementById('article__content')
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

function subscribeNeedsDonate(b){
    b.addEventListener('click', function (e) {
        e.preventDefault()
        const form = b.nextElementSibling.querySelector('form')
        form.setAttribute('target', '_blank')
        form.submit()
    })
}

const needsDonateBtns = [...document.getElementsByClassName('needs-donate-btn')]
if (needsDonateBtns)
    needsDonateBtns.forEach(subscribeNeedsDonate);

(slider => {
    if (!slider)
    return;
    const slideArray = 
        [...document.querySelectorAll('.slider div')].map(({dataset: set}) => [set.background, set.backgroundmini]);

    let curSlideIndex = -1;
    const curCaption = () => document.querySelector('.caption-' + (curSlideIndex));
    
    function advanceSliderItem() {
        curSlideIndex++;

        if (curSlideIndex >= slideArray.length) {
            curSlideIndex = 0;
        }
        let url = slideArray[curSlideIndex][window.screen.width > 400 ? 0 : 1];
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
        for(var i =0 ; i < images.length; i++){
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
    ageDate = new Date(ageDifMs); 
    piskunovDiseaseAges = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (curYear)
       curYear.innerHTML = now.getFullYear().toString();
    if (piskunovDisease)
        piskunovDisease.innerHTML = piskunovDiseaseAges.toString();
})();