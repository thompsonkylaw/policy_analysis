import { jsPDF } from "jspdf";

// 扩展中文支持
jsPDF.API.events.push([
  'addFont',
  function (font) {
    if (font.postScriptName === 'NotoSansCJKtc') {
      font.metadata = {
        ...font.metadata,
        encoding: 'UnicodeCFF',
        weights: {
          normal: 'Normal',
          bold: 'Bold'
        }
      };
    }
  }
]);