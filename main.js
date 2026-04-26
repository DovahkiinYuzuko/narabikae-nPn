// main.js
let worker = null;
let workerBlobUrl = null;
let allResults = [];
let displayedCount = 0;
const PAGE_SIZE = 500;
let currentLang = 'ja';

const translations = {
  ja: {
    title: '文字並び替えnPn',
    labelInput: '文字を入力（例: A,B,C または ABC）',
    placeholder: 'ここに入力...',
    hint: '※最大10文字推奨。多すぎると時間がかかります。',
    startBtn: '計算スタート',
    cancelBtn: '中止',
    statusReady: '準備完了',
    statusCalculating: '計算を実行しています...',
    statusCanceled: '計算を中止しました。',
    statusComplete: (count) => `計算が完了しました。合計 ${count.toLocaleString()} 通りの結果が見つかりました。`,
    alertEmpty: '文字を入力してください。',
    confirmHeavy: '10文字を超えると計算に時間がかかる可能性がありますが、よろしいですか？',
    errorWorker: 'エラーが発生しました。入力内容を確認してください。',
    labelPreview: (size) => `プレビュー（最初の${size}件）`,
    loadMore: `さらに${PAGE_SIZE}件表示`,
    saveTxt: '.txtで保存',
    saveMd: '.mdで保存',
    mdTitle: '並び替え結果',
    mdInput: '入力文字'
  },
  en: {
    title: 'Permutation nPn',
    labelInput: 'Enter characters (e.g., A,B,C or ABC)',
    placeholder: 'Type here...',
    hint: '*Max 10 chars recommended. Large inputs take time.',
    startBtn: 'Start Calculation',
    cancelBtn: 'Cancel',
    statusReady: 'Ready',
    statusCalculating: 'Calculating...',
    statusCanceled: 'Calculation canceled.',
    statusComplete: (count) => `Calculation complete. Found ${count.toLocaleString()} results.`,
    alertEmpty: 'Please enter characters.',
    confirmHeavy: 'Calculating more than 10 characters may take a while. Proceed?',
    errorWorker: 'An error occurred. Please check your input.',
    labelPreview: (size) => `Preview (First ${size} items)`,
    loadMore: `Show ${PAGE_SIZE} more`,
    saveTxt: 'Save as .txt',
    saveMd: 'Save as .md',
    mdTitle: 'Permutation Results',
    mdInput: 'Input characters'
  }
};

// Workerのソースコード
const workerCode = `
onmessage = function(e) {
  const chars = e.data;
  const results = [];
  const total = factorialize(chars.length);
  let count = 0;
  let lastReport = Date.now();

  function factorialize(num) {
    if (num <= 0) return 1;
    let res = 1;
    for (let i = 2; i <= num; i++) res *= i;
    return res;
  }

  function permute(arr, memo = []) {
    if (arr.length === 0) {
      results.push(memo.join(''));
      count++;
      
      const now = Date.now();
      if (now - lastReport > 200) {
        postMessage({ type: 'progress', progress: (count / total) * 100 });
        lastReport = now;
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice();
        let next = curr.splice(i, 1);
        permute(curr, memo.concat(next));
      }
    }
  }

  permute(chars);
  postMessage({ type: 'complete', results: results });
};
`;

const dom = {
  title: document.getElementById('title'),
  labelInput: document.querySelector('.input-group label'),
  input: document.getElementById('char-input'),
  hint: document.querySelector('.hint'),
  startBtn: document.getElementById('start-btn'),
  cancelBtn: document.getElementById('cancel-btn'),
  statusText: document.getElementById('status-text'),
  progressContainer: document.getElementById('progress-container'),
  progressFill: document.getElementById('progress-fill'),
  resultsContainer: document.getElementById('results-container'),
  labelPreview: document.querySelector('#results-container label'),
  resultsList: document.getElementById('results-list'),
  loadMoreBtn: document.getElementById('load-more-btn'),
  downloadTxt: document.getElementById('download-txt'),
  downloadMd: document.getElementById('download-md'),
  langJa: document.getElementById('lang-ja'),
  langEn: document.getElementById('lang-en')
};

function init() {
  dom.startBtn.addEventListener('click', startCalculation);
  dom.cancelBtn.addEventListener('click', cancelCalculation);
  dom.loadMoreBtn.addEventListener('click', showMoreResults);
  dom.downloadTxt.addEventListener('click', () => downloadFile('txt'));
  dom.downloadMd.addEventListener('click', () => downloadFile('md'));
  
  dom.langJa.addEventListener('click', () => setLanguage('ja'));
  dom.langEn.addEventListener('click', () => setLanguage('en'));
  
  updateUI();
}

function setLanguage(lang) {
  currentLang = lang;
  dom.langJa.classList.toggle('active', lang === 'ja');
  dom.langEn.classList.toggle('active', lang === 'en');
  updateUI();
}

function updateUI() {
  const t = translations[currentLang];
  dom.title.textContent = t.title;
  dom.labelInput.textContent = t.labelInput;
  dom.input.placeholder = t.placeholder;
  dom.hint.textContent = t.hint;
  dom.startBtn.textContent = t.startBtn;
  dom.cancelBtn.textContent = t.cancelBtn;
  dom.downloadTxt.textContent = t.saveTxt;
  dom.downloadMd.textContent = t.saveMd;
  dom.loadMoreBtn.textContent = t.loadMore;
  
  if (!dom.startBtn.disabled) {
    dom.statusText.textContent = t.statusReady;
  }
}

function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (workerBlobUrl) {
    URL.revokeObjectURL(workerBlobUrl);
    workerBlobUrl = null;
  }
}

function startCalculation() {
  const t = translations[currentLang];
  const input = dom.input.value.trim();
  if (!input) {
    alert(t.alertEmpty);
    return;
  }

  const chars = input.includes(',') ? input.split(',').map(s => s.trim()) : input.split('');
  
  if (chars.length > 10) {
    if (!confirm(t.confirmHeavy)) return;
  }

  allResults = [];
  displayedCount = 0;
  toggleCalculating(true);
  dom.resultsContainer.style.display = 'none';
  dom.progressContainer.style.display = 'block';
  dom.progressFill.style.width = '0%';
  dom.statusText.textContent = t.statusCalculating;

  terminateWorker();

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  workerBlobUrl = URL.createObjectURL(blob);
  worker = new Worker(workerBlobUrl);

  worker.onmessage = function(e) {
    if (e.data.type === 'progress') {
      const p = e.data.progress.toFixed(1);
      dom.progressFill.style.width = `${p}%`;
      dom.statusText.textContent = `${t.statusCalculating} ${p}%`;
    } else if (e.data.type === 'complete') {
      allResults = e.data.results;
      showInitialResults();
      toggleCalculating(false);
      terminateWorker();
    }
  };

  worker.onerror = function(err) {
    console.error('Worker error:', err);
    alert(t.errorWorker);
    toggleCalculating(false);
    terminateWorker();
  };

  worker.postMessage(chars);
}

function showInitialResults() {
  const t = translations[currentLang];
  dom.resultsContainer.style.display = 'block';
  dom.resultsList.textContent = '';
  displayedCount = 0;
  dom.labelPreview.textContent = t.labelPreview(PAGE_SIZE);
  showMoreResults();
  dom.statusText.textContent = t.statusComplete(allResults.length);
  dom.progressFill.style.width = '100%';
}

function showMoreResults() {
  const nextLimit = Math.min(displayedCount + PAGE_SIZE, allResults.length);
  let fragment = '';
  for (let i = displayedCount; i < nextLimit; i++) {
    fragment += `${i + 1}. ${allResults[i]}\n`;
  }
  
  const textNode = document.createTextNode(fragment);
  dom.resultsList.appendChild(textNode);
  displayedCount = nextLimit;

  dom.loadMoreBtn.style.display = displayedCount < allResults.length ? 'block' : 'none';
}

function cancelCalculation() {
  const t = translations[currentLang];
  if (worker) {
    terminateWorker();
    toggleCalculating(false);
    dom.statusText.textContent = t.statusCanceled;
  }
}

function toggleCalculating(val) {
  dom.startBtn.disabled = val;
  dom.cancelBtn.disabled = !val;
  dom.input.disabled = val;
}

function downloadFile(format) {
  if (allResults.length === 0) return;
  const t = translations[currentLang];

  const inputText = dom.input.value.trim();
  let baseName = inputText.replace(/[\\/:*?"<>|]/g, '').slice(0, 50) || 'results';
  
  let content = allResults.map((res, i) => `${i + 1}. ${res}`).join('\n');
  let filename = `${baseName}.${format}`;
  let type = 'text/plain';

  if (format === 'md') {
    content = `# ${t.mdTitle}\n\n${t.mdInput}: ${inputText}\n${translations[currentLang].statusComplete(allResults.length)}\n\n\`\`\`\n${content}\n\`\`\``;
    type = 'text/markdown';
  }

  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

init();
