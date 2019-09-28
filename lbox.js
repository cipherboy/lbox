"use strict";

class lbox {
    constructor(container, cfg) {
        this.container = document.getElementById(container);
        this.headerElem = document.createElement("div");
        this.headerElem.classList.add('lbox-header');
        this.footerElem = document.createElement("div");
        this.footerElem.classList.add('lbox-fooer');

        this.images = cfg['images'];

        this.prev_image = null;
        this.cur_image = cfg['start'];

        this.header = 'header' in cfg ? cfg['header'] : "";
        this.footer = 'footer' in cfg ? cfg['footer'] : "";

        window._lbox = this;
        this.init();
    }

    one() {
        let lbox = this;
        let img = this.images[this.cur_image]['item'];
        console.log(img);

        this.handlePrevious();

        img.foreground.img.setAttribute('id', 'this.img');
        img.foreground.img.style.display = 'none';

        img.background.img.setAttribute('id', 'this.img');
        img.background.img.style.display = 'none';

        Utils.onImageLoaded(img.foreground.img, function() {
            img.foreground.restyle();
            img.header.restyle();
            img.footer.restyle();
        }, null);
        Utils.onImageLoaded(img.background.img, function() {
            img.background.restyle();
        }, null);
    }

    init() {

        let lbox = this;
        for (let index in this.images) {
            let image = this.images[index];
            image['item'] = new Item(this, index, image['src']);

            if (index == this.cur_image) {
                setTimeout(function() {
                    lbox.one();
                }, 0);
            }
        }

        let timer = null;
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
            } else {
                return;
            }

            let cur = lbox.cur_image;
            let num = lbox.images.length;
            let next = (((cur + amount) % num) + num) % num;

            lbox.prev_image = lbox.cur_image;
            lbox.cur_image = next;

            if (timer != null) {
                clearTimeout(timer);
            }
            timer = setTimeout(function() {
                lbox.one();
            }, 0);
        });

        Utils.onDoneResize(function() {
            lbox.resize();
        }, null, 100);
    }

    handlePrevious() {
        if (this.prev_image == null) {
            return;
        }

        let item = this.images[this.prev_image]['item'];
        let lboxImage = item.foreground.img;
        if (lboxImage != null) {
            lboxImage.style.display = 'none';
            lboxImage.classList.remove('visible');
            lboxImage.removeAttribute('id');
        }

        let lboxBackground = item.background.img;
        if (lboxBackground != null) {
            lboxBackground.style.zIndex = '10';
            lboxBackground.style.opacity = '0.3';
            lboxBackground.removeAttribute('id');
        }
    }

    restyle() {
        let img = this.images[this.cur_image];
        setTimeout(function() {
            img.background.restyle();
        }, 0);

        setTimeout(function() {
            img.foreground.restyle();
            img.header.restyle();
            img.footer.restyle();
        }, 50);
    }
}

class Item {
    constructor(lbox, num, src) {
        this.lbox = lbox;
        this.num = num;

        this.foreground = new Foreground(lbox, this, num, src);
        this.background = new Background(lbox, this, num, src);
        this.header = new Header(lbox, this, num);
        this.footer = new Footer(lbox, this, num);
    }

    showInfo() {
        let lboxHeader = this.lbox.headerElem;
        let lboxFooter = this.lbox.footerElem;
        if (lboxHeader.innerText != '') {
            lboxHeader.style.display = 'block';
        }

        if (lboxFooter.innerText != '') {
            lboxFooter.style.display = 'block';
        }
    }

    hideInfo() {
        let lboxHeader = this.lbox.headerElem;
        let lboxFooter = this.lbox.footerElem;
        lboxHeader.style.display = 'none';
        lboxFooter.style.display = 'none';
    }
}

class Foreground {
    constructor(lbox, item, index, src) {
        this.lbox = lbox;
        this.item = item;
        this.num = index;

        this.img = new Image();
        this.img.src = src;
        this.img.style.opacity = '0.1';
        this.img.style.zIndex = '0';
        this.img.classList.add('foreground');
        lbox.container.append(this.img);
    }

    details(horizontal, vertical) {
        let aspect_ratio_hw = this.img.naturalHeight / this.img.naturalWidth;
        let aspect_ratio_wh = this.img.naturalWidth / this.img.naturalHeight;

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

    restyle() {
        let item = this.item;
        let img = this.img;

        let horizontalOffset = 50;
        let verticalOffset = 25;

        let lDetails = this.details(horizontalOffset, verticalOffset);
        let iWidth = lDetails[0];
        let iHeight = lDetails[1];
        let iLeft = lDetails[2];
        let iTop = lDetails[3];

        this.img.style.width = iWidth + 'px';
        this.img.style.height = iHeight + 'px';
        this.img.style.position = 'fixed';
        this.img.style.left = iLeft + 'px';
        this.img.style.top = iTop + 'px';
        this.img.style.zIndex = '60';
        this.img.style.display = 'block';

        this.img.style.border = "1px solid #ffffff44";

        if (!this.img.classList.contains('visible')) {
            this.img.style.opacity = '0';
            this.img.style.display = 'block';

            setTimeout(function() {
                img.classList.add('visible');
            }, 10);

            this.img.addEventListener("mouseover", function() {
                item.showInfo();
            });
            this.img.addEventListener("mouseout", function() {
                item.hideInfo();
            });
        }
    }
}

class Background {
    constructor(lbox, item, num, src) {
        this.lbox = lbox;
        this.item = item;
        this.index = num;

        this.img = new Image();
        this.img.src = src;
        this.img.style.opacity = '0.3';
        this.img.style.zIndex = '10';
        this.img.classList.add('background');
        lbox.container.append(this.img);
    }

    size() {
        let aspect_ratio_hw = this.img.naturalHeight / this.img.naturalWidth;
        let aspect_ratio_wh = this.img.naturalWidth / this.img.naturalHeight;

        let available_height = window.innerHeight;
        let available_width = window.innerWidth;

        let computed_height = aspect_ratio_hw * available_width;
        let computed_width = aspect_ratio_wh * available_height;

        if (computed_height < window.innerHeight) {
            return [computed_width, available_height];
        }
        return [available_width, computed_height];
    }


    restyle() {
        let parts = 64;
        let blur = Math.min(this.img.naturalWidth / parts, this.img.naturalHeight / parts);

        let bSize = this.size();
        let bWidth = bSize[0] + 3*blur;
        let bHeight = bSize[1] + 3*blur;
        this.img.style.width = bWidth + 'px';
        this.img.style.height = bHeight + 'px';

        let bLeft = (window.innerWidth - bWidth)/2;
        let bTop = (window.innerHeight - bHeight)/2;
        this.img.style.position = "fixed";
        this.img.style.opacity = '1';
        this.img.style.left = bLeft + 'px';
        this.img.style.top = bTop + 'px';
        this.img.style.filter = "blur(" + blur + "px)";
        this.img.style.WebkitFilter = "blur(" + blur + "px)";
        this.img.style.zIndex = '40';
        this.img.style.display = 'block';
    }
}

class Header {
    constructor(lbox, item, num) {
        this.lbox = lbox;
        this.item = item;
        this.index = num;

        this.text = this.get();
    }

    get() {
        if ("header" in this.lbox.images[this.index]) {
            return this.lbox.images[this.index]["header"];
        }
        return this.lbox.header;
    }

    restyle() {
        let imageNum = lbox.cur_image;

        let text = document.createElement('p');
        text.innerText = this.text;

        this.lbox.headerElem.append(text);
        if (this.text == "") {
            this.lbox.headerElem.style.display = 'none';
            return;
        }

        let img = this.lbox.images[this.index]['item'].foreground.img;
        this.lbox.headerElem.style.top = img.style.top;
        this.lbox.headerElem.style.left = ((window.innerWidth - img.width)/2) + "px";
        this.lbox.headerElem.style.width = img.width + "px";
        this.lbox.headerElem.style.height = '75px';
        this.lbox.headerElem.style.lineHeight = '70px';
    }
}

class Footer {
    constructor(lbox, item, num) {
        this.lbox = lbox;
        this.item = item;
        this.index = num;

        this.text = this.get();
    }

    get() {
        if ("footer" in this.lbox.images[this.index]) {
            return this.lbox.images[this.index]["footer"];
        }
        return this.lbox.footer;
    }

    restyle() {
        let imageNum = lbox.cur_image;

        let text = document.createElement('p');
        text.innerText = this.text;

        this.lbox.footerElem.append(text);
        if (this.text == "") {
            this.lbox.footerElem.style.display = 'none';
            return;
        }

        let img = this.lbox.images[this.index]['item'].foreground.img;
        this.lbox.footerElem.style.bottom = "25px";
        this.lbox.footerElem.style.left = ((window.innerWidth - img.width)/2) + "px";
        this.lbox.footerElem.style.width = img.width + "px";
        this.lbox.footerElem.style.height = '175px';
        this.lbox.footerElem.style.lineHeight = '30px';
    }
}

class Utils {
    static onImageLoaded(img, callback, data) {
        if (img.complete) {
            callback(data);
        } else {
            img.addEventListener('load', function() {
                callback(data);
            });
        }
    }

    static onDoneResize(callback, data, interval) {
        let timer = null;
        window.addEventListener('resize', function() {
            if (timer) {
                clearTimeout(timer);
            }

            timer = setTimeout(function() {
                callback(data);
            }, interval);
        });
    }
}
