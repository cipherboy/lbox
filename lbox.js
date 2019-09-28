"use strict";

window.lboxConfig = {
    "images": [
        {
            "src": "img/boston.jpg",
        },
        {
            "src": "img/chinatown.jpg",
            "footer": "Five Spice Restaurant in Boston's Chinatown. Shot at night on a Nikon D750 with 22mm lense."
        },
    ],
    "header": "Copyright (C) Katherine Mayo. All Rights Reserved.",
    "image": 0
};

function getImage() {
    let id = window.lboxConfig["image"]
    return window.lboxConfig["images"][id]["_image_foreground"];
}

function getBackground() {
    let id = window.lboxConfig["image"]
    return window.lboxConfig["images"][id]["_image_background"];
}

function imageDetails(horizontal, vertical) {
    let lboxImage = getImage();

    let aspect_ratio_hw = lboxImage.naturalHeight / lboxImage.naturalWidth;
    let aspect_ratio_wh = lboxImage.naturalWidth / lboxImage.naturalHeight;

    let available_height = window.innerHeight - 2*vertical;
    let available_width = window.innerWidth - 2*horizontal;

    let computed_height = aspect_ratio_hw * available_width;
    let computed_width = aspect_ratio_wh * available_height;

    if (computed_height > window.innerHeight) {
        let remaining_width = window.innerWidth - computed_width;
        return [computed_width, available_height, remaining_width/2, vertical];
    }

    let remaining_height = window.innerHeight - computed_height;

    return [available_width, computed_height, vertical, remaining_height/2];
}

function backgroundSize() {
    let lboxBackground = getBackground();

    let aspect_ratio_hw = lboxBackground.naturalHeight / lboxBackground.naturalWidth;
    let aspect_ratio_wh = lboxBackground.naturalWidth / lboxBackground.naturalHeight;

    let available_height = window.innerHeight;
    let available_width = window.innerWidth;

    let computed_height = aspect_ratio_hw * available_width;
    let computed_width = aspect_ratio_wh * available_height;

    if (computed_height < window.innerHeight) {
        return [computed_width, available_height];
    }
    return [available_width, computed_height];
}

function onImageLoaded(img, callback, data) {
    if (img.complete) {
        callback(data);
    } else {
        img.addEventListener('load', function() {
            callback(data);
        });
    }
}

function viewOne() {
    let imageNum = window.lboxConfig['image'];
    let imgObj = window.lboxConfig['images'][imageNum];
    let imgSrc = imgObj['src'];

    let lboxImage = document.getElementById('lboxImage');
    if (lboxImage != null) {
        lboxImage.style.display = 'none';
        lboxImage.removeAttribute('id');
        lboxImage.classList.remove('visible');
        lboxImage.removeEventListener('mouseout', showInfo);
        lboxImage.removeEventListener('mouseover', hideInfo);
    }

    let lboxBackground = document.getElementById('lboxBackground');
    if (lboxBackground != null) {
        lboxBackground.style.display = 'none';
        lboxBackground.removeAttribute('id');
    }

    imgObj['_image_foreground'].setAttribute('id', 'lboxImage');
    imgObj['_image_background'].setAttribute('id', 'lboxBackground');

    lboxImage = imgObj['_image_foreground'];
    lboxBackground = imgObj['_image_background'];

    lboxBackground.style.display = 'none';
    lboxImage.style.display = 'none';
    onImageLoaded(lboxImage, restyleImage);
    onImageLoaded(lboxImage, restyleHeader);
    onImageLoaded(lboxImage, restyleFooter);
    onImageLoaded(lboxBackground, restyleBackground, null);
}

function lboxInit() {
    for (let image of window.lboxConfig['images']) {
        let foreground = new Image();
        foreground.src = image['src'];
        foreground.style.zIndex = '0';
        lbox.append(foreground);

        let background = new Image();
        background.src = image['src'];
        background.style.zIndex = '0';
        lbox.append(background);


        image['_image_background'] = foreground;
        image['_image_foreground'] = background;
    }
    viewOne();

    window.addEventListener("keyup", function(evt) {
        let amount = 0;
        if (evt.key == "Left" || evt.key == "ArrowLeft") {
            if (evt.repeat) {
                amount = -5;
            } else {
                amount = -1;
            }
        } else if (evt.key == "Right" || evt.key == "ArrowRight") {
            if (evt.repeat) {
                amount = 5;
            } else {
                amount = 1;
            }
        }

        let cur = window.lboxConfig['image'];
        let num = window.lboxConfig['images'].length;
        let next = (((cur + amount) % num) + num) % num;

        window.lboxConfig['image'] = next;
        viewOne();
    });

    window.addEventListener("resize", function() {
        restyleEverything();
    });
}

function showInfo() {
    if (lboxHeader.innerText != '') {
        lboxHeader.style.display = 'block';
    }

    if (lboxFooter.innerText != '') {
        lboxFooter.style.display = 'block';
    }
}

function hideInfo() {
    lboxHeader.style.display = 'none';
    lboxFooter.style.display = 'none';
}

function getHeader(imageNum) {
    if ("header" in lboxConfig["images"][imageNum]) {
        return lboxConfig["images"][imageNum]["header"];
    } else if ("header" in lboxConfig) {
        return lboxConfig["header"];
    }

    return "";
}

function headerSpace(imageNum) {
    if (getHeader(imageNum) != "") {
        return 125;
    }
    return 0;
}

function getFooter(imageNum) {
    if ("footer" in lboxConfig["images"][imageNum]) {
        return lboxConfig["images"][imageNum]["footer"];
    } else if ("footer" in lboxConfig) {
        return lboxConfig["footer"];
    }

    return ""
}

function footerSpace(imageNum) {
    if (getFooter(imageNum) != "") {
        return 225;
    }

    return 0;
}

function restyleEverything() {
    let lboxImage = getImage();
    let lboxBackground = getBackground();

    restyleBackground();
    restyleImage();
    restyleHeader();
    restyleFooter();
}

function restyleImage() {
    let lboxImage = getImage();

    let imageNum = window.lboxConfig['image'];
    let horizontalOffset = 50;
    let verticalOffset = 25;

    let lDetails = imageDetails(horizontalOffset, verticalOffset);
    let iWidth = lDetails[0];
    let iHeight = lDetails[1];
    let iLeft = lDetails[2];
    let iTop = lDetails[3];

    lboxImage.style.width = iWidth + 'px';
    lboxImage.style.height = iHeight + 'px';
    lboxImage.style.position = 'fixed';
    lboxImage.style.left = iLeft + 'px';
    lboxImage.style.top = iTop + 'px';
    lboxImage.style.zIndex = '20';
    lboxImage.style.display = 'block';

    lboxImage.style.border = "1px solid #ffffff44";

    if (!lboxImage.classList.contains('visible')) {
        lboxImage.style.opacity = '0';
        lboxImage.style.display = 'block';

        setTimeout(function() {
            lboxImage.classList.add('visible');
        }, 10);

        lboxImage.addEventListener("mouseover", showInfo);
        lboxImage.addEventListener("mouseout", hideInfo);
    }
}

function restyleHeader() {
    let lboxImage = getImage();

    let imageNum = window.lboxConfig['image'];
    let header = getHeader(imageNum);

    let text = new Paragraph();
    text.innerText = text;

    lboxHeader.innerText = header;
    if (header == "") {
        lboxHeader.style.display = 'none';
        return;
    }

    lboxHeader.style.top = lboxImage.style.top;
    lboxHeader.style.left = ((window.innerWidth - lboxImage.width)/2) + "px";
    lboxHeader.style.width = lboxImage.width + "px";
    lboxHeader.style.height = '75px';
    lboxHeader.style.lineHeight = '70px';
}

function restyleFooter() {
    let lboxImage = getImage();

    let imageNum = window.lboxConfig['image'];
    let footer = getFooter(imageNum);

    lboxFooter.innerText = footer;
    if (footer == "") {
        lboxFooter.style.display = 'none';
        return;
    }

    lboxFooter.style.bottom = "25px";
    lboxFooter.style.left = ((window.innerWidth - lboxImage.width)/2) + "px";
    lboxFooter.style.width = lboxImage.width + "px";
    lboxFooter.style.height = '175px';
    lboxFooter.style.lineHeight = '30px';
}

function restyleBackground() {
    let lboxBackground = getBackground();

    let parts = 64;
    let blur = Math.min(lboxBackground.naturalWidth / parts, lboxBackground.naturalHeight / parts);

    let bSize = backgroundSize();
    let bWidth = bSize[0] + 3*blur;
    let bHeight = bSize[1] + 3*blur;
    lboxBackground.style.width = bWidth + 'px';
    lboxBackground.style.height = bHeight + 'px';

    let bLeft = (window.innerWidth - bWidth)/2;
    let bTop = (window.innerHeight - bHeight)/2;
    lboxBackground.style.position = "fixed";
    lboxBackground.style.left = bLeft + 'px';
    lboxBackground.style.top = bTop + 'px';
    lboxBackground.style.filter = "blur(" + blur + "px)";
    lboxBackground.style.WebkitFilter = "blur(" + blur + "px)";
    lboxBackground.style.zIndex = '20';
    lboxBackground.style.display = 'block';
}
