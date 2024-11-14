// URL에서 token 파라미터 추출
function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

// 스프레드시트 데이터 가져오기
async function fetchData(callback) {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRaIFrcF2feY9_ZSJUkcYylCBOHlYI0oMYP42kIqxMXCzHirnZ_KkeFIL0MVkw9exqy7845J-EN5AV7/pub?gid=501496085&single=true&output=csv';

  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // CSV 데이터 파싱
    const data = Papa.parse(csvText, { header: true });
    callback(data.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    alert('데이터를 가져올 수 없습니다.');
  }
}

// 데이터 처리 및 그래프 업데이트
function processSpreadsheetData(rows) {
  const token = getTokenFromURL();
  if (!token) {
    alert('유효한 토큰이 필요합니다.');
    return;
  }

  // 토큰에 해당하는 행 찾기
  const targetRow = rows.find(row => row.Token === token);

  if (!targetRow) {
    alert('토큰에 해당하는 데이터를 찾을 수 없습니다.');
    return;
  }

  // 점수 값 가져오기
  const controlFailScore = parseInt(targetRow.controlfail);
  const salienceScore = parseInt(targetRow.salience);
  const problemResultScore = parseInt(targetRow.probleresult);

  // 각 점수의 퍼센트 계산
  const controlFailPercent = ((controlFailScore - 3) / (12 - 3)) * 100;
  const saliencePercent = ((salienceScore - 3) / (12 - 3)) * 100;
  const problemResultPercent = ((problemResultScore - 4) / (16 - 4)) * 100;

  // 그래프 바 및 라벨 업데이트
  const controlFailBar = document.querySelector('.bar-controlfail');
  const salienceBar = document.querySelector('.bar-salience');
  const problemResultBar = document.querySelector('.bar-probleresult');

  controlFailBar.setAttribute('data-percentage', controlFailPercent.toFixed(0));
  salienceBar.setAttribute('data-percentage', saliencePercent.toFixed(0));
  problemResultBar.setAttribute('data-percentage', problemResultPercent.toFixed(0));

  controlFailBar.querySelector('.percent-label').innerText = `${controlFailPercent.toFixed(0)}%`;
  salienceBar.querySelector('.percent-label').innerText = `${saliencePercent.toFixed(0)}%`;
  problemResultBar.querySelector('.percent-label').innerText = `${problemResultPercent.toFixed(0)}%`;

  // 그래프 다시 그리기
  drawGraphs();
}

// 그래프 그리기 함수 (기존과 동일)
function drawGraphs() {
  const bars = document.querySelectorAll('.bar-common');

  bars.forEach(function(bar) {
    const percentage = parseFloat(bar.getAttribute('data-percentage'));

    // 그래프 셀의 너비 가져오기
    const graphCellWidth = bar.parentElement.offsetWidth;
    const maxBarWidth = graphCellWidth - 15; // 오른쪽에 15px 여백 남기기

    // 최소 및 최대 바 너비 설정
    const minBarWidth = maxBarWidth * 0.5; // 필요에 따라 조정
    const maxBarWidthAdjusted = maxBarWidth;

    const minPercentage = 0;
    const maxPercentage = 100;

    // 퍼센트 값을 0과 1 사이로 정규화
    const normalizedPercentage = (percentage - minPercentage) / (maxPercentage - minPercentage);

    // 비선형 스케일링 적용
    const scaledPercentage = Math.pow(normalizedPercentage, 0.7);

    // 바의 실제 너비 계산
    const width = minBarWidth + scaledPercentage * (maxBarWidthAdjusted - minBarWidth);

    // 계산된 너비를 바에 적용
    bar.style.width = width + 'px';
  });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
  fetchData(processSpreadsheetData);
});
