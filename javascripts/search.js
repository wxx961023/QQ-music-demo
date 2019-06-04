import { SEARCH_URL } from "./constants.js";
import { searchUrl } from "./helpers.js";

export class Search {
  constructor(el) {
    this.$el = el;
    this.$input = this.$el.querySelector("#search");
    this.$input.addEventListener("keyup", this.onKeyUp.bind(this));
    this.$songs = this.$el.querySelector(".song-list");
    this.page = 1;
    this.songs = {};
    this.keyword = "";
    this.perpage = 20;
    this.nomore = false;
    this.fetching = false;
    this.history = [];
    this.delete = document.querySelector(".icon-delete"); //删除
    this.cancel = document.querySelector(".search-cancel"); //取消
    this.hotKeys = document.querySelector("#hot-keys"); //热门歌曲
    this.recordKeys = document.querySelector(".record-keys"); //搜索记录
    this.onscroll = this.onScroll.bind(this);

    this.$el.addEventListener("click", this.onClick.bind(this));

    this.HISTORY_KEY = "search_history";
    this.history = localStorage.getItem(this.HISTORY_KEY)
      ? localStorage.getItem(this.HISTORY_KEY).split(",")
      : [];
  }

  onKeyUp(event) {
    let keyword = event.target.value.trim();
    if (keyword) {
      this.delete.classList.remove("hide");
    } else {
      this.delete.classList.add("hide");
      return this.reset();
    }
    if (event.keyCode !== 13) return;
    this.recordKeys.classList.add('hide')
    this.addHistory(keyword)
    this.search(keyword);
    window.addEventListener("scroll", this.onscroll);
  }

  onClick(e) {
    //如果点击到了输入按钮
    if (e.target === this.$input) {
      this.cancel.classList.remove("hide");
      this.hotKeys.classList.add("hide");
      this.recordKeys.classList.remove("hide");
      this.renderHistory();
      this.reset();
    }
    //如果点击到了取消按钮
    if (e.target === this.cancel) {
      this.cancel.classList.add("hide");
      this.delete.classList.add("hide");
      this.hotKeys.classList.remove("hide");
      this.recordKeys.classList.add("hide");
      this.$input.value = "";
      this.reset();
    }
    //如果点击到了删除按钮
    if (e.target === this.delete) {
      this.$input.value = "";
      this.delete.classList.add("hide");
      this.reset();
    }
    //如果匹配到了清除搜索记录
    if (e.target.matches(".record-delete")) {
      this.history = [];
      localStorage.setItem(this.HISTORY_KEY, this.history);
      this.recordKeys.innerHTML = "";
    }
    //如果匹配到了单条记录的删除按钮
    if (e.target.matches(".icon-close")) {
      const index = this.history.indexOf(
        e.target.previousElementSibling.innerHTML
      );
      this.history.splice(index, 1);
      localStorage.setItem(this.HISTORY_KEY, this.history);
      this.renderHistory();
    }
    //如果点到了热门搜索的关键词或者点到了搜索记录的歌
    if (e.target.matches(".tag-keyword") || e.target.matches(".record-con")) {
      // console.log(e.target.innerHTML)
      // console.log(this.$input)
      this.$input.value = e.target.innerHTML;
      this.keyword = e.target.innerHTML;
      this.delete.classList.remove("hide");
      this.cancel.classList.remove("hide");
      this.hotKeys.classList.add("hide");
      this.recordKeys.classList.add("hide");
      this.addHistory(this.keyword);
      this.search(this.keyword);
      window.addEventListener("scroll", this.onscroll);
    }
  }

  onScroll(event) {
    if (this.nomore) return window.removeEventListener("scroll", this.onscroll);
    if (
      pageYOffset + document.documentElement.clientHeight >
      document.body.scrollHeight - 50
    ) {
      this.search(this.keyword, this.page + 1);
    }
  }

  reset() {
    this.page = 1;
    this.songs = {};
    this.keyword = "";
    this.nomore = false;
    this.$songs.innerHTML = "";
    this.$el.querySelector(".search-loading").classList.remove("show");
    this.$el.querySelector(".loading-icon").classList.remove("dis");
    this.$el.querySelector(".loading-text").classList.remove("dis");
    this.$el.querySelector(".loading-done").classList.add("hide");  
  }

  search(keyword, page) {
    if (this.keyword === keyword && this.songs[page || this.page]) return;
    if (this.nomore || this.fetching) return;
    if (this.keyword !== keyword) this.reset();
    this.keyword = keyword;
    this.loading();
    fetch(searchUrl(this.keyword, page || this.page))
      .then(res => res.json())
      .then(json => {
        this.page = json.data.song.curpage;
        this.songs[this.page] = json.data.song.list;
        this.nomore = json.message === "no results";
        return json.data.song.list;
      })
      .then(songs => this.append(songs))
      .then(() => this.done())
      .catch(() => (this.fetching = false));
  }

  append(songs) {
    console.log(songs);
    let html = songs
      .map(song => {
        let artist = song.singer.map(s => s.name).join(" ");
        return `
        <a class="song-item" 
           href="#player?artist=${artist}&songid=${song.songid}&songname=${
          song.songname
        }&albummid=${song.albummid}&songmid=${song.songmid}&duration=${
          song.interval
        }">
          <i class="icon icon-music"></i>
          <div class="song-name ellipsis">${song.songname}</div>
          <div class="song-artist ellipsis">${artist}</div>
        </a>`;
      })
      .join("");
    this.$songs.insertAdjacentHTML("beforeend", html);
  }

  addHistory(keyword) {
    // console.log('keyword： ' + keyword);
    let index = this.history.indexOf(keyword);
    if (index === -1) {
      this.history.unshift(keyword);
      localStorage.setItem(this.HISTORY_KEY, this.history);
    }
  }

  renderHistory() {
    if (this.history.length > 0) {
      let historyHTML = this.history
        .map(
          item => `
            <li>
                <a href="#" class="record-main">
                    <span class="icon icon-clock"></span>
                    <span class="record-con ellipsis">${item}</span>
                    <span class="icon icon-close"></span>
                </a>
            </li>
        `
        )
        .join("");
      historyHTML += `
            <p class="record-delete">清除搜索记录</p>
        `;
      // console.log(historyHTML)
      // console.log(this.recordKeys)
      this.recordKeys.innerHTML = historyHTML;
    } else if (this.history.length === 0) {
      this.recordKeys.innerHTML = "";
      this.history = [];
    }
  }

  loading() {
    this.fetching = true;
    this.$el.querySelector(".search-loading").classList.add("show");
  }

  done() {
    this.fetching = false;
    if (this.nomore) {
      this.$el.querySelector(".loading-icon").classList.add("dis");
      this.$el.querySelector(".loading-text").classList.add("dis");
      this.$el.querySelector(".loading-done").classList.remove("hide");
      //this.$el.querySelector(".loading-done").style.display = "block";
      this.$el.querySelector(".search-loading").classList.add("show");
    } else {
      this.$el.querySelector(".search-loading").classList.remove("show");
    }
  }
}
