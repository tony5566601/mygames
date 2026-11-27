const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const element = { addEventListener() {} };
const context = vm.createContext({
  document: { getElementById: () => element },
  window: { addEventListener() {} }
});
vm.runInContext(fs.readFileSync(path.join(root, "js", "questions.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "js", "common.js"), "utf8"), context);

test("each mode has 100 distinct questions with three distinct options", () => {
  const groups = vm.runInContext("questionGroups", context);
  for (const mode of ["tarot", "zodiac", "ziwei"]) {
    const questions = groups[mode].flatMap(group => group.questions);
    assert.equal(questions.length, 100, mode);
    assert.equal(new Set(questions).size, 100, mode);
    for (const group of groups[mode]) {
      assert.equal(group.options.length, 3, mode);
      assert.equal(new Set(group.options).size, 3, mode);
    }
  }
});

test("birthday boundaries and skipped birthday produce the appropriate zodiac result", () => {
  for (const [date, expected] of [
    ["2000-01-19", "摩羯座"], ["2000-01-20", "水瓶座"],
    ["2000-02-18", "水瓶座"], ["2000-02-19", "雙魚座"],
    ["2000-03-20", "雙魚座"], ["2000-03-21", "牡羊座"],
    ["2000-12-21", "射手座"], ["2000-12-22", "摩羯座"]
  ]) {
    assert.equal(context.getZodiac(date), expected);
  }
  assert.equal(context.getZodiac(""), "");
  const reading = vm.runInContext(`
    currentMode = "zodiac";
    birthDate = "";
    answers = [{ text: "測試", index: 0 }];
    buildResult().todayFortune;
  `, context);
  assert.match(reading, /沒有使用生日/);
});

test("tarot results use each drawn card and orientation, and answers affect the result", () => {
  const results = vm.runInContext(`
    currentMode = "tarot";
    answers = [{ text: "測試", index: 0 }];
    tarotCards.flatMap((card, number) => ["正位", "逆位"].map(orientation => {
      const drawn = { ...card, number, orientation };
      tarotSpread = { topic: "工作", past: drawn, present: drawn, future: drawn };
      const result = buildResult();
      return result.todayFortune.includes(tarotMeanings[number][orientation === "正位" ? 0 : 1]);
    }));
  `, context);
  assert.equal(results.length, 44);
  assert.ok(results.every(Boolean));

  const keywords = vm.runInContext(`
    [0, 1, 2].map(index => {
      answers = [{ text: "測試", index }];
      return buildResult().keyword;
    });
  `, context);
  assert.equal(new Set(keywords).size, 3);
});
