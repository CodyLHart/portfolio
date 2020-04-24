const body = document.querySelector('body');
const bodyFill = document.querySelector('.body-fill')

const cards = [surdC, wsgC, ahrsC, crcC, bgC, metaC]
let cardShowing = false;

body.addEventListener('click', (e) => {
    if (e.target.classList.contains('card')) return;
    if (cardShowing && !e.target.classList.contains('details-card')) {
        cards.forEach(card => {
            if (!card.classList.contains('hidden')) {
                toggleVis(card);
            };
        });
        toggleVis(bodyFill);
        cardShowing = false;
    } else {
        if (e.target.id[e.target.id.length - 1] === 'T') {
            let card = e.target.id.slice(0, (e.target.id.length - 1));
            console.log(card);
            toggleVis(document.querySelector(`#${card}C`));
            toggleVis(bodyFill)
            cardShowing = true;
        };
    } 
})

function toggleVis(el) {
    if (el.classList.contains('hidden')){
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    };
}


//---------- CYCLING OF LANDING PAGE WORDS ----------//

function updateWhatIAm() {
    let divs = document.querySelectorAll('.whatiam')
    // console.log(divs)
    for (let i = 0; i < divs.length; i++) {
        if (!divs[i].classList.contains('hidden')){
            divs[i].classList.add('hidden');
            divs[i+1].classList.remove('hidden');
            return;
        };
    };
}

setTimeout(function(){updateWhatIAm()}, 600);
setTimeout(function(){updateWhatIAm()}, 825);
setTimeout(function(){updateWhatIAm()}, 1025);
setTimeout(function(){updateWhatIAm()}, 1225);
setTimeout(function(){updateWhatIAm()}, 1400);
setTimeout(function(){updateWhatIAm()}, 1575);
setTimeout(function(){updateWhatIAm()}, 1750);
setTimeout(function(){updateWhatIAm()}, 1925);
setTimeout(function(){updateWhatIAm()}, 2100);
setTimeout(function(){updateWhatIAm()}, 2250);
setTimeout(function(){updateWhatIAm()}, 2400);
setTimeout(function(){updateWhatIAm()}, 2550);
setTimeout(function(){updateWhatIAm()}, 2700);
setTimeout(function(){updateWhatIAm()}, 2825);
setTimeout(function(){updateWhatIAm()}, 2950);
setTimeout(function(){updateWhatIAm()}, 3075);
setTimeout(function(){updateWhatIAm()}, 3200);
setTimeout(function(){updateWhatIAm()}, 3450);
setTimeout(function(){updateWhatIAm()}, 3575);
setTimeout(function(){updateWhatIAm()}, 3700);
setTimeout(function(){updateWhatIAm()}, 3825);
setTimeout(function(){updateWhatIAm()}, 3950);
setTimeout(function(){updateWhatIAm()}, 4075);
setTimeout(function(){updateWhatIAm()}, 4200);
setTimeout(function(){updateWhatIAm()}, 4325);
setTimeout(function(){updateWhatIAm()}, 4450);
setTimeout(function(){updateWhatIAm()}, 4575);
setTimeout(function(){updateWhatIAm()}, 4700);


