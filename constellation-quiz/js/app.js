$(document).ready(function () {
    const TOTAL_QUESTIONS = 8; // 每次測驗題數
    let selectedQuestions = [];
    let currentStep = 0;
    let zodiacScores = new Array(12).fill(0);
    let isTransitioning = false;
    let currentResult = null;

    // 取得帶星座參數的分享網址（例如 ?res=7）
    function getShareUrl(zodiacId) {
        const baseUrl = `${window.location.origin}${window.location.pathname}`;
        return `${baseUrl}?res=${zodiacId}`;
    }

    // 檢查網址是否帶有 ?res=0~11 參數（好友分享進來）
    function checkSharedParam() {
        const params = new URLSearchParams(window.location.search);
        const resParam = params.get("res");
        if (resParam !== null && /^\d+$/.test(resParam)) {
            const idx = parseInt(resParam, 10);
            if (idx >= 0 && idx < zodiacResults.length) {
                const sharedZodiac = zodiacResults[idx];
                $("#shared-zodiac-name").text(`${sharedZodiac.symbol} ${sharedZodiac.name}`);
                $("#shared-banner").show();

                // 點擊「查看該星座解析」直接顯示該星座結果卡片
                $("#btn-view-shared").off("click").on("click", function () {
                    currentResult = sharedZodiac;
                    renderResult(currentResult);
                    switchView("view-result");
                });

                // 點擊「我也來測測看」隱藏橫幅並開始測驗
                $("#btn-take-test-from-share").off("click").on("click", function () {
                    $("#shared-banner").slideUp(200);
                    startQuiz();
                });
            }
        }
    }

    // Fisher-Yates 洗牌演算法：從題庫隨機抽出 N 題不重複
    function pickRandomQuestions(bank, count) {
        const cloned = [...bank];
        for (let i = cloned.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
        }
        return cloned.slice(0, Math.min(count, cloned.length));
    }

    // 切換畫面 View
    function switchView(viewId) {
        $(".view").removeClass("active");
        $(`#${viewId}`).addClass("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 初始化並開始測驗
    function startQuiz() {
        $("#shared-banner").slideUp(180);
        zodiacScores = new Array(12).fill(0);
        currentStep = 0;
        isTransitioning = false;
        selectedQuestions = pickRandomQuestions(questionBank, TOTAL_QUESTIONS);

        switchView("view-quiz");
        renderQuestion();
    }

    // 渲染當前題目
    function renderQuestion() {
        const q = selectedQuestions[currentStep];
        const progressPercent = ((currentStep + 1) / TOTAL_QUESTIONS) * 100;

        $("#progress-text").text(`${currentStep + 1} / ${TOTAL_QUESTIONS}`);
        $("#progress-bar-fill").css("width", `${progressPercent}%`);
        $("#q-category").text(q.category || "潛意識探索");
        $("#q-title").text(q.question);

        const $optionsList = $("#options-list");
        $optionsList.empty();

        q.options.forEach((opt, idx) => {
            const $btn = $("<button>")
                .addClass("option-btn")
                .text(opt.text)
                .attr("data-index", idx);
            $optionsList.append($btn);
        });

        $("#question-box").removeClass("fade-out");
    }

    // 選項點擊事件（含防連點鎖定）
    $(document).on("click", ".option-btn", function () {
        if (isTransitioning) return;
        isTransitioning = true;

        const $clicked = $(this);
        const optIndex = parseInt($clicked.attr("data-index"), 10);
        const currentQ = selectedQuestions[currentStep];
        const chosenOption = currentQ.options[optIndex];

        // 視覺選中效果
        $clicked.addClass("selected");

        // 累加對應星座權重分數
        if (chosenOption && Array.isArray(chosenOption.scores)) {
            chosenOption.scores.forEach((zodiacIdx) => {
                if (zodiacIdx >= 0 && zodiacIdx < 12) {
                    zodiacScores[zodiacIdx] += 1;
                }
            });
        }

        // 延遲切換下一題或進入結算
        setTimeout(() => {
            currentStep++;
            if (currentStep < TOTAL_QUESTIONS) {
                $("#question-box").addClass("fade-out");
                setTimeout(() => {
                    renderQuestion();
                    isTransitioning = false;
                }, 240);
            } else {
                showLoadingAndCalculate();
            }
        }, 320);
    });

    // 占星運算過場與結算最高分星座
    function showLoadingAndCalculate() {
        switchView("view-loading");

        const loadingPhrases = [
            "正在連結你的潛意識星象...",
            "解析四象限能量光譜中...",
            "鎖定你的靈魂本命星座！"
        ];
        let phraseIdx = 0;
        const textTimer = setInterval(() => {
            phraseIdx++;
            if (phraseIdx < loadingPhrases.length) {
                $("#loading-text").text(loadingPhrases[phraseIdx]);
            }
        }, 650);

        setTimeout(() => {
            clearInterval(textTimer);
            const maxScore = Math.max(...zodiacScores);
            const topIndices = [];
            zodiacScores.forEach((score, idx) => {
                if (score === maxScore) topIndices.push(idx);
            });
            const winnerIdx = topIndices[Math.floor(Math.random() * topIndices.length)];
            currentResult = zodiacResults[winnerIdx];

            renderResult(currentResult);
            switchView("view-result");
            isTransitioning = false;
        }, 2000);
    }

    // 渲染最終結果頁
    function renderResult(res) {
        $("#res-symbol").text(res.symbol);
        $("#res-name").text(res.name);
        $("#res-slogan").text(res.slogan);
        $("#res-desc").text(res.desc);
        $("#res-match").text(res.match);
        $("#res-color").text(res.color);

        $("#stat-1, #stat-2, #stat-3").css("width", "0%");
        setTimeout(() => {
            res.stats.forEach((val, i) => {
                $(`#stat-${i + 1}`).css("width", `${val}%`);
                $(`#stat-val-${i + 1}`).text(`${val}%`);
            });
        }, 150);
    }

    // Toast 提示
    function showToast(msg) {
        const $toast = $("#toast");
        $toast.text(msg).addClass("show");
        setTimeout(() => {
            $toast.removeClass("show");
        }, 2200);
    }

    // ==================== 按鈕綁定 ====================
    $("#btn-start, #btn-restart").on("click", function () {
        startQuiz();
    });

    // 1. 儲存結果圖卡 (html2canvas)
    $("#btn-save-img").on("click", function () {
        if (!currentResult) return;
        const cardElement = document.getElementById("capture-card");
        showToast("正在生成高畫質星盤圖卡...");

        html2canvas(cardElement, {
            backgroundColor: "#10132e",
            scale: 2,
            useCORS: true
        }).then((canvas) => {
            const link = document.createElement("a");
            link.download = `潛意識星盤_${currentResult.name}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            showToast("圖卡已下載，快去分享吧！");
        }).catch(() => {
            showToast("圖卡生成失敗，請直接使用手機截圖喔！");
        });
    });

    // 2. LINE 分享（帶入 ?res= 星座參數）
    $("#btn-share-line").on("click", function () {
        if (!currentResult) return;
        const shareUrl = encodeURIComponent(getShareUrl(currentResult.id));
        const shareText = encodeURIComponent(
            `我在《潛意識星盤》測出了【${currentResult.name}】！${currentResult.slogan} 快來測測你的靈魂本命星座：`
        );
        window.open(`https://social-plugins.line.me/lineit/share?url=${shareUrl}&text=${shareText}`, "_blank");
    });

    // 3. 複製連結 / 原生分享（帶入 ?res= 星座參數）
    $("#btn-copy-link").on("click", function () {
        if (!currentResult) return;
        const shareUrl = getShareUrl(currentResult.id);
        const shareData = {
            title: "潛意識星盤｜測出你靈魂深處的本命星座",
            text: `我測出了【${currentResult.name}】！${currentResult.slogan}`,
            url: shareUrl
        };

        if (navigator.share) {
            navigator.share(shareData).catch(() => { });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
                showToast("已複製帶結果的測驗連結！");
            });
        } else {
            showToast("請複製瀏覽器網址分享給好友！");
        }
    });

    // 頁面載入時檢查是否有分享參數
    checkSharedParam();
});