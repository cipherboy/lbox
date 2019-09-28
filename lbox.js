"use strict";

class lbox {
    constructor(container, cfg) {
        this.container = document.getElementById(container);

        this.headerElem = document.createElement("div");
        this.headerElem.classList.add('lbox-header');
        this.container.append(this.headerElem);

        this.footerElem = document.createElement("div");
        this.footerElem.classList.add('lbox-footer');
        this.container.append(this.footerElem);

        this.tableElem = document.createElement("table");
        this.tableElem.classList.add('lbox-table');
        this.container.append(this.tableElem);

        this.images = cfg['images'];

        this.prev_image = null;
        this.cur_image = cfg['start'];

        this.header = 'header' in cfg ? cfg['header'] : "";
        this.footer = 'footer' in cfg ? cfg['footer'] : "";

        this.image_prefetch = 'prefetch' in cfg ? cfg['prefetch'] : 2;
        this.sizes = 'sizes' in cfg ? cfg['sizes'] : [];

        this.onImageLoaded = [];

        window._lbox = this;
        this.init();
    }

    one() {
        let lbox = this;
        let cur_image = this.cur_image;
        let item = this.images[cur_image].item;

        this.handlePrevious();

        item.foreground.img.setAttribute('id', 'lboxForeground');
        item.foreground.img.style.display = 'none';

        item.background.img.setAttribute('id', 'lboxBackground');
        item.background.img.style.display = 'none';

        Utils.onImageLoaded(lbox, item.foreground.img, function() {
            item.foreground.restyle();
            item.header.restyle();
            item.footer.restyle();
        }, function() {
            return lbox.cur_image == cur_image;
        });
        Utils.onImageLoaded(lbox, item.background.img, function() {
            item.background.restyle();
        }, function() {
            return lbox.cur_image == cur_image;
        });
    }

    table() {
        let wW = window.innerWidth;
        let wH = window.innerHeight;

        let count = width / 200;
        if (count < 4) {
            count = 1;
        }
        count = parseInt(count);
    }

    init() {
        let lbox = this;
        for (let index in this.images) {
            let image = this.images[index];
            image.item = new Item(this, index, image);
        }

        this.handlePrefetch(function() {
            lbox.table();
        });

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

            if (timer != null) {
                clearTimeout(timer);
            }
            timer = setTimeout(function() {
                lbox.handleNext(amount);
            }, 0);
        });

        Utils.onDoneResize(function() {
            lbox.handlePrefetch(function() {
                lbox.restyle();
            });
        }, null, 50);
    }

    handleNext(amount) {
        let lbox = this;
        let cur = lbox.cur_image;
        let num = lbox.images.length;
        let next = (((cur + amount) % num) + num) % num;

        lbox.prev_image = lbox.cur_image;
        lbox.cur_image = next;

        lbox.one();
        lbox.handlePrefetch(null);
    }

    handlePrevious() {
        if (this.prev_image == null) {
            return;
        }

        let item = this.images[this.prev_image].item;
        let lboxImage = item.foreground.img;
        if (lboxImage != null) {
            lboxImage.style.display = 'none';
            lboxImage.style.zIndex = '0';
            lboxImage.classList.remove('visible');
            Utils.removeImageLoaded(this, lboxImage);
            lboxImage.removeAttribute('id');
        }

        let lboxBackground = item.background.img;
        if (lboxBackground != null) {
            lboxBackground.style.zIndex = '10';
            lboxBackground.style.opacity = '0.3';
            Utils.removeImageLoaded(this, lboxBackground);
            lboxBackground.removeAttribute('id');
        }
    }

    handlePrefetch(callback) {
        let num = this.images.length;
        for (let offset = 0; offset <= this.image_prefetch; offset++) {
            for (let sign of [-1, 1]) {
                let _index = this.cur_image + sign*offset;
                let index = ((_index % num) + num) % num;

                this.images[index].item.build();
            }
        }

        for (let index = 0; index < num; index++) {
            this.images[index].item.thumbnail.build();
        }

        if (callback != null) {
            setTimeout(callback, 10);
        }
    }

    restyle() {
        let item = this.images[this.cur_image].item;
        setTimeout(function() {
            item.background.resize();
        }, 0);

        setTimeout(function() {
            item.foreground.resize();
            item.header.restyle();
            item.footer.restyle();
        }, 50);
    }
}

class Item {
    constructor(lbox, num, data) {
        this.lbox = lbox;
        this.index = num;
        for (let key in data) {
            this[key] = data[key];
        }

        this.thumbnail = new Thumbnail(lbox, this, num, this.src);
        this.foreground = new Foreground(lbox, this, num, this.src);
        this.background = new Background(lbox, this, num, this.src);
        this.header = new Header(lbox, this, num);
        this.footer = new Footer(lbox, this, num);
    }

    build() {
        this.thumbnail.build();
        this.foreground.build();
        this.background.build();
    }

    showInfo() {
        let lboxHeader = this.lbox.headerElem;
        let lboxFooter = this.lbox.footerElem;
        if (this.header.text != '') {
            lboxHeader.style.display = 'block';
        }
        if (this.footer.text != '') {
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

class Thumbnail {
    constructor(lbox, item, num, src) {
        this.lbox = lbox;
        this.item = item;
        this.index = num;
        this.src = src;

        this.img = null;
    }

    build() {
        if (this.img != null) {
            return;
        }

        let min_size = Math.min(...this.lbox.sizes);
        if ("" + min_size in this.item.thumbs) {
            this.src = this.item.thumbs["" + min_size];
        }

        this.img = new Image();
        this.img.src = Utils.chooseSource(this.item);
        this.resize();
        this.img.style.opacity = '0.1';
        this.img.style.zIndex = '0';
        this.img.classList.add('thumbnail');
        this.lbox.container.append(this.img);
    }

    size() {
        let aspect_ratio_hw = this.item.height / this.item.width;
        let aspect_ratio_wh = this.item.width / this.item.height;

        let available = 200;

        let computed_height = aspect_ratio_hw * available;
        let computed_width = aspect_ratio_wh * available;

        if (computed_height < available) {
            return [computed_width, available];
        }
        return [available, computed_height];
    }

    resize() {
        let sizes = this.size();
    }
}

class Foreground {
    constructor(lbox, item, num, src) {
        this.lbox = lbox;
        this.item = item;
        this.index = num;
        this.src = src;

        this.img = null;
    }

    build() {
        if (this.img != null) {
            if (this.index != this.lbox.cur_image) {
                this.img.style.zIndex = '0';
            }

            if (this.img.src != Utils.chooseSource(this.item)) {
                this.img.src = Utils.chooseSource(this.item);
            }

            return;
        }

        this.img = new Image();
        this.img.src = Utils.chooseSource(this.item);
        this.resize();
        this.img.style.opacity = '0.1';
        this.img.style.zIndex = '0';
        this.img.classList.add('foreground');
        this.lbox.container.append(this.img);
    }

    details(horizontal, vertical) {
        let aspect_ratio_hw = this.item.height / this.item.width;
        let aspect_ratio_wh = this.item.width / this.item.height;

        let available_height = window.innerHeight - 2*vertical;
        let available_width = window.innerWidth - 2*horizontal;

        let computed_height = aspect_ratio_hw * available_width;
        let computed_width = aspect_ratio_wh * available_height;

        if (computed_height > available_height) {
            let remaining_width = window.innerWidth - computed_width;
            return [computed_width, available_height, remaining_width/2, vertical];
        }

        let remaining_height = window.innerHeight - computed_height;
        return [available_width, computed_height, horizontal, remaining_height/2];
    }

    resize() {
        let item = this.item;
        let img = this.img;

        let horizontalOffset = 50;
        let verticalOffset = 25;

        let lDetails = this.details(horizontalOffset, verticalOffset);
        let iWidth = lDetails[0];
        let iHeight = lDetails[1];
        let iLeft = lDetails[2];
        let iTop = lDetails[3];

        console.log(lDetails);

        this.img.style.width = iWidth + 'px';
        this.img.style.height = iHeight + 'px';
        this.img.style.position = 'fixed';
        this.img.style.left = iLeft + 'px';
        this.img.style.top = iTop + 'px';

        this.img.style.border = "1px solid #ffffff44";
    }

    restyle() {
        let item = this.item;
        let img = this.img;

        this.resize();
        this.img.style.zIndex = '60';
        this.img.style.display = 'block';

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
        this.src = src;

        this.img = null;
    }

    build() {
        if (this.img != null) {
            if (this.index != this.lbox.cur_image) {
                this.img.style.zIndex = '10';
            }

            if (this.img.src != Utils.chooseSource(this.item)) {
                this.img.src = Utils.chooseSource(this.item);
            }

            return;
        }

        this.img = new Image();
        this.img.src = Utils.chooseSource(this.item);
        this.img.classList.add('background');
        this.lbox.container.append(this.img);
        this.resize();
        this.img.style.opacity = '0.3';
        this.img.style.zIndex = '10';
    }

    size() {
        let aspect_ratio_hw = this.item.height / this.item.width;
        let aspect_ratio_wh = this.item.width / this.item.height;

        let available_height = window.innerHeight;
        let available_width = window.innerWidth;

        let computed_height = aspect_ratio_hw * available_width;
        let computed_width = aspect_ratio_wh * available_height;

        if (computed_height < window.innerHeight) {
            return [computed_width, available_height];
        }
        return [available_width, computed_height];
    }

    resize() {
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
    }

    restyle() {
        this.resize();
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
        this.build();
    }

    build() {
        this.lbox.headerElem.innerHTML = '';
        if (this.text == "") {
            return;
        }

        let textElem = document.createElement('p');
        textElem.innerText = this.text;

        this.lbox.headerElem.append(textElem);
        if (this.text == "") {
            this.lbox.headerElem.style.display = 'none';
            return;
        }
    }

    get() {
        if ("header" in this.lbox.images[this.index]) {
            return this.lbox.images[this.index]["header"];
        }
        return this.lbox.header;
    }

    restyle() {
        let imageNum = lbox.cur_image;

        let img = this.lbox.images[this.index].item.foreground.img;
        this.lbox.headerElem.style.top = img.style.top;
        this.lbox.headerElem.style.left = ((window.innerWidth - img.width)/2) + "px";
        this.lbox.headerElem.style.width = img.width + "px";
        this.lbox.headerElem.style.height = '75px';
        this.lbox.headerElem.style.lineHeight = '70px';
        this.lbox.headerElem.style.display = 'none';
    }
}

class Footer {
    constructor(lbox, item, num) {
        this.lbox = lbox;
        this.item = item;
        this.index = num;

        this.text = this.get();

        this.build();
    }

    build() {
        this.lbox.footerElem.innerHTML = '';
        if (this.text == "") {
            return;
        }

        let textElem = document.createElement('p');
        textElem.innerText = this.text;

        this.lbox.footerElem.append(textElem);
        if (this.text == "") {
            this.lbox.footerElem.style.display = 'none';
            return;
        }
    }

    get() {
        if ("footer" in this.lbox.images[this.index]) {
            return this.lbox.images[this.index]["footer"];
        }
        return this.lbox.footer;
    }

    restyle() {
        let imageNum = lbox.cur_image;

        let img = this.lbox.images[this.index].item.foreground.img;
        this.lbox.footerElem.style.bottom = (window.innerHeight - (img.offsetTop + img.height)) + "px";
        this.lbox.footerElem.style.left = ((window.innerWidth - img.width)/2) + "px";
        this.lbox.footerElem.style.width = img.width + "px";
        this.lbox.footerElem.style.height = '175px';
        this.lbox.footerElem.style.lineHeight = '30px';
    }
}

class Utils {
    static onImageLoaded(lbox, img, callback, conditional) {
        if (img.complete) {
            if (conditional == null || conditional(lbox)) {
                callback(lbox);
            }
        } else {
            if (!(img in lbox.onImageLoaded)) {
                lbox.onImageLoaded[img] = [];
            }
            let real_callback = function() {callback(lbox)};

            lbox.onImageLoaded[img].push(real_callback);
            img.addEventListener('load', real_callback);
        }
    }

    static removeImageLoaded(lbox, img) {
        if (img in lbox.onImageLoaded) {
            for (let callback of lbox.onImageLoaded[img]) {
                img.removeEventListener('load', callback);
            }
            lbox.onImageLoaded[img] = [];
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

    static computeDimensions(size, width, height) {
        if (width > height) {
            let computed_height = height / width * size;
            return [size, computed_height];
        }

        let computed_width = width / height * size;
        return [computed_width, size];
    }

    static chooseSource(image) {
        let wW = window.innerWidth;
        let wH = window.innerHeight;
        let iW = image.width;
        let iH = image.height;

        for (let size in image.thumbs) {
            let dimensions = Utils.computeDimensions(size, iW, iH);
            if (dimensions[0] >= wW || dimensions[1] >= wH) {
                return image.thumbs[size];
            }
        }

        return image.src;
    }
}
