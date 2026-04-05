
/**
 * 检测文本是否包含中文
 */
function hasChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

export default function formatDialogue(dialogue, type) {
  if (typeof dialogue !== 'string') return;

  let charCount;

  if (type === 'quest') {
    charCount = 20;
  } else if (type === 'characterSelection') {
    charCount = 80;  // 进一步增加角色选择界面的每行字符数到 80
  } else {
    charCount = 40;
  }

  let result = [''];
  let numArr = 0;
  
  // 检测是否包含中文
  const isChinese = hasChinese(dialogue);
  
  if (isChinese) {
    // 中文处理：按字符数换行
    for (let i = 0; i < dialogue.length; i++) {
      if (result[numArr].length >= charCount) {
        result[++numArr] = '';
      }
      result[numArr] += dialogue[i];
    }
  } else {
    // 英文处理：按单词分割
    const dialogues = dialogue.split(' ');
    dialogues.forEach((word, i) => {
      if ((result[numArr] + dialogues[i]).length > charCount) {
        result[++numArr] = dialogues[i] + ' ';
      } else {
        result[numArr] += dialogues[i] + ' ';
      }
    });
  }
  
  // 过滤掉空字符串和只包含空格的行
  result = result.filter(line => line.trim().length > 0);
  
  return result;
}
