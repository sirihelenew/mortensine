const skull = function (el) {
    this.el = el;
    this.containerEl = null;
  
    this.skullFrequency = 3;
    this.skullColors = ['#fce18a', '#ff726d', '#b48def', '#f4306d'];
    this.skullAnimations = ['slow', 'medium', 'fast'];
  
    this._setupElements();
    this._renderskull();
  };
  
  skull.prototype._setupElements = function () {
    const containerEl = document.createElement('div');
    containerEl.style.position = 'fixed';
    containerEl.style.top = '0';
    containerEl.style.right = '0';
    containerEl.style.bottom = '0';
    containerEl.style.left = '0';
    containerEl.classList.add('skull-container');
    document.body.appendChild(containerEl);
    this.containerEl = containerEl;
};
  
  skull.prototype._renderskull = function () {
    this.skullInterval = setInterval(() => {
      const skullEl = document.createElement('img');
     skullEl.src = 'https://tmpfiles.nohat.cc/1574822379Skull_and_Crossbones.svg';
      const skullSize = Math.floor(Math.random() * 3) + 50 + 'px';
      const skullLeft = Math.floor(Math.random() * this.el.offsetWidth) + 'px';
      const skullTop = Math.floor(Math.random() * this.el.offsetHeight) + 'px';
      const skullAnimation = this.skullAnimations[Math.floor(Math.random() * this.skullAnimations.length)];
  
      skullEl.classList.add('skull', 'skull--animation-' + skullAnimation);
      skullEl.style.left = skullLeft;
      skullEl.style.width = skullSize;
      skullEl.style.height = skullSize;
    skullEl.style.top = skullTop;
  
      skullEl.removeTimeout = setTimeout(function () {
        skullEl.parentNode.removeChild(skullEl);
      }, 3000);
  
      this.containerEl.appendChild(skullEl);
    }, 100);
  };
  
function startSkullAnimation() {
    window.skull = new skull(document.querySelector('.js-contEksam'));
}  
window.addEventListener('load', startSkullAnimation);
