var password = document.querySelector("#myPass");

function valid(item , validIcon , invalidIcon){
    const text = document.querySelector(`#${item}`);
    text.style.opacity = "1";
    const validIcons = document.querySelector(`#${item} .${validIcon}`);
    validIcons.style.opacity='1';
    const invalidIcons = document.querySelector(`#${item} .${invalidIcon}`);
    invalidIcons.style.opacity="0";
}

function invalid(item , validIcon , invalidIcon){
    const text = document.querySelector(`#${item}`);
    text.style.opacity = "0.5";
    const validIcons = document.querySelector(`#${item} .${validIcon}`);
    validIcons.style.opacity='0';
    const invalidIcons = document.querySelector(`#${item} .${invalidIcon}`);
    invalidIcons.style.opacity="1";
}

function textChange(){
    if(password.value.match(/[A-Z]/) != null)
        valid('capital' , 'fa-check' , 'fa-times');
    else
        invalid('capital' , 'fa-check' , 'fa-times');

    if(password.value.match(/[0-9]/) != null)
        valid('number' , 'fa-check' , 'fa-times');
    else
        invalid('number' , 'fa-check' , 'fa-times');
    
    if(password.value.match(/[!@#$%^&*]/) != null)
        valid('special-char' , 'fa-check' , 'fa-times');
    else
        invalid('special-char' , 'fa-check' , 'fa-times');

    if(password.value.length >= 8)
        valid('more-than-8' , 'fa-check' , 'fa-times');
    else
        invalid('more-than-8' , 'fa-check' , 'fa-times');
}