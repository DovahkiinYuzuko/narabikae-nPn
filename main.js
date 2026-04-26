// main.js
let worker = null;
let workerBlobUrl = null;
let allResults = [];
let displayedCount = 0;
const PAGE_SIZE = 500;

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

const inputEl = document.getElementById('char-input');
const startBtn = document.getElementById('start-btn');
const cancelBtn = document.getElementById('cancel-btn');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const resultsContainer = document.getElementById('results-container');
const resultsList = document.getElementById('results-list');
const loadMoreBtn = document.getElementById('load-more-btn');
const downloadTxtBtn = document.getElementById('download-txt');
const downloadMdBtn = document.getElementById('download-md');

function init() {
  startBtn.addEventListener('click', startCalculation);
  cancelBtn.addEventListener('click', cancelCalculation);
  loadMoreBtn.addEventListener('click', showMoreResults);
  downloadTxtBtn.addEventListener('click', () => downloadFile('txt'));
  downloadMdBtn.addEventListener('click', () => downloadFile('md'));
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
  const input = inputEl.value.trim();
  if (!input) {
    alert('文字を入力してください。');
    return;
  }

  const chars = input.includes(',') ? input.split(',').map(s => s.trim()) : input.split('');
  
  if (chars.length > 10) {
    if (!confirm('10文字を超えると計算に時間がかかる可能性がありますが、よろしいですか？')) return;
  }

  allResults = [];
  displayedCount = 0;
  toggleCalculating(true);
  resultsContainer.style.display = 'none';
  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  statusText.textContent = '計算を実行しています...';

  // 以前のWorkerが残っている場合は解放
  terminateWorker();

  // インラインWorkerの生成
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  workerBlobUrl = URL.createObjectURL(blob);
  worker = new Worker(workerBlobUrl);

  worker.onmessage = function(e) {
    if (e.data.type === 'progress') {
      const p = e.data.progress.toFixed(1);
      progressFill.style.width = `${p}%`;
      statusText.textContent = `計算を実行しています... ${p}%`;
    } else if (e.data.type === 'complete') {
      allResults = e.data.results;
      showInitialResults();
      toggleCalculating(false);
      terminateWorker(); // メモリ解放
    }
  };

  worker.onerror = function(err) {
    console.error('Worker error:', err);
    alert('エラーが発生しました。入力内容を確認してください。');
    toggleCalculating(false);
    terminateWorker(); // エラー時もメモリ解放
  };

  worker.postMessage(chars);
}

function showInitialResults() {
  resultsContainer.style.display = 'block';
  resultsList.textContent = '';
  displayedCount = 0;
  showMoreResults();
  statusText.textContent = `計算が完了しました。合計 ${allResults.length.toLocaleString()} 通りの結果が見つかりました。`;
  progressFill.style.width = '100%';
}

function showMoreResults() {
  const nextLimit = Math.min(displayedCount + PAGE_SIZE, allResults.length);
  let fragment = '';
  for (let i = displayedCount; i < nextLimit; i++) {
    fragment += `${i + 1}. ${allResults[i]}\n`;
  }
  
  const textNode = document.createTextNode(fragment);
  resultsList.appendChild(textNode);
  displayedCount = nextLimit;

  loadMoreBtn.style.display = displayedCount < allResults.length ? 'block' : 'none';
}

function cancelCalculation() {
  if (worker) {
    terminateWorker();
    toggleCalculating(false);
    statusText.textContent = '計算を中止しました。';
  }
}

function toggleCalculating(val) {
  startBtn.disabled = val;
  cancelBtn.disabled = !val;
  inputEl.disabled = val;
}

function downloadFile(format) {
  if (allResults.length === 0) return;

  // 入力文をファイル名のデフォルトにする（ファイル名に使えない文字を削除・置換）
  const inputText = inputEl.value.trim();
  let baseName = inputText.replace(/[\\/:*?"<>|]/g, '').slice(0, 50) || 'results';
  
  let content = allResults.map((res, i) => `${i + 1}. ${res}`).join('\n');
  let filename = `${baseName}.${format}`;
  let type = 'text/plain';

  if (format === 'md') {
    content = `# 並び替え結果\n\n入力文字: ${inputText}\n合計: ${allResults.length.toLocaleString()} 通り\n\n\`\`\`\n${content}\n\`\`\``;
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
