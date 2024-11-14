// URL에서 token 파라미터 추출
function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

// 데이터 처리 및 그래프 업데이트
function processSpreadsheetData(response) {
  const token = getTokenFromURL();
  if (!token) {
    alert('유효한 토큰이 필요합니다.');
    return;
  }

  const dataTable = response.getDataTable();

  // 열 이름 가져오기
  const headers = [];
  for (let i = 0; i < dataTable.getNumberOfColumns(); i++) {
    headers.push(dataTable.getColumnLabel(i));
  }

  const tokenIndex = headers.indexOf('Token');
  if (tokenIndex === -1) {
    alert('Token 열을 찾을 수 없습니다.');
    return;
  }

  // 토큰에 해당하는 행 찾기
  let targetRow = null;
  for (let i = 0; i < dataTable.getNumberOfRows(); i++) {
    const cellValue = dataTable.getValue(i, tokenIndex);
    if (cellValue === token) {
      targetRow = i;
      break;
    }
  }

  if (targetRow === null) {
    alert('토큰에 해당하는 데이터를 찾을 수 없습니다.');
    return;
  }

  // 각 점수의 인덱스 찾기
  const controlFailIndex = headers.indexOf('controlfail');
  const salienceIndex = headers.indexOf('salience');
  const problemResultIndex = headers.indexOf('probleresult');

  // 점수 값 가져오기
  const controlFailScore = parseInt(dataTable.getValue(targetRow, controlFailIndex));
  const salienceScore = parseInt(dataTable.getValue(targetRow, salienceIndex));
  const problemResultScore = parseInt(dataTable.getValue(targetRow, problemResultIndex));

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

// 그래프 그리기 함수
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

// 스프레드시트 데이터 가져오기
function fetchData(callback) {
  const spreadsheetKey = '1ESc7JIag5FpJ3gp3JxuHIIvr8vRMVXw5dNT7sqlHeAI'; // 스프레드시트 키
  const sheetName = 'Smore-ResultSheet'; // 시트 이름

  // 쿼리 작성 (모든 열 선택)
  const query = encodeURIComponent('SELECT *');

  // 데이터 요청 URL 생성
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetKey}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tq=${query}`;

  // Google Visualization Query 객체 생성
  const queryObj = new google.visualization.Query(url);

  // 쿼리 전송 및 콜백 함수 지정
  queryObj.send(function(response) {
    if (response.isError()) {
      console.error('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
      return;
    } else {
      callback(response);
    }
  });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
  // Google Visualization API 로드
  google.charts.load('current', { packages: [] });

  // API 로드 후 데이터 가져오기 시작
  google.charts.setOnLoadCallback(function() {
    fetchData(processSpreadsheetData);
  });
});
