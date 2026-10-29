// Event Listener 
document.querySelector('.settings').addEventListener('click' , () => {
    document.querySelector('.settings-pop-up-container').classList.toggle('settings-on');
});

document.querySelector('.add-report').addEventListener('click' , () => {
    document.querySelector('.side-overlay').classList.add('add-overlay');
});

document.querySelector('.exit-report-modal').addEventListener('click' , () => {
    document.querySelector('.side-overlay').classList.remove('add-overlay');
});

document.querySelectorAll('.category-choices-container').forEach((option) => { 
    option.addEventListener('click', () => {
        document.querySelectorAll('.category-choices-container').forEach((selected) => {
            selected.classList.remove('category-choice-active');
        });

        option.classList.add('category-choice-active');
    });
});

// .step-three-container-active 
const stepThreeOptions = document.querySelectorAll('.step-three-choice');

stepThreeOptions.forEach((option) => {
    option.addEventListener('click', () => {
        stepThreeOptions.forEach((other) => {
            other.classList.remove('step-three-choice-active');
            const otherRadio = other.querySelector("input[type='radio']");
            if (otherRadio) otherRadio.checked = false;
        });

        option.classList.add('step-three-choice-active');

        const radio = option.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
    });
});
