// ★ 請替換為你部署完成的 Google Apps Script Web App 網址
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzi7YVhgnetTFWc1ixLtcV5kXczXTIZOkjhYQKvRuODWhPaE6lm0JdNT6aIlJqEZYNv/exec";

    let currentMode = "tarot";
    let profileData = { skipped: true, fields: {} };
    let chatHistory = [];
    let turnCount = 0;
    let targetQuestionCount = 0;
    let isLoading = false;
    let responseFailed = false;
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
    const inputArea = document.getElementById("inputArea");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
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

    sendBtn.addEventListener("click", () => handleSend());
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) handleSend();
    });
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
      responseFailed = false;
      userInput.disabled = false;
      sendBtn.disabled = false;
      chatHistory = [];
      turnCount = 0;
      targetQuestionCount = 0;
      tarotSpread = null;
      dialogueBox.innerHTML = "";
      suggestionsBox.innerHTML = "";
      chatBox.classList.remove("active");
      suggestionsBox.classList.remove("active");
      inputArea.classList.remove("active");
      intakePanel.style.display = "flex";
      intakePanel.scrollTop = 0;
      userInput.value = "";
    }

    function showModeSelection() {
      resetIntakeView();
      profileData = { skipped: true, fields: {} };
      intakePanel.classList.add("selection-view");
      intakeCard.classList.add("mode-selection");
      intakeCard.innerHTML = `
        <section class="hero section-frame" aria-labelledby="hero-title">
          <div class="hero-copy">
            <p class="eyebrow"><span class="eyebrow-rule"></span> 一間留給自己的小小觀星室 <span class="eyebrow-en">A QUIET SPACE TO LISTEN</span></p>
            <h2 id="hero-title">不急著找答案，<br /><span>先聽聽心裡的回音。</span></h2>
            <p class="hero-description">塔羅、星座與紫微八字，<br class="desktop-break" />替此刻的你，留一則溫柔的靈感手札。</p>
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
          <p>跟著直覺挑一個就好。<br />下一步可填寫資料或直接略過。</p>
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
          <button type="button" class="fortune-card" data-mode="zodiac" aria-label="選擇星座星盤">
            <span class="fortune-card-top"><span>02 / 03</span><span>生日與星座</span></span>
            <span class="fortune-card-icon" aria-hidden="true">☼</span>
            <span class="fortune-card-content">
              <span class="fortune-card-english">A NOTE FROM THE STARS</span>
              <span class="fortune-card-title">星座星盤</span>
              <span class="fortune-card-desc">生日星象與個人星盤參考</span>
            </span>
            <span class="fortune-card-cta">開始探索 →</span>
          </button>
          <button type="button" class="fortune-card" data-mode="ziwei" aria-label="選擇紫微八字">
            <span class="fortune-card-top"><span>03 / 03</span><span>日期與時辰</span></span>
            <span class="fortune-card-icon" aria-hidden="true">☯</span>
            <span class="fortune-card-content">
              <span class="fortune-card-english">BIRTH CHART INSPIRATION</span>
              <span class="fortune-card-title">紫微八字</span>
              <span class="fortune-card-desc">生辰命理與個人運勢參考</span>
            </span>
            <span class="fortune-card-cta">開始探索 →</span>
          </button>
        </div>
        <p class="selection-caption"><span class="eyebrow-rule"></span> 一次只需要一個問題，也可以什麼都不問。</p>
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
        <button type="button" class="btn-start tarot-start" id="tarotStartBtn" disabled>抽完三張牌後開始對話</button>
        <button type="button" class="btn-back" id="backToTopicsBtn">← 返回選擇主題</button>
      `;
      intakeCard.querySelectorAll(".tarot-deck-card").forEach(button => {
        button.addEventListener("click", () => drawTarotCard(button));
      });
      document.getElementById("backToTopicsBtn").addEventListener("click", showTarotTopics);
      document.getElementById("tarotStartBtn").addEventListener("click", () => {
        const [past, present, future] = tarotDrawn.map(({ name, orientation, figure }) => ({ name, orientation, figure }));
        tarotSpread = { topic: tarotTopic, past, present, future };
        profileData = { skipped: true, fields: {} };
        chatHistory = [];
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
        status.textContent = `未來抽到「${card.name}」${card.orientation}。三張牌已揭曉，可以開始對話。`;
        start.disabled = false;
        start.textContent = "開始與占卜師對話";
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
          <div class="intake-title">☯ 紫微八字・生辰參考資料</div>
          <div class="intake-desc">就像傳統命理師看盤前會先問生辰一樣，你可以填寫以下資料；若不想提供或忘記時辰，直接按「略過」也能開始對話。</div>
          <div class="form-group">
            <label>曆法類型</label>
            <select id="zwCalendar">
              <option value="國曆">國曆</option>
              <option value="農曆">農曆</option>
            </select>
          </div>
          <div class="form-group">
            <label>出生年月日</label>
            <input type="date" id="zwBirthDate" />
          </div>
          <div class="form-group">
            <label>出生時辰</label>
            <select id="zwBirthTime">
              <option value="不確定">不確定／不清楚</option>
              <option value="子時 (23:00-00:59)">子時 (23:00-00:59)</option>
              <option value="丑時 (01:00-02:59)">丑時 (01:00-02:59)</option>
              <option value="寅時 (03:00-04:59)">寅時 (03:00-04:59)</option>
              <option value="卯時 (05:00-06:59)">卯時 (05:00-06:59)</option>
              <option value="辰時 (07:00-08:59)">辰時 (07:00-08:59)</option>
              <option value="巳時 (09:00-10:59)">巳時 (09:00-10:59)</option>
              <option value="午時 (11:00-12:59)">午時 (11:00-12:59)</option>
              <option value="未時 (13:00-14:59)">未時 (13:00-14:59)</option>
              <option value="申時 (15:00-16:59)">申時 (15:00-16:59)</option>
              <option value="酉時 (17:00-18:59)">酉時 (17:00-18:59)</option>
              <option value="戌時 (19:00-20:59)">戌時 (19:00-20:59)</option>
              <option value="亥時 (21:00-22:59)">亥時 (21:00-22:59)</option>
            </select>
          </div>
          <div class="form-group">
            <label>性別（選填）</label>
            <select id="zwGender">
              <option value="">不指定</option>
              <option value="女">女</option>
              <option value="男">男</option>
            </select>
          </div>
          <div class="intake-actions">
            <button class="btn-skip" id="skipBtn">略過，直接聊</button>
            <button class="btn-start" id="startBtn">填入資料並開始</button>
          </div>
        `;
      } else if (currentMode === "zodiac") {
        intakeCard.innerHTML = `
          <div class="intake-title">♈ 星座星盤・生日星象資料</div>
          <div class="intake-desc">提供生日可讓星象解讀更貼近你的星座與流年；若不想填寫，也可直接點選「略過」。</div>
          <div class="form-group">
            <label>出生日期</label>
            <input type="date" id="zdBirthDate" />
          </div>
          <div class="form-group">
            <label>出生時間（選填，不知道可留白）</label>
            <input type="time" id="zdBirthTime" />
          </div>
          <div class="form-group">
            <label>出生地點（選填，例如：台北、台中）</label>
            <input type="text" id="zdBirthPlace" placeholder="可留白" maxlength="30" />
          </div>
          <div class="intake-actions">
            <button class="btn-skip" id="skipBtn">略過，直接聊</button>
            <button class="btn-start" id="startBtn">填入資料並開始</button>
          </div>
        `;
      }

      intakeCard.insertAdjacentHTML("beforeend", '<button type="button" class="btn-back" id="backToModesBtn">← 返回選擇占卜方式</button>');
      document.getElementById("backToModesBtn").addEventListener("click", showModeSelection);

      document.getElementById("skipBtn").addEventListener("click", () => {
        profileData = { skipped: true, fields: {} };
        enterChatSession();
      });

      document.getElementById("startBtn").addEventListener("click", () => {
        const fields = collectFieldsByMode(currentMode);
        const hasAnyValue = Object.values(fields).some(v => v && v !== "不指定");
        profileData = {
          skipped: !hasAnyValue,
          fields: fields
        };
        enterChatSession();
      });
    }

    function collectFieldsByMode(mode) {
      if (mode === "ziwei") {
        return {
          calendarType: document.getElementById("zwCalendar")?.value || "",
          birthDate: document.getElementById("zwBirthDate")?.value || "",
          birthTime: document.getElementById("zwBirthTime")?.value || "",
          gender: document.getElementById("zwGender")?.value || ""
        };
      }
      if (mode === "zodiac") {
        return {
          birthDate: document.getElementById("zdBirthDate")?.value || "",
          birthTime: document.getElementById("zdBirthTime")?.value || "",
          birthPlace: document.getElementById("zdBirthPlace")?.value.trim() || ""
        };
      }
    }

    function enterChatSession() {
      turnCount = 1;
      targetQuestionCount = 4 + Math.floor(Math.random() * 3);
      intakePanel.style.display = "none";
      const fortuneTeller = fortuneTellers[currentMode];
      fortuneTellerImage.src = fortuneTeller.image;
      fortuneTellerImage.alt = fortuneTeller.alt;
      chatBox.classList.add("active");
      suggestionsBox.classList.add("active");
      inputArea.classList.add("active");
      requestAIResponse();
    }

    function handleSend(customText) {
      if (isLoading) return;
      const text = (customText || userInput.value).trim();
      if (!text) return;
      userInput.blur();

      if (text === "再算另一件事" || text === "換個方式占卜") {
        showModeSelection();
        return;
      }

      userInput.value = "";
      appendMessage("user", text);
      chatHistory.push({ role: "user", text });
      turnCount++;
      requestAIResponse();
    }

    async function requestAIResponse() {
      isLoading = true;
      responseFailed = false;
      sendBtn.disabled = true;
      suggestionsBox.innerHTML = "";

      const loadingEl = appendMessage("ai", "✨ 正在感應你的氣場與星象...");

      try {
        const res = await fetch(GAS_WEB_APP_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            mode: currentMode,
            history: chatHistory,
            turnCount: turnCount,
            targetQuestionCount: targetQuestionCount,
            profileData: profileData,
            ...(currentMode === "tarot" ? { tarotSpread } : {})
          })
        });

        const json = await res.json();
        loadingEl.remove();

        if (!json.success) {
          appendMessage("ai", json.error || "占卜服務回報錯誤，請檢查後端與 Gemini API 設定後再試。");
          console.error(json);
          showRetryButton();
          return;
        }

        const aiData = json.data;
        appendMessage("ai", aiData.reply);
        chatHistory.push({ role: "assistant", text: aiData.reply });

        if (aiData.isFinal && aiData.resultCard) {
          renderResultCard(aiData.resultCard);
        }

        renderSuggestions(aiData.suggestions || []);

      } catch (err) {
        loadingEl.remove();
        appendMessage("ai", "連線似乎暫時中斷了，請確認網路或 GAS 網址是否正確。");
        console.error(err);
        showRetryButton();
      } finally {
        isLoading = false;
        sendBtn.disabled = responseFailed;
        userInput.disabled = responseFailed;
      }
    }

    function appendMessage(sender, text) {
      const message = document.createElement("div");
      message.className = `vn-message ${sender}`;

      const speaker = document.createElement("div");
      speaker.className = "vn-speaker";
      speaker.textContent = sender === "ai" ? fortuneTellers[currentMode].name : "你";

      const content = document.createElement("div");
      content.className = "vn-text";
      content.textContent = text;

      message.append(speaker, content);
      dialogueBox.replaceChildren(message);
      dialogueBox.scrollTop = dialogueBox.scrollHeight;
      return message;
    }

    function renderSuggestions(list) {
      suggestionsBox.innerHTML = "";
      list.forEach(item => {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.textContent = item;
        chip.addEventListener("click", () => handleSend(item));
        suggestionsBox.appendChild(chip);
      });
    }

    function showRetryButton() {
      responseFailed = true;
      const retry = document.createElement("button");
      retry.className = "chip";
      retry.textContent = "重新嘗試";
      retry.addEventListener("click", requestAIResponse);
      suggestionsBox.replaceChildren(retry);
    }

    function renderResultCard(card) {
      const title = card.title || "命運指引";
      const keyword = card.keyword || "心誠則靈";
      const summary = card.summary || `本次占卜以【${keyword}】為核心：${card.todayFortune || ""} ${card.weeklyOutlook || ""}`;
      const fortuneTeller = fortuneTellers[currentMode];
      const sections = [
        { icon: "☼", label: "今日即時運勢", value: card.todayFortune || "未提供" },
        { icon: "☾", label: "未來 3～7 天走勢與專屬開運法", value: card.weeklyOutlook || "未提供" },
        { icon: "✧", label: "開運穿搭與隨身小物", value: card.outfitAndLucky || "未提供" },
        { icon: "◇", label: "避雷指南：防範人事物與禁忌色", value: card.warningAndAvoid || "未提供" },
        { icon: "❋", label: "身心健康叮嚀", value: card.healthReminder || "未提供" }
      ];
      const wrapper = document.createElement("div");
      wrapper.className = "result-card";
      wrapper.innerHTML = `
        <div class="result-cover">
          <div class="result-badge">✦ 專屬命理啟示錄 ✦</div>
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
