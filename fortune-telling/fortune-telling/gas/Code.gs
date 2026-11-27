/**
 * 算命小遊戲後端中繼 API：三張塔羅牌陣與 4～6 題對話。
 * GEMINI_API_KEY 請設定於 Apps Script 的指令碼屬性。
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var history = payload.history || [];
    var mode = payload.mode || 'tarot';
    var turnCount = Number(payload.turnCount) || 1;
    var profileData = payload.profileData || {};
    var tarotSpread = payload.tarotSpread || null;
    var targetQuestionCount = payload.targetQuestionCount == null ? 5 : Number(payload.targetQuestionCount);

    if (!Number.isInteger(targetQuestionCount) || targetQuestionCount < 4 || targetQuestionCount > 6) {
      return createJsonResponse({ error: '提問數量必須是 4 到 6 的整數' });
    }

    var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      return createJsonResponse({ error: '後端尚未設定 GEMINI_API_KEY' });
    }

    var shouldBeFinal = turnCount > targetQuestionCount;
    var systemInstruction = buildSystemPrompt(mode, turnCount, profileData, tarotSpread, targetQuestionCount);
    var contents = history.map(function(item) {
      return {
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.text }]
      };
    });

    if (contents.length === 0) {
      var starterText = '你好，我想請你幫我算命，請開始引導我。';
      if (mode === 'tarot' && tarotSpread) {
        var p = tarotSpread.past || {};
        var n = tarotSpread.present || {};
        var f = tarotSpread.future || {};
        var pLabel = (p.name || '') + (p.orientation ? '・' + p.orientation : '');
        var nLabel = (n.name || '') + (n.orientation ? '・' + n.orientation : '');
        var fLabel = (f.name || '') + (f.orientation ? '・' + f.orientation : '');
        starterText = '我想占卜的主題是「' + (tarotSpread.topic || '運勢') + '」。' +
          '我剛抽出了三張牌：過去是【' + pLabel + '】（代表人物：' + (p.figure || '無') + '）、' +
          '現在是【' + nLabel + '】（代表人物：' + (n.figure || '無') + '）、' +
          '未來是【' + fLabel + '】（代表人物：' + (f.figure || '無') + '）。' +
          '請幫我解讀這組牌陣並開始對話。';
      }
      contents.push({ role: 'user', parts: [{ text: starterText }] });
    }

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=' + apiKey;
    var requestBody = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            reply: {
              type: 'STRING',
              description: shouldBeFinal
                ? '用一句話引導玩家閱讀最終占卜結果，不要再提問。'
                : '算命師對使用者說的話，簡短自然且具體，最多 2 句、80 個中文字，本次只問 1 個核心問題，不要產生最終結論。'
            },
            suggestions: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: shouldBeFinal
                ? '給 ["再算另一件事", "換個方式占卜"]'
                : '針對本次問題提供 2 到 3 個具體情境快捷回覆選項。'
            },
            resultCard: {
              type: 'OBJECT',
              description: '最終占卜結果，以下 8 個欄位全部必填，不可留空或省略任何一個欄位',
              properties: {
                title: {
                  type: 'STRING',
                  description: '【必填】命理結論標題（塔羅寫三張牌陣核心結論與關鍵牌名；星座寫星象相位；紫微寫格局氣場）'
                },
                keyword: {
                  type: 'STRING',
                  description: '【必填】四字運勢箴言（例如：雲開見月、潛龍勿用、金水相生）'
                },
                summary: {
                  type: 'STRING',
                  description: '【必填】占卜師對玩家的整體重點整理，結合並解釋標題、今日運勢、未來走勢、開運與提醒，80～120 字；以【】標示 2～3 個最重要的關鍵詞或行動。'
                },
                todayFortune: {
                  type: 'STRING',
                  description: '【必填】今日即時運勢：點出今天具體情境、情緒起伏與關鍵時段（50～80 字）'
                },
                weeklyOutlook: {
                  type: 'STRING',
                  description: '【必填】未來 3～7 天走勢與開運法：說明未來幾天轉折與具體開運做法（紫微給紅包/時辰/方位；星座給星象行動；塔羅給牌陣與生活儀式）（70～110 字）'
                },
                outfitAndLucky: {
                  type: 'STRING',
                  description: '【必填】開運穿搭與隨身小物：具體服裝單品、材質、色系與隨身物品（40～70 字）'
                },
                warningAndAvoid: {
                  type: 'STRING',
                  description: '【必填】避雷指南（人・事・色）：防範哪種特質的人、避免做什麼決定、避開的禁忌顏色（40～70 字）'
                },
                healthReminder: {
                  type: 'STRING',
                  description: '【必填】身心健康叮嚀：需注意的身體部位或作息問題與日常保養法（35～60 字）'
                }
              },
              required: ['title', 'keyword', 'summary', 'todayFortune', 'weeklyOutlook', 'outfitAndLucky', 'warningAndAvoid', 'healthReminder']
            }
          },
          required: ['reply', 'suggestions']
        }
      }
    };
    if (shouldBeFinal) {
      requestBody.generationConfig.responseSchema.required.push('resultCard');
    } else {
      delete requestBody.generationConfig.responseSchema.properties.resultCard;
    }

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    });
    var resCode = response.getResponseCode();
    var resText = response.getContentText();

    if (resCode !== 200) {
      return createJsonResponse({ error: 'Gemini API 錯誤 (' + resCode + ')', detail: resText });
    }

    var resJson = JSON.parse(resText);
    var aiText = (resJson.candidates &&
      resJson.candidates[0] &&
      resJson.candidates[0].content &&
      resJson.candidates[0].content.parts &&
      resJson.candidates[0].content.parts[0] &&
      resJson.candidates[0].content.parts[0].text) || '{}';

    var parsedData;
    try {
      parsedData = JSON.parse(aiText);
    } catch (parseErr) {
      return createJsonResponse({ error: '模型回傳格式解析失敗', raw: aiText });
    }

    if (!parsedData || typeof parsedData.reply !== 'string' || !parsedData.reply.trim()) {
      return createJsonResponse({ error: '模型沒有回傳有效的對話內容，請重試。' });
    }
    if (shouldBeFinal && (!parsedData.resultCard || typeof parsedData.resultCard !== 'object' || Array.isArray(parsedData.resultCard))) {
      return createJsonResponse({ error: '模型沒有回傳有效的結果卡，請重試。' });
    }
    parsedData.isFinal = shouldBeFinal;

    if (!Array.isArray(parsedData.suggestions) || parsedData.suggestions.length === 0) {
      parsedData.suggestions = parsedData.isFinal
        ? ['再算另一件事', '換個方式占卜']
        : ['目前還在觀察中', '卡在現實與溝通'];
    }

    if (parsedData.isFinal) {
      parsedData.resultCard = normalizeResultCard(parsedData.resultCard, mode, tarotSpread);
    } else {
      parsedData.resultCard = null;
    }
    return createJsonResponse({ success: true, data: parsedData });
  } catch (err) {
    return createJsonResponse({ error: err.message });
  }
}

function normalizeResultCard(card, mode, tarotSpread) {
  var c = (card && typeof card === 'object') ? card : {};
  var fallbackByMode = {
    tarot: {
      title: tarotSpread
        ? ('【' + (tarotSpread.topic || '運勢') + '】' +
            ((tarotSpread.past && tarotSpread.past.name) || '') + ' → ' +
            ((tarotSpread.present && tarotSpread.present.name) || '') + ' → ' +
            ((tarotSpread.future && tarotSpread.future.name) || ''))
        : '塔羅三牌陣深度指引',
      keyword: '順勢破局',
      summary: '整體以【順勢破局】為主軸：先釐清眼前優先順序，別被情緒或他人言語牽著走；接下來幾天適合把想推進的事化為一步行動，重要承諾先確認細節，也記得留時間休息。',
      todayFortune: '今天適合先釐清眼前的優先順序，下午到傍晚情緒較容易受他人話語牽動，先聽清楚再做回應。',
      weeklyOutlook: '未來 3～7 天將從盤點現況走向明確抉擇。建議睡前點燃木質或鼠尾草香氛，並把想推進的一件事寫在紙上具體執行。',
      outfitAndLucky: '建議穿著米白色或暖杏色針織衫，搭配銀飾或白水晶隨身飾品，有助穩定直覺與沉澱思緒。',
      warningAndAvoid: '未來幾天要留心只說不練、容易畫大餅或情緒勒索的人，暫緩衝動承諾，並避開過於刺眼的螢光色系。',
      healthReminder: '留意肩頸僵硬與淺眠問題，睡前 1 小時放下手機，做 5 分鐘伸展與溫水泡腳。'
    },
    zodiac: {
      title: '星象流年與內在張力解析',
      keyword: '星盤轉折',
      summary: '這段時間的核心是【星盤轉折】：思緒活躍、容易反覆，先把真正重視的事寫下來；未來幾天逐步回到行動，主動釐清誤會、避免情緒上頭時做承諾，並照顧好睡眠與肩頸。',
      todayFortune: '今天思緒活躍但容易想太多，尤其在溝通與決定細節時容易反覆，建議把重點寫下來再與人討論。',
      weeklyOutlook: '未來 3～7 天能量逐步聚焦在行動落實，適合主動釐清誤會、整理待辦清單，並把握白天精神最集中的時段推進關鍵任務。',
      outfitAndLucky: '建議選擇霧霾藍、燕麥白或柔和大地色系穿搭，搭配珍珠或月光石飾品，幫助平衡情緒起伏。',
      warningAndAvoid: '避免在情緒上頭時傳長訊息或做重大承諾，留心過度干涉他人私事的人，並避開過於厚重壓抑的暗色系。',
      healthReminder: '注意用眼過度、肩頸緊繃與腸胃消化不良，定時起身走動並補充足夠水分。'
    },
    ziwei: {
      title: '流日氣場與五行開運格局',
      keyword: '金水相生',
      summary: '整體走勢是【金水相生】，宜先穩住節奏再求突破：今天上午適合處理要事，午後避免倉促決定；未來幾天把握合適時機推進計畫，留意溝通中的小人與作息。',
      todayFortune: '今日氣場重在穩紮穩打，上午適合處理帳務、文件或關鍵聯絡，下午則宜守不宜攻，避免臨時更動計畫。',
      weeklyOutlook: '未來 3～7 天貴人與變數並存。可準備一個新紅包袋放入 168 元或 600 元新鈔隨身或壓枕頭下三天，並把握辰時（07:00-09:00）或午時（11:00-13:00）行動。',
      outfitAndLucky: '五行開運建議穿墨綠色、酒紅色或暖棕色棉麻衣物，搭配木質手串、玉珮或黃金飾品穩固氣場。',
      warningAndAvoid: '防範口蜜腹劍、愛打聽八卦的小人，申時（15:00-17:00）避免重大財務決策，並避開全黑或慘白色系。',
      healthReminder: '留意肝火旺盛、眼睛乾澀與晚間熬夜問題，盡量在晚上 11 點前就寢，飲食減少冰冷與油炸。'
    }
  };
  var fb = fallbackByMode[mode] || fallbackByMode.tarot;
  return {
    title: cleanField(c.title, fb.title),
    keyword: cleanField(c.keyword, fb.keyword),
    summary: cleanField(c.summary, fb.summary),
    todayFortune: cleanField(c.todayFortune, fb.todayFortune),
    weeklyOutlook: cleanField(c.weeklyOutlook, fb.weeklyOutlook),
    outfitAndLucky: cleanField(c.outfitAndLucky, fb.outfitAndLucky),
    warningAndAvoid: cleanField(c.warningAndAvoid, fb.warningAndAvoid),
    healthReminder: cleanField(c.healthReminder, fb.healthReminder)
  };
}

function cleanField(val, fallback) {
  if (typeof val === 'string' && val.trim().length > 0 && val.trim() !== '未提供') {
    return val.trim();
  }
  return fallback;
}

function doGet() {
  return createJsonResponse({ status: 'ok', message: 'Fortune Teller GAS Proxy (8-Field Guaranteed) is running.' });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function formatProfileSummary(mode, profileData, tarotSpread) {
  if (mode === 'tarot') {
    if (!tarotSpread) {
      return '玩家尚未傳入三張牌陣資料，請引導玩家選擇感情、工作或運勢主題。';
    }
    var p = tarotSpread.past || {};
    var n = tarotSpread.present || {};
    var f = tarotSpread.future || {};
    return '玩家已完成塔羅抽牌！\n' +
      '- 占卜主題：【' + (tarotSpread.topic || '綜合運勢') + '】\n' +
      '- 過去牌位：【' + (p.name || '未知') + '（' + (p.orientation || '正位') + '）】｜代表人物原型：' + (p.figure || '未知') + '\n' +
      '- 現在牌位：【' + (n.name || '未知') + '（' + (n.orientation || '正位') + '）】｜代表人物原型：' + (n.figure || '未知') + '\n' +
      '- 未來牌位：【' + (f.name || '未知') + '（' + (f.orientation || '正位') + '）】｜代表人物原型：' + (f.figure || '未知') + '\n' +
      '請嚴格依據這三張牌的牌義、正逆位能量與代表人物特質進行串聯解讀。';
  }

  if (!profileData || profileData.skipped) {
    return '玩家選擇「略過」前置基本資料。請直接從對方目前最卡關的「具體事件」切入，用精準的二選一情境問題快速鎖定現況。';
  }

  var f = profileData.fields || {};
  if (mode === 'ziwei') {
    var parts = [];
    if (f.calendarType) parts.push('曆法：' + f.calendarType);
    if (f.birthDate) parts.push('出生日期：' + f.birthDate);
    if (f.birthTime) parts.push('出生時辰：' + f.birthTime);
    if (f.gender) parts.push('性別：' + f.gender);
    return parts.length > 0
      ? '玩家已提供生辰資料（' + parts.join('、') + '）。請推算其日主五行屬性或命宮主星氣場（若時辰不確定則以年/日柱五行與流年氣場推論），在對話中直接點出一項盲點破冰。'
      : '玩家未填寫具體生辰，請以流日五行氣場切入並詢問具體困擾。';
  }

  if (mode === 'zodiac') {
    var zParts = [];
    if (f.birthDate) zParts.push('出生日期：' + f.birthDate);
    if (f.birthTime) zParts.push('出生時間：' + f.birthTime);
    if (f.birthPlace) zParts.push('出生地點：' + f.birthPlace);
    return zParts.length > 0
      ? '玩家已提供星盤資料（' + zParts.join('、') + '）。請先點出太陽星座特質與近期行星過境帶來的內在拉扯，再切入提問。'
      : '玩家未填寫出生日期，請先鎖定他最想看的情感/事業領域切入。';
  }
  return '';
}

function buildSystemPrompt(mode, turnCount, profileData, tarotSpread, targetQuestionCount) {
  var personaMap = {
    tarot: '你是一位直覺極準、觀察入微的「現代塔羅占卜師」。\n' +
      '【塔羅三張牌陣規則】\n' +
      '- 第 1 輪：簡短點名過去、現在、未來三張牌並串聯處境，接著問 1 個具體問題。\n' +
      '- 後續提問輪次：深挖現實阻力或對方真實態度，每次只問 1 個問題。\n' +
      '- 最終解析：完整填寫 resultCard 的全部 8 個欄位，風格偏西式直覺與生活美學，具體寫出服裝材質色系、隨身小物、防範人事物、禁忌色與健康提醒。',
    zodiac: '你是一位精通現代心理占星與行星流年的「星象解讀師」。\n' +
      '- 對話時結合星座性格慣性與近期星象張力，一針見血點出內在矛盾，每次只問 1 個問題。\n' +
      '- 最終解析必須完整填寫 resultCard 的全部 8 個欄位，結合星象能量、都會穿搭色系、避雷人事色與星座對應身體部位保養。',
    ziwei: '你是一位深諳傳統命理、講話接地氣又帶點老師傅篤定感的「紫微八字命理師」。\n' +
      '- 對話時用白話點出五行生剋、流年氣場與現實利害，每次只問 1 個問題。\n' +
      '- 最終解析必須完整填寫 resultCard 的全部 8 個欄位，包含中式開運法（如紅包放 168/600 元新鈔、辰時/午時行動、方位）、五行穿搭與飾品、防範小人與禁忌色、中醫臟腑作息叮嚀。'
  };
  var basePersona = personaMap[mode] || personaMap.tarot;
  var profileNote = formatProfileSummary(mode, profileData, tarotSpread);
  var stage = turnCount <= targetQuestionCount
    ? '這是第 ' + turnCount + ' 題，共需詢問 ' + targetQuestionCount + ' 題。請根據既有對話提出 1 個不重複的問題，不要產生最終結論或結果卡。'
    : '玩家已回答完 ' + targetQuestionCount + ' 題。現在不再提問，請產生最終解析與完整結果卡。';

  return basePersona + '\n\n' +
    '【玩家前置資料與牌陣狀態】\n' + profileNote + '\n\n' +
    '【輸出鐵則】\n' +
    '1. ' + stage + '\n' +
    '2. 對話回覆務必精簡：最多 2 句、80 個中文字，只保留必要解讀與問題，不重複玩家說過的內容；不要長篇解說。最終回覆只用 1 句引導閱讀結果卡。\n' +
    '3. 禁止空泛心靈雞湯，每句話都要有具體細節。\n' +
    '4. 最終解析時，resultCard 的 title、keyword、summary、todayFortune、weeklyOutlook、outfitAndLucky、warningAndAvoid、healthReminder 共 8 個欄位缺一不可，全部都要寫出具體內容。summary 必須統整並解釋其餘結果欄位，80～120 字，並以【】標示 2～3 個重點。\n' +
    '5. 本互動純屬娛樂與生活開運參考，不做醫療診斷。';
}
