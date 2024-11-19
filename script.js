// 에러 메시지를 표시할 함수
function displayErrorMessage() {
  const loadingMessage = document.getElementById('loading-message');
  const errorContainer = document.getElementById('error-message');
  const graphContainer = document.getElementById('graph-container');

  // 로딩 메시지 숨김
  loadingMessage.style.display = 'none';

  // 에러 메시지 표시
  errorContainer.innerHTML = '테스트 결과를 찾을 수 없어요!<br>지금 바로 테스트를 진행해보세요!';
  errorContainer.style.display = 'block';

  // 그래프 컨테이너 숨김
  graphContainer.style.display = 'none';
}

// 그래프를 표시할 함수
function displayGraph() {
  const loadingMessage = document.getElementById('loading-message');
  const errorContainer = document.getElementById('error-message');
  const graphContainer = document.getElementById('graph-container');

  // 로딩 메시지 숨김
  loadingMessage.style.display = 'none';

  // 에러 메시지 숨김
  errorContainer.style.display = 'none';

  // 그래프 컨테이너 표시
  graphContainer.style.display = 'block';
}

// 로딩 메시지 관리 함수
function manageLoadingMessages() {
  const loadingTextContent = document.getElementById('loading-text-content');
  const loadingMessages = ['테스트 내용을 분석하고있어요', '결과를 그래프로 만들고있어요'];
  let messageIndex = 0;

  // 첫 번째 메시지는 이미 설정되어 있으므로 3초 후에 두 번째 메시지로 변경
  setTimeout(() => {
    messageIndex = 1;
    loadingTextContent.textContent = loadingMessages[messageIndex];
  }, 3000);
}

// 로딩 메시지의 점 애니메이션 함수
function animateLoadingDots() {
  const loadingDots = document.getElementById('loading-dots');
  const dotPatterns = ['...', '..', '.', '...', '..', '.']; // 원하는 패턴
  let dotIndex = 0;

  return setInterval(() => {
    loadingDots.textContent = dotPatterns[dotIndex];
    dotIndex = (dotIndex + 1) % dotPatterns.length;
  }, 500);
}

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
    callback(null, data.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    // 에러를 콜백 함수로 전달하여 재시도 가능하도록 함
    callback(error, null);
  }
}

// 데이터 처리 및 그래프 업데이트
function processSpreadsheetData(rows) {
  const token = getTokenFromURL();
  console.log('Received token:', token); // 디버깅용

  if (!token || token === '{{ __UNSAFE_session_id__ }}') {
    // 토큰이 없으면 데이터 없음으로 처리
    return false;
  }

  // 토큰에 해당하는 행 찾기
  const targetRow = rows.find(row => row.Token === token);

  if (!targetRow) {
    // 데이터가 아직 없으면 false 반환
    return false;
  }

  // 데이터가 있으면 그래프를 업데이트하고 true 반환
  updateGraph(targetRow);
  return true;
}

// 그래프 업데이트 함수
function updateGraph(targetRow) {
  // 점수 값 가져오기
  const controlFailScore = parseInt(targetRow.controlfail);
  const salienceScore = parseInt(targetRow.salience);
  const problemResultScore = parseInt(targetRow.probleresult);

  // 각 점수의 퍼센트 계산
  const controlFailPercent = ((controlFailScore - 3) / (12 - 3)) * 75 + 25;
  const saliencePercent = ((salienceScore - 3) / (12 - 3)) * 75 + 25;
  const problemResultPercent = ((problemResultScore - 4) / (16 - 4)) * 75 + 25;

  // 퍼센트 값을 25%~100% 사이로 제한
  const clamp = (value) => Math.max(25, Math.min(100, value));

  const controlFailPercentClamped = clamp(controlFailPercent);
  const saliencePercentClamped = clamp(saliencePercent);
  const problemResultPercentClamped = clamp(problemResultPercent);

  // 그래프 바 및 라벨 업데이트
  const controlFailBar = document.querySelector('.bar-controlfail');
  const salienceBar = document.querySelector('.bar-salience');
  const problemResultBar = document.querySelector('.bar-probleresult');

  controlFailBar.setAttribute('data-percentage', controlFailPercentClamped.toFixed(0));
  salienceBar.setAttribute('data-percentage', saliencePercentClamped.toFixed(0));
  problemResultBar.setAttribute('data-percentage', problemResultPercentClamped.toFixed(0));

  controlFailBar.querySelector('.percent-label').innerText = `${controlFailPercentClamped.toFixed(0)}%`;
  salienceBar.querySelector('.percent-label').innerText = `${saliencePercentClamped.toFixed(0)}%`;
  problemResultBar.querySelector('.percent-label').innerText = `${problemResultPercentClamped.toFixed(0)}%`;

  // 그래프 표시
  displayGraph();

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
    const minBarWidth = maxBarWidth * 0.23; // 필요에 따라 조정
    const maxBarWidthAdjusted = maxBarWidth;

    const minPercentage = 25;
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
  const startTime = Date.now(); // 페이지 로드 시점

  // 로딩 메시지의 점 애니메이션 시작
  const dotsInterval = animateLoadingDots();

  // 로딩 메시지 관리 시작
  manageLoadingMessages();

  const initialDelay = 3000; // 첫 번째 로딩 메시지 시간 (3초)
  const secondDelay = 4000; // 두 번째 로딩 메시지 시간 (4초)
  const dataCheckInterval = 1000; // 데이터 탐색 간격 (1초)
  const maxTotalWaitTime = 10000; // 최대 전체 대기 시간 (10초)

  // 첫 번째 메시지 시간 후 데이터 로딩 시작
  setTimeout(function() {

    // 데이터 로딩 및 체크 함수
    const checkData = () => {
      fetchData(function(error, rows) {
        if (error) {
          // 데이터 가져오기 오류 발생 시, 재시도하도록 처리
          console.error('Error fetching data:', error);
        } else {
          const dataFound = processSpreadsheetData(rows);
          if (dataFound) {
            // 데이터가 있으면 점 애니메이션 중지
            clearInterval(dotsInterval);
            return; // 함수 종료
          }
        }
        // 데이터가 아직 없으면 최대 대기 시간 확인
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < maxTotalWaitTime) {
          // 다음 체크 예약
          setTimeout(checkData, dataCheckInterval);
        } else {
          // 최대 대기 시간을 초과하면 에러 메시지 표시
          clearInterval(dotsInterval);
          displayErrorMessage();
        }
      });
    };

    // 첫 번째 데이터 체크 실행
    checkData();
  }, initialDelay);

  // 총 대기 시간이 10초를 넘으면 에러 메시지 표시
  setTimeout(function() {
    clearInterval(dotsInterval);
    displayErrorMessage();
  }, maxTotalWaitTime);

});
