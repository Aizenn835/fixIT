
document.querySelector('.settings').addEventListener('click' , () => {
    document.querySelector('.settings-pop-up-container').classList.toggle('settings-on');
})

document.querySelector('.add-report').addEventListener('click' , () => {
    document.querySelector('.side-overlay').classList.add('add-overlay');
})

document.querySelector('.exit-report-modal').addEventListener('click' , () => {
    document.querySelector('.side-overlay').classList.remove('add-overlay');
})