// twitter: @mmzy3
"use strict";

var ettan2017 = {
    viewWidth: window.innerWidth,
    imageX: 0,
    imageY: 0,
    imageScale: 1,
    tapEnabled: false,
    
    init: function () {
        window.onload = function() {
            this.didLoad();
        }.bind(this);
    },

    didLoad: function() {
        this.fxxkinApple();
        
        window.addEventListener('resize', function (event) {
            this.onResize();
        }.bind(this));

        var zoom = d3.behavior.zoom();
        zoom.scale(1);
        zoom.scaleExtent([1, 10]);
        zoom.on("zoom", function() {
            this.tapEnabled = false;
            this.onZoom();
        }.bind(this));
            
        var body = d3.select("body");
        body.call(zoom)
        body.on("click", function() {
            this.onClick(d3.event.clientX, d3.event.clientY);
        }.bind(this));
        body.on("touchstart", function() {
            this.tapEnabled = true;
        }.bind(this));
        body.on("touchend", function() {
            if(this.tapEnabled){
                this.onClick(d3.event.pageX, d3.event.pageY);
            }
        }.bind(this));

        this.setImagePosition(0, 0, 1);
    },

    onResize: function() {
        this.viewWidth = window.innerWidth;
    },

    onZoom: function() {
        this.setImagePosition(d3.event.translate[0], d3.event.translate[1], d3.event.scale);            
    },

    onClick: function(x, y) {
        var nameTag = document.createElement("div");
        nameTag.className = "nameTag";
        nameTag.innerText = "えったん";
        nameTag.style.left = (x - this.imageX) / (this.viewWidth * this.imageScale) * 100 + "%";
        nameTag.style.top = (y - this.imageY) / (this.viewWidth * this.imageScale) * 100 + "%";

        var imageContainer = document.getElementById("imageContainer");
        imageContainer.appendChild(nameTag);

        console.log("clicked!", d3.event);
    },

    setImagePosition: function(x, y, scale) {
        this.imageX = x;
        this.imageY = y;
        this.imageScale = scale;
        this.updateImagePosition();
    },

    updateImagePosition: function() {
        var imageContainer = document.getElementById("imageContainer");
        imageContainer.style.left = this.imageX / this.viewWidth * 100 + "vw";
        imageContainer.style.top = this.imageY / this.viewWidth * 100 + "vw";
        imageContainer.style.width = this.imageScale * 100 + "vw";
        imageContainer.style.height = this.imageScale * 100 + "vw";
        imageContainer.style.fontSize = this.imageScale * 0.6 + "vw";
    },

    fxxkinApple() {
        // ブラウザ自身でのピンチ・ドラッグ操作を禁止する
        document.addEventListener('touchstart', event => {
                event.preventDefault();
        }, true);
    }
}
