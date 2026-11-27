    let currentMode = "tarot";
    let birthDate = "";
    let sessionQuestions = [];
    let answers = [];
    let resultTimer = null;
    const tarotCards = [
      { name: "0 愚者", figure: "站在懸崖邊、身旁有白犬與太陽的旅人" },
      { name: "I 魔術師", figure: "舉起一手、身旁有無限符號與聖杯、寶劍、權杖及錢幣的魔術師" },
      { name: "II 女祭司", figure: "戴著新月冠、靜坐在雙柱之間的女祭司" },
      { name: "III 皇后", figure: "被麥穗、星星與金星符號環繞的皇后" },
      { name: "IV 皇帝", figure: "手持金球、坐在公羊石座上的君王" },
      { name: "V 教皇", figure: "手持三重權杖、身旁有交叉鑰匙的智者" },
      { name: "VI 戀人", figure: "太陽與天使羽翼下的兩個人物" },
      { name: "VII 戰車", figure: "由黑白獅身人面獸引領的勝利戰車駕駛者" },
      { name: "VIII 力量", figure: "頭頂無限符號、溫柔馴服獅子的女子" },
      { name: "IX 隱者", figure: "手提六芒星燈籠的斗篷隱者" },
      { name: "X 命運之輪", figure: "帶有天體符號的精緻命運之輪" },
      { name: "XI 正義", figure: "手持寶劍與金色天秤的正義人物" },
      { name: "XII 倒吊人", figure: "倒掛在活樹上、頭頂金色光環的人物" },
      { name: "XIII 死神", figure: "骷髏騎士旗幟旁、朝向初升太陽綻放的白玫瑰" },
      { name: "XIV 節制", figure: "在兩只金杯之間傾倒光水的有翼天使" },
      { name: "XV 惡魔", figure: "角狀暗影與倒五芒星下被鎖鏈束縛的身影" },
      { name: "XVI 高塔", figure: "被雷電擊中的石塔與墜落的王冠" },
      { name: "XVII 星星", figure: "在一大七小的星星下傾倒水流的跪姿人物" },
      { name: "XVIII 月亮", figure: "雙塔與蜿蜒小徑上方帶有新月側影的明月" },
      { name: "XIX 太陽", figure: "盛開向日葵上方散發直線與波浪光芒的金色太陽" },
      { name: "XX 審判", figure: "向甦醒眾人吹響金色號角的天使" },
      { name: "XXI 世界", figure: "在月桂花環中起舞、被四個天體象徵環繞的人物" }
    ];
    const tarotPositions = ["過去", "現在", "未來"];
    const tarotMeanings = [
      ["新的旅程與好奇心", "放慢腳步，先看看腳下"],
      ["運用手邊資源展開行動", "聚焦真正想做的一件事"],
      ["傾聽直覺與內在聲音", "給自己安靜整理的時間"],
      ["滋養想法並照顧自己", "留意自己是否也需要休息"],
      ["建立界線與穩定的秩序", "讓計畫保留一點彈性"],
      ["從經驗與他人的智慧學習", "重新思考習慣是否適合你"],
      ["重視選擇與真誠的連結", "先釐清自己的感受與期待"],
      ["帶著方向感向前邁進", "調整步調，不必急著衝刺"],
      ["以耐心和溫柔面對挑戰", "接納疲憊，適時尋求支持"],
      ["透過獨處找到自己的答案", "不必獨自承擔所有問題"],
      ["留意變化帶來的新可能", "在變動中照顧好自己的節奏"],
      ["公平地衡量選擇與後果", "先確認資訊，再下判斷"],
      ["換一個角度理解現況", "檢視什麼讓你遲遲無法前進"],
      ["為結束與新的開始騰出空間", "慢慢放下已不適合的事"],
      ["在不同需求之間找到平衡", "調整過度緊繃或失衡的節奏"],
      ["覺察讓自己受限的習慣", "嘗試鬆開不必要的束縛"],
      ["從意外的變化中重新整理", "循序處理變動，不必急著重建一切"],
      ["保持希望，為自己補充能量", "重新找回值得期待的小事"],
      ["接納尚未明朗的情緒與想像", "釐清猜測與實際發生的事"],
      ["看見喜悅與清晰的方向", "允許自己不必時時充滿活力"],
      ["回顧經驗，做出新的選擇", "暫時放下對自己的嚴苛評價"],
      ["肯定一段旅程的累積與完成", "為尚未完成的事留一點耐心"]
    ];
    let tarotTopic = "";
    let tarotDeck = [];
    let tarotDrawn = [];
    let tarotSpread = null;

    const intakePanel = document.getElementById("intakePanel");
    const intakeCard = document.getElementById("intakeCard");
    const chatBox = document.getElementById("chatBox");
    const dialogueBox = document.getElementById("dialogueBox");
    const fortuneTellerImage = document.getElementById("fortuneTellerImage");
    const suggestionsBox = document.getElementById("suggestionsBox");
    const resultDialog = document.getElementById("resultDialog");
    const resultLoading = document.getElementById("resultLoading");
    const resultContent = document.getElementById("resultContent");
    const viewResultBtn = document.getElementById("viewResultBtn");
    const fortuneTellers = {
      tarot: {
        name: "塔羅占卜師",
        image: "images/pic_2.webp",
        alt: "手持水晶球與塔羅牌的塔羅占卜師"
      },
      zodiac: {
        name: "星象占卜師",
        image: "images/pic_1.webp",
        alt: "手持星球、以星座為背景的星象占卜師"
      },
      ziwei: {
        name: "紫微八字老師",
        image: "images/pic_3.webp",
        alt: "手持命理籤筒與八卦扇的紫微八字老師"
      }
    };

    document.getElementById("closeResultBtn").addEventListener("click", () => resultDialog.close());
    resultDialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resultDialog.close();
      }
    });
    viewResultBtn.addEventListener("click", () => {
      if (!resultDialog.open) resultDialog.showModal();
    });

    function resetIntakeView() {
      clearTimeout(resultTimer);
      if (resultDialog.open) resultDialog.close();
      resultContent.replaceChildren();
      viewResultBtn.hidden = true;
      sessionQuestions = [];
      answers = [];
      tarotSpread = null;
      dialogueBox.innerHTML = "";
      suggestionsBox.innerHTML = "";
      chatBox.classList.remove("active");
      suggestionsBox.classList.remove("active");
      intakePanel.style.display = "flex";
      intakePanel.scrollTop = 0;
    }

    function showModeSelection() {
      resetIntakeView();
      birthDate = "";
      intakePanel.classList.add("selection-view");
      intakeCard.classList.add("mode-selection");
      intakeCard.innerHTML = `
        <section class="hero section-frame" aria-labelledby="hero-title">
          <div class="hero-copy">
            <p class="eyebrow"><span class="eyebrow-rule"></span> 一間留給自己的小小觀星室 <span class="eyebrow-en">A QUIET SPACE TO LISTEN</span></p>
            <h2 id="hero-title">不急著找答案，<br /><span>先聽聽心裡的回音。</span></h2>
            <p class="hero-description">塔羅、星座與趣味命理，<br class="desktop-break" />用有趣的選擇題，為你留一則靈感手札。</p>
            <button class="primary-button hero-button" type="button" data-action="scroll-ritual">選擇你的占卜方式 <span aria-hidden="true">↓</span></button>
          </div>
          <div class="hero-art-wrap"><div class="celestial-plate" aria-label="以月相與星軌為靈感的手繪天體圖">
            <div class="plate-note plate-note-top"><span>觀星札記</span><span>PLATE 01</span></div>
            <svg class="plate-drawing" viewBox="0 0 500 500" role="img" aria-label="星軌與新月的線描插畫">
              <circle cx="250" cy="250" r="206" fill="none" stroke="currentColor" stroke-width=".8" opacity=".52"/><circle cx="250" cy="250" r="168" fill="none" stroke="currentColor" stroke-width=".7" opacity=".42"/><circle cx="250" cy="250" r="128" fill="none" stroke="currentColor" stroke-width=".65" opacity=".35"/>
              <ellipse cx="250" cy="250" rx="198" ry="83" fill="none" stroke="currentColor" stroke-width=".8" transform="rotate(-34 250 250)" opacity=".62"/><ellipse cx="250" cy="250" rx="192" ry="63" fill="none" stroke="currentColor" stroke-width=".75" transform="rotate(51 250 250)" opacity=".54"/>
              <path d="M259 133a122 122 0 1 0 104 185 108 108 0 1 1-104-185Z" fill="currentColor" opacity=".9"/><path d="M112 166 116 177 127 181 116 185 112 196 108 185 97 181 108 177Z" fill="currentColor"/><path d="M376 310 379 318 387 321 379 324 376 332 373 324 365 321 373 318Z" fill="currentColor"/>
              <circle cx="355" cy="127" r="4" fill="currentColor"/><circle cx="130" cy="356" r="3" fill="currentColor"/><circle cx="392" cy="229" r="2.5" fill="currentColor"/><circle cx="186" cy="87" r="2" fill="currentColor"/><path d="M244 43v16m-8-8h16M89 282v14m-7-7h14M404 386v12m-6-6h12M250 61V83M250 417v22M61 250h21M418 250h22" stroke="currentColor" stroke-width=".8" opacity=".5"/>
            </svg>
            <div class="plate-note plate-note-bottom"><span>以星象為鏡</span><span>靜聽內在回音</span></div><span class="plate-vertical">EST. IN A MOMENT OF STILLNESS</span>
          </div></div>
          <div class="hero-index" aria-hidden="true"><span>VOL. 01</span><span>✦</span><span>內在風景</span></div>
        </section>
        <div class="belief-band"><span aria-hidden="true">☾</span> 古老象徵，新的觀看角度。 <strong>不是替你決定，而是陪你重新看見。</strong></div>
        <div class="selection-heading" id="ritual">
          <div>
            <p class="eyebrow"><span class="eyebrow-rule"></span> 先選一種你喜歡的入口 <span class="eyebrow-en">CHOOSE YOUR RITUAL</span></p>
            <h2>今天，想從哪裡開始？</h2>
          </div>
          <p>跟著直覺挑一個就好。<br />每種玩法都有 100 道趣味題目。</p>
        </div>
        <div class="fortune-cards">
          <button type="button" class="fortune-card" data-mode="tarot" aria-label="選擇塔羅占卜">
            <span class="fortune-card-top"><span>01 / 03</span><span>直覺與象徵</span></span>
            <span class="fortune-card-icon" aria-hidden="true">✧</span>
            <span class="fortune-card-content">
              <span class="fortune-card-english">A CARD FOR THIS MOMENT</span>
              <span class="fortune-card-title">塔羅占卜</span>
              <span class="fortune-card-desc">感情、人際、工作與近期運勢</span>
            </span>
            <span class="fortune-card-cta">開始探索 →</span>
          </button>
          <button type="button" class="fortune-card" data-mode="zodiac" aria-label="選擇星座占卜">
            <span class="fortune-card-top"><span>02 / 03</span><span>生日與星座</span></span>
            <span class="fortune-card-icon" aria-hidden="true">☼</span>
            <span class="fortune-card-content">
              <span class="fortune-card-english">A NOTE FROM THE STARS</span>
              <span class="fortune-card-title">星座占卜</span>
              <span class="fortune-card-desc">太陽星座與星際趣味探索</span>
            </span>
            <span class="fortune-card-cta">開始探索 →</span>
          </button>
          <button type="button" class="fortune-card" data-mode="ziwei" aria-label="選擇紫微八字">
            <span class="fortune-card-top"><span>03 / 03</span><span>趣味命理</span></span>
            <span class="fortune-card-icon" aria-hidden="true">☯</span>
            <span class="fortune-card-content">
              <span class="fortune-card-english">BIRTH CHART INSPIRATION</span>
              <span class="fortune-card-title">紫微八字</span>
              <span class="fortune-card-desc">命理風格的趣味模擬，非實際排盤</span>
            </span>
            <span class="fortune-card-cta">開始探索 →</span>
          </button>
        </div>
        <p class="selection-caption"><span class="eyebrow-rule"></span> 每次隨機回答 4～6 題，憑直覺選就好。</p>
      `;

      intakeCard.querySelector('[data-action="scroll-ritual"]').addEventListener("click", () => {
        document.getElementById("ritual").scrollIntoView({ behavior: "smooth", block: "start" });
      });

      intakeCard.querySelectorAll(".fortune-card").forEach(card => {
        card.addEventListener("click", () => {
          currentMode = card.dataset.mode;
          if (currentMode === "tarot") {
            showTarotTopics();
          } else {
            showIntakeScreen();
          }
        });
      });
    }

    function showTarotTopics() {
      resetIntakeView();
      intakePanel.classList.remove("selection-view");
      intakeCard.classList.remove("mode-selection");
      window.scrollTo(0, 0);
      intakeCard.innerHTML = `
        <div class="intake-title">✧ 塔羅占卜・選擇主題</div>
        <div class="intake-desc">先選擇想探索的方向，再依序抽出過去、現在與未來的三張牌。</div>
        <div class="tarot-topics">
          <button type="button" class="tarot-topic" data-topic="感情">感情 <span>感情與人際關係</span></button>
          <button type="button" class="tarot-topic" data-topic="工作">工作 <span>事業與職涯方向</span></button>
          <button type="button" class="tarot-topic" data-topic="運勢">運勢 <span>近期整體運勢</span></button>
        </div>
        <button type="button" class="btn-back" id="backToModesBtn">← 返回選擇占卜方式</button>
      `;
      intakeCard.querySelectorAll(".tarot-topic").forEach(button => {
        button.addEventListener("click", () => {
          tarotTopic = button.dataset.topic;
          showTarotDraw();
        });
      });
      document.getElementById("backToModesBtn").addEventListener("click", showModeSelection);
    }

    function showTarotDraw() {
      tarotDeck = tarotCards.map((card, number) => ({ ...card, number }));
      for (let i = tarotDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tarotDeck[i], tarotDeck[j]] = [tarotDeck[j], tarotDeck[i]];
      }
      tarotDrawn = [];
      window.scrollTo(0, 0);
      intakeCard.innerHTML = `
        <div class="intake-title">✧ ${tarotTopic}・三張牌陣</div>
        <div class="intake-desc">在心中默念你的問題，憑直覺從下方牌堆選出三張牌。</div>
        <div class="tarot-spread" aria-label="過去、現在、未來牌陣">
          ${tarotPositions.map(position => `
            <div class="tarot-slot"><span>${position}</span><div class="tarot-slot-card">等待抽牌</div></div>
          `).join("")}
        </div>
        <p class="tarot-status" id="tarotStatus" role="status">請選擇代表「過去」的牌</p>
        <div class="tarot-deck" aria-label="塔羅牌堆">
          ${tarotDeck.map((card, index) => `
            <button type="button" class="tarot-deck-card" data-card-index="${index}" aria-label="選擇第 ${index + 1} 張牌">
              <img src="images/card_back.jpg" alt="" />
            </button>
          `).join("")}
        </div>
        <button type="button" class="btn-start tarot-start" id="tarotStartBtn" disabled>抽完三張牌後開始答題</button>
        <button type="button" class="btn-back" id="backToTopicsBtn">← 返回選擇主題</button>
      `;
      intakeCard.querySelectorAll(".tarot-deck-card").forEach(button => {
        button.addEventListener("click", () => drawTarotCard(button));
      });
      document.getElementById("backToTopicsBtn").addEventListener("click", showTarotTopics);
      document.getElementById("tarotStartBtn").addEventListener("click", () => {
        const [past, present, future] = tarotDrawn;
        tarotSpread = { topic: tarotTopic, past, present, future };
        enterChatSession();
      });
    }

    function drawTarotCard(button) {
      if (button.disabled || tarotDrawn.length >= tarotPositions.length) return;
      const card = {
        ...tarotDeck[Number(button.dataset.cardIndex)],
        orientation: Math.random() < 0.5 ? "正位" : "逆位"
      };
      const position = tarotPositions[tarotDrawn.length];
      const slot = intakeCard.querySelectorAll(".tarot-slot-card")[tarotDrawn.length];
      tarotDrawn.push(card);
      button.disabled = true;
      button.setAttribute("aria-label", `已選擇：${position}，${card.name}，${card.orientation}`);
      slot.innerHTML = `
        <img class="${card.orientation === "逆位" ? "tarot-card-reversed" : ""}" src="images/card_${String(card.number).padStart(2, "0")}.jpg" alt="${card.name}，${card.orientation}牌面" />
        <strong>${card.name}<br />${card.orientation}</strong>
      `;
      const status = document.getElementById("tarotStatus");
      const start = document.getElementById("tarotStartBtn");
      if (tarotDrawn.length === tarotPositions.length) {
        status.textContent = `未來抽到「${card.name}」${card.orientation}。三張牌已揭曉，可以開始答題。`;
        start.disabled = false;
        start.textContent = "開始回答趣味題";
        intakeCard.querySelectorAll(".tarot-deck-card").forEach(deckCard => { deckCard.disabled = true; });
      } else {
        status.textContent = `${position}抽到「${card.name}」${card.orientation}。請選擇代表「${tarotPositions[tarotDrawn.length]}」的牌`;
      }
    }

    function showIntakeScreen() {
      resetIntakeView();
      intakePanel.classList.remove("selection-view");
      intakeCard.classList.remove("mode-selection");
      window.scrollTo(0, 0);

      if (currentMode === "ziwei") {
        intakeCard.innerHTML = `
          <div class="intake-title">☯ 紫微八字・趣味命理</div>
          <div class="intake-desc">這是一場命理風格的想像之旅，依你的選擇產生趣味結果，不會計算紫微命盤或八字，也不需要提供生辰資料。</div>
          <div class="intake-actions"><button type="button" class="btn-start" id="startBtn">開始回答趣味題</button></div>
        `;
      } else if (currentMode === "zodiac") {
        intakeCard.innerHTML = `
          <div class="intake-title">♈ 星座占卜・生日資料</div>
          <div class="intake-desc">可以填寫生日，結果會顯示對應的太陽星座；不填也能遊玩。本遊戲不計算完整星盤或即時星象。</div>
          <div class="form-group">
            <label for="zdBirthDate">出生日期（選填）</label>
            <input type="date" id="zdBirthDate" />
          </div>
          <div class="intake-actions">
            <button type="button" class="btn-skip" id="skipBtn">略過生日</button>
            <button type="button" class="btn-start" id="startBtn">開始回答趣味題</button>
          </div>
        `;
      }

      intakeCard.insertAdjacentHTML("beforeend", '<button type="button" class="btn-back" id="backToModesBtn">← 返回選擇占卜方式</button>');
      document.getElementById("backToModesBtn").addEventListener("click", showModeSelection);

      const skipBtn = document.getElementById("skipBtn");
      if (skipBtn) skipBtn.addEventListener("click", () => {
        birthDate = "";
        enterChatSession();
      });
      document.getElementById("startBtn").addEventListener("click", () => {
        const dateInput = document.getElementById("zdBirthDate");
        if (dateInput && !dateInput.reportValidity()) return;
        birthDate = dateInput ? dateInput.value : "";
        enterChatSession();
      });
    }

    function enterChatSession() {
      const groups = [...questionGroups[currentMode]];
      for (let i = groups.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [groups[i], groups[j]] = [groups[j], groups[i]];
      }
      sessionQuestions = groups.slice(0, 4 + Math.floor(Math.random() * 3)).map(group => ({
        text: group.questions[Math.floor(Math.random() * group.questions.length)],
        options: group.options
      }));
      answers = [];
      intakePanel.style.display = "none";
      const fortuneTeller = fortuneTellers[currentMode];
      fortuneTellerImage.src = fortuneTeller.image;
      fortuneTellerImage.alt = fortuneTeller.alt;
      chatBox.classList.add("active");
      suggestionsBox.classList.add("active");
      showQuestion();
    }

    function showQuestion() {
      const question = sessionQuestions[answers.length];
      appendMessage(`第 ${answers.length + 1}／${sessionQuestions.length} 題\n${question.text}`);
      suggestionsBox.replaceChildren();
      question.options.forEach((text, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chip";
        button.textContent = text;
        button.addEventListener("click", () => {
          answers.push({ question: question.text, text, index });
          if (answers.length < sessionQuestions.length) {
            showQuestion();
          } else {
            suggestionsBox.replaceChildren();
            appendMessage("謝謝你的選擇，來看看這次的趣味占卜結果吧。");
            renderResultCard(buildResult());
          }
        });
        suggestionsBox.appendChild(button);
      });
      suggestionsBox.firstElementChild.focus({ preventScroll: true });
    }

    function appendMessage(text) {
      const message = document.createElement("div");
      message.className = "vn-message";

      const speaker = document.createElement("div");
      speaker.className = "vn-speaker";
      speaker.textContent = fortuneTellers[currentMode].name;

      const content = document.createElement("div");
      content.className = "vn-text";
      content.textContent = text;

      message.append(speaker, content);
      dialogueBox.replaceChildren(message);
      dialogueBox.scrollTop = dialogueBox.scrollHeight;
    }

    function getZodiac(date) {
      if (!date) return "";
      const [, month, day] = date.split("-").map(Number);
      const signs = [
        ["摩羯座", "水瓶座", 20], ["水瓶座", "雙魚座", 19],
        ["雙魚座", "牡羊座", 21], ["牡羊座", "金牛座", 20],
        ["金牛座", "雙子座", 21], ["雙子座", "巨蟹座", 21],
        ["巨蟹座", "獅子座", 23], ["獅子座", "處女座", 23],
        ["處女座", "天秤座", 23], ["天秤座", "天蠍座", 23],
        ["天蠍座", "射手座", 22], ["射手座", "摩羯座", 22]
      ];
      const [early, late, cutoff] = signs[month - 1];
      return day < cutoff ? early : late;
    }

    function buildResult() {
      const scores = [0, 0, 0];
      answers.forEach(answer => { scores[answer.index]++; });
      const maxScore = Math.max(...scores);
      const style = answers.find(answer => scores[answer.index] === maxScore).index;
      const styles = [
        {
          keyword: "好奇探索",
          summary: "你的選擇偏向【好奇探索】，喜歡為生活打開新的可能。",
          outlook: "為想試的事保留一點空間，從一個小實驗開始，不必一次決定全部。",
          action: "挑一條沒走過的路，或試試一直想做卻還沒開始的小事。",
          reminder: "新鮮的點子很多時，先確認自己的時間和精力，再挑一件優先做。"
        },
        {
          keyword: "從容沉澱",
          summary: "你的選擇偏向【從容沉澱】，喜歡先觀察、整理，再找到舒服的步調。",
          outlook: "給自己一段不被打擾的時間，把在意的事寫下來，慢慢釐清。",
          action: "泡杯喜歡的飲料，整理一個小角落，或安排一段安靜的休息。",
          reminder: "不必急著有答案；如果思緒打轉，也可以向信任的人說說。"
        },
        {
          keyword: "溫暖連結",
          summary: "你的選擇偏向【溫暖連結】，喜歡在交流和陪伴中找到力量。",
          outlook: "把想法分享給信任的人，也留意自己的需求和界線。",
          action: "傳一則問候、邀人散步，或和朋友分享一件最近的小發現。",
          reminder: "照顧別人之餘，也記得詢問自己是否需要休息或獨處。"
        }
      ];
      const selected = styles[style];
      let title;
      let reading;
      if (currentMode === "tarot") {
        title = `${tarotSpread.topic}・三張牌的故事`;
        reading = ["past", "present", "future"].map((key, index) => {
          const card = tarotSpread[key];
          const meaning = tarotMeanings[card.number][card.orientation === "正位" ? 0 : 1];
          return `${tarotPositions[index]}：${card.name}・${card.orientation}——${meaning}。`;
        }).join("\n");
      } else if (currentMode === "zodiac") {
        const sign = getZodiac(birthDate);
        title = sign ? `${sign}・星光靈感手札` : "星光靈感手札";
        reading = sign
          ? `依你提供的生日，太陽星座為${sign}（採常見日期區間）。這份趣味解讀以你的選擇為主，並非完整星盤。`
          : "這次沒有使用生日或計算星盤，以下是依你的選擇組合的星光靈感。";
      } else {
        title = "趣味命理・福氣靈感手札";
        reading = "這是命理風格的趣味模擬，依你的選擇組合結果，並未計算紫微命盤或八字。";
      }
      return {
        title,
        keyword: selected.keyword,
        summary: `${selected.summary} 這份手札不是預言，而是邀請你用另一個角度看看自己。`,
        todayFortune: reading,
        weeklyOutlook: selected.outlook,
        outfitAndLucky: selected.action,
        warningAndAvoid: selected.reminder,
        healthReminder: `你選了「${answers[0].text}」。回想這個答案帶給你的感覺，也許能幫你找到此刻想珍惜的事。`
      };
    }

    function renderResultCard(card) {
      const title = card.title || "命運指引";
      const keyword = card.keyword || "心誠則靈";
      const summary = card.summary || `本次占卜以【${keyword}】為核心：${card.todayFortune || ""} ${card.weeklyOutlook || ""}`;
      const fortuneTeller = fortuneTellers[currentMode];
      const sections = [
        { icon: "☼", label: "這次的占卜", value: card.todayFortune },
        { icon: "☾", label: "給你的靈感", value: card.weeklyOutlook },
        { icon: "✧", label: "試試這個小行動", value: card.outfitAndLucky },
        { icon: "◇", label: "溫柔提醒", value: card.warningAndAvoid },
        { icon: "❋", label: "回顧你的選擇", value: card.healthReminder }
      ];
      const wrapper = document.createElement("div");
      wrapper.className = "result-card";
      wrapper.innerHTML = `
        <div class="result-cover">
          <div class="result-badge">✦ 你的趣味靈感手札 ✦</div>
          <div class="result-cover-mark" aria-hidden="true">☾</div>
          <h3 class="result-title">${escapeHtml(title)}</h3>
          <div class="result-keyword">${escapeHtml(keyword)}</div>
          <p>一份留給此刻的你，溫柔的提醒</p>
        </div>
        <section class="result-oracle-summary" aria-label="占卜師重點整理">
          <img class="result-oracle-avatar" src="${escapeHtml(fortuneTeller.image)}" alt="${escapeHtml(fortuneTeller.alt)}" />
          <div class="result-oracle-bubble">
            <div class="result-oracle-name">${escapeHtml(fortuneTeller.name)}・重點整理</div>
            <p>${escapeHtml(summary).replace(/【([^】]+)】/g, "<mark>$1</mark>")}</p>
          </div>
        </section>
        <div class="result-sections">
          ${sections.map(section => `
            <section class="result-section">
              <div class="result-section-heading"><span aria-hidden="true">${section.icon}</span><h4>${escapeHtml(section.label)}</h4></div>
              <p>${escapeHtml(section.value)}</p>
            </section>
          `).join("")}
        </div>
        <p class="result-disclaimer">占卜內容僅供娛樂與自我省思參考。</p>
        <div class="card-actions">
          <button class="primary" id="shareResultBtn" type="button">分享結果</button>
          <button id="copyResultBtn" type="button">複製結果</button>
          <button id="restartBtn" type="button">重新占卜</button>
        </div>
        <p class="result-action-status" role="status" aria-live="polite"></p>
      `;

      const shareText = [
        "【星月靈犀占卜館・娛樂參考】",
        `🔮 卦象：${title}（${keyword}）`,
        `✦ 占卜師重點整理：${summary.replace(/[【】]/g, "")}`,
        ...sections.map(section => `${section.label}：${section.value}`)
      ].join("\n");
      const actionStatus = wrapper.querySelector(".result-action-status");
      const copyResult = async () => {
        try {
          if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
          await navigator.clipboard.writeText(shareText);
          actionStatus.textContent = "已複製占卜結果，可以貼給朋友分享。";
        } catch (error) {
          console.error("複製占卜結果失敗", error);
          actionStatus.textContent = "無法複製結果，請確認瀏覽器的剪貼簿權限。";
        }
      };
      wrapper.querySelector("#copyResultBtn").addEventListener("click", copyResult);
      wrapper.querySelector("#shareResultBtn").addEventListener("click", async () => {
        if (!navigator.share) {
          await copyResult();
          return;
        }
        try {
          await navigator.share({ title: "星月靈犀占卜結果", text: shareText });
          actionStatus.textContent = "分享完成。";
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("分享占卜結果失敗", error);
            actionStatus.textContent = "無法分享結果，請嘗試複製後分享。";
          }
        }
      });
      wrapper.querySelector("#restartBtn").addEventListener("click", showModeSelection);

      clearTimeout(resultTimer);
      resultContent.replaceChildren(wrapper);
      resultContent.hidden = true;
      resultLoading.hidden = false;
      viewResultBtn.hidden = false;
      if (!resultDialog.open) resultDialog.showModal();
      resultDialog.scrollTop = 0;
      resultTimer = setTimeout(() => {
        resultLoading.hidden = true;
        resultContent.hidden = false;
      }, 1400);
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    window.addEventListener("DOMContentLoaded", showModeSelection);
